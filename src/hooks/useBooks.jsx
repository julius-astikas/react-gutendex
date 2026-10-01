import { useEffect, useState } from 'react'
import { getFirstPageSnapshot } from '../data/firstPageSnapshots'

const booksCache = new Map()
const prefetchRequests = new Map()

const CACHE_PREFIX = 'gutendex_cache:'
const CACHE_TTL_MS = 30 * 60 * 1000
const RETRY_DELAY_MS = 700
const SLOW_LOADING_MS = 5000
const NEXT_PREFETCH_DELAY_MS = 1500

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError())
      return
    }

    const timeoutId = setTimeout(resolve, ms)

    if (!signal) {
      return
    }

    function onAbort() {
      clearTimeout(timeoutId)
      reject(createAbortError())
    }

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function createAbortError() {
  const error = new Error('Aborted')
  error.name = 'AbortError'
  return error
}

function isNetworkError(error) {
  return error.name === 'TypeError' || error.message === 'Failed to fetch'
}

function canonicalBooksUrl(url) {
  try {
    const parsed = new URL(url)
    const page = parsed.searchParams.get('page')
    const topic = parsed.searchParams.get('topic')
    const search = parsed.searchParams.get('search')
    const params = new URLSearchParams()

    if (page && page !== '1') {
      params.set('page', page)
    }

    if (topic) {
      params.set('topic', topic.toLowerCase())
    }

    if (search) {
      params.set('search', search)
    }

    const query = params.toString()
    return query
      ? `https://gutendex.com/books/?${query}`
      : 'https://gutendex.com/books/'
  } catch {
    return url
  }
}

function getCachedBooks(url) {
  const key = canonicalBooksUrl(url)

  if (booksCache.has(key)) {
    return booksCache.get(key)
  }

  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${key}`)

    if (!raw) {
      return null
    }

    const entry = JSON.parse(raw)

    if (!entry?.data || !entry.timestamp) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    booksCache.set(key, entry.data)
    return entry.data
  } catch {
    return null
  }
}

function setCachedBooks(url, data) {
  const key = canonicalBooksUrl(url)
  booksCache.set(key, data)

  try {
    sessionStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    )
  } catch {
    // sessionStorage may be unavailable; memory cache still works
  }
}

function formatTopicLabel(topic) {
  if (!topic) {
    return ''
  }

  return topic.charAt(0).toUpperCase() + topic.slice(1)
}

function destinationFromApiUrl(apiUrl) {
  const parsed = new URL(apiUrl)
  const topic = parsed.searchParams.get('topic')
  const search = parsed.searchParams.get('search')
  const page = parsed.searchParams.get('page')
  const hasPage = page && page !== '1'

  if (topic) {
    const label = hasPage
      ? `${formatTopicLabel(topic)} · page ${page}`
      : formatTopicLabel(topic)
    const to = hasPage
      ? `/category/${topic.toLowerCase()}?page=${page}`
      : `/category/${topic.toLowerCase()}`

    return { label, to }
  }

  if (search) {
    const params = new URLSearchParams()
    params.set('search', search)

    if (hasPage) {
      params.set('page', page)
    }

    return {
      label: hasPage ? `Search: ${search} · page ${page}` : `Search: ${search}`,
      to: `/?${params.toString()}`,
    }
  }

  if (hasPage) {
    return {
      label: `Home · page ${page}`,
      to: `/?page=${page}`,
    }
  }

  return {
    label: 'Home',
    to: '/',
  }
}

function getCachedBookDestinations(currentApiUrl, max = 5) {
  const destinations = []

  try {
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index)

      if (!key || !key.startsWith(CACHE_PREFIX)) {
        continue
      }

      const apiUrl = key.slice(CACHE_PREFIX.length)

      if (!apiUrl || apiUrl === currentApiUrl) {
        continue
      }

      const raw = sessionStorage.getItem(key)

      if (!raw) {
        continue
      }

      const entry = JSON.parse(raw)

      if (!entry?.data || !entry.timestamp) {
        continue
      }

      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        continue
      }

      const destination = destinationFromApiUrl(apiUrl)

      destinations.push({
        ...destination,
        apiUrl,
        timestamp: entry.timestamp,
      })
    }
  } catch {
    return []
  }

  destinations.sort((a, b) => b.timestamp - a.timestamp)
  return destinations.slice(0, max)
}

async function fetchBooksOnce(url, signal) {
  const response = await fetch(url, signal ? { signal } : undefined)

  if (!response.ok) {
    throw new Error('Could not load books')
  }

  const data = await response.json()

  return {
    results: data.results,
    next: data.next,
    previous: data.previous,
  }
}

async function fetchBooksWithRetry(url, signal) {
  try {
    const data = await fetchBooksOnce(url, signal)
    setCachedBooks(url, data)
    return data
  } catch (error) {
    if (error.name === 'AbortError' || signal?.aborted) {
      throw createAbortError()
    }

    if (!isNetworkError(error)) {
      throw error
    }

    await wait(RETRY_DELAY_MS, signal)

    const data = await fetchBooksOnce(url, signal)
    setCachedBooks(url, data)
    return data
  }
}

function prefetchBooks(url) {
  if (!url) {
    return Promise.resolve(null)
  }

  const key = canonicalBooksUrl(url)
  const cached = getCachedBooks(url)

  if (cached) {
    return Promise.resolve(cached)
  }

  if (prefetchRequests.has(key)) {
    return prefetchRequests.get(key)
  }

  const request = fetchBooksWithRetry(url, null)
    .catch(() => null)
    .finally(() => {
      if (prefetchRequests.get(key) === request) {
        prefetchRequests.delete(key)
      }
    })

  prefetchRequests.set(key, request)
  return request
}

function scheduleNextPrefetch(nextUrl) {
  if (!nextUrl) {
    return () => {}
  }

  const timeoutId = setTimeout(() => {
    prefetchBooks(nextUrl)
  }, NEXT_PREFETCH_DELAY_MS)

  return () => {
    clearTimeout(timeoutId)
  }
}

async function loadForegroundBooks(url, signal) {
  const cached = getCachedBooks(url)

  if (cached) {
    return cached
  }

  const prefetchKey = canonicalBooksUrl(url)

  if (prefetchRequests.has(prefetchKey)) {
    const prefetched = await prefetchRequests.get(prefetchKey)

    if (signal.aborted) {
      throw createAbortError()
    }

    if (prefetched) {
      return prefetched
    }
  }

  return fetchBooksWithRetry(url, signal)
}

function applyPage(page, setBooks, setNext, setPrevious) {
  setBooks(page.results)
  setNext(page.next)
  setPrevious(page.previous)
}

function useBooks(url) {
  const initialPage = getCachedBooks(url) ?? getFirstPageSnapshot(url)
  const [appliedUrl, setAppliedUrl] = useState(url)
  const [books, setBooks] = useState(initialPage?.results ?? [])
  const [loading, setLoading] = useState(!initialPage)
  const [slowLoading, setSlowLoading] = useState(false)
  const [error, setError] = useState(null)
  const [next, setNext] = useState(initialPage?.next ?? null)
  const [previous, setPrevious] = useState(initialPage?.previous ?? null)
  const [attempt, setAttempt] = useState(0)

  const urlChanged = appliedUrl !== url
  const instantPage = urlChanged
    ? getCachedBooks(url) ?? getFirstPageSnapshot(url)
    : null

  useEffect(() => {
    const controller = new AbortController()
    let cancelPrefetch = () => {}
    let slowTimerId = null

    async function loadBooks() {
      setSlowLoading(false)

      const cached = getCachedBooks(url)

      if (cached) {
        applyPage(cached, setBooks, setNext, setPrevious)
        setError(null)
        setLoading(false)
        setAppliedUrl(url)
        cancelPrefetch = scheduleNextPrefetch(cached.next)
        return
      }

      const snapshot = getFirstPageSnapshot(url)

      if (snapshot) {
        applyPage(snapshot, setBooks, setNext, setPrevious)
        setError(null)
        setLoading(false)
        setAppliedUrl(url)
      } else {
        setLoading(true)
        setError(null)
        setAppliedUrl(url)

        slowTimerId = setTimeout(() => {
          if (!controller.signal.aborted) {
            setSlowLoading(true)
          }
        }, SLOW_LOADING_MS)
      }

      try {
        const data = snapshot
          ? await fetchBooksWithRetry(url, controller.signal)
          : await loadForegroundBooks(url, controller.signal)

        if (controller.signal.aborted) {
          return
        }

        clearTimeout(slowTimerId)
        setSlowLoading(false)
        applyPage(data, setBooks, setNext, setPrevious)
        setError(null)
        setLoading(false)
        cancelPrefetch = scheduleNextPrefetch(data.next)
      } catch {
        if (controller.signal.aborted) {
          return
        }

        clearTimeout(slowTimerId)
        setSlowLoading(false)
        setLoading(false)

        if (snapshot) {
          setError(null)
          return
        }

        setError('Could not load books.')
      }
    }

    loadBooks()

    return () => {
      controller.abort()
      cancelPrefetch()
      clearTimeout(slowTimerId)
    }
  }, [url, attempt])

  function retry() {
    setAttempt((value) => value + 1)
  }

  return {
    books: instantPage ? instantPage.results : books,
    loading: urlChanged ? !instantPage : loading,
    slowLoading: urlChanged ? false : slowLoading,
    error: urlChanged ? null : error,
    next: instantPage ? instantPage.next : next,
    previous: instantPage ? instantPage.previous : previous,
    retry,
  }
}

export { getCachedBookDestinations }
export default useBooks
