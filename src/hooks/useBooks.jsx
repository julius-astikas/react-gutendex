import { useEffect, useState } from 'react'

const booksCache = new Map()
const prefetchRequests = new Map()

const CACHE_PREFIX = 'gutendex_cache:'
const CACHE_TTL_MS = 30 * 60 * 1000
const REQUEST_TIMEOUT_MS = 20000
const RETRY_DELAY_MS = 700

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError())
      return
    }

    const timeoutId = setTimeout(resolve, ms)

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

function createTimeoutError() {
  const error = new Error('timeout')
  error.name = 'TimeoutError'
  return error
}

function isRetryableError(error) {
  return (
    error.name === 'TimeoutError' ||
    error.name === 'TypeError' ||
    error.message === 'Failed to fetch'
  )
}

function getCachedBooks(url) {
  if (booksCache.has(url)) {
    return booksCache.get(url)
  }

  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${url}`)

    if (!raw) {
      return null
    }

    const entry = JSON.parse(raw)

    if (!entry?.data || !entry.timestamp) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${url}`)
      return null
    }

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(`${CACHE_PREFIX}${url}`)
      return null
    }

    booksCache.set(url, entry.data)
    return entry.data
  } catch {
    return null
  }
}

function setCachedBooks(url, data) {
  booksCache.set(url, data)

  try {
    sessionStorage.setItem(
      `${CACHE_PREFIX}${url}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    )
  } catch {
    // sessionStorage may be unavailable; memory cache still works
  }
}

async function fetchBooksOnce(url, externalSignal) {
  const controller = new AbortController()
  let timedOut = false

  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  function onExternalAbort() {
    clearTimeout(timeoutId)
    controller.abort()
  }

  if (externalSignal.aborted) {
    clearTimeout(timeoutId)
    throw createAbortError()
  }

  externalSignal.addEventListener('abort', onExternalAbort)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error('Could not load books')
    }

    const data = await response.json()

    return {
      results: data.results,
      next: data.next,
      previous: data.previous,
    }
  } catch (error) {
    if (externalSignal.aborted) {
      throw createAbortError()
    }

    if (timedOut) {
      throw createTimeoutError()
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
    externalSignal.removeEventListener('abort', onExternalAbort)
  }
}

async function fetchBooksWithRetry(url, externalSignal) {
  let lastError = null

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    if (externalSignal.aborted) {
      throw createAbortError()
    }

    try {
      const data = await fetchBooksOnce(url, externalSignal)
      setCachedBooks(url, data)
      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error
      }

      lastError = error

      if (attempt < 2 && isRetryableError(error)) {
        await wait(RETRY_DELAY_MS, externalSignal)
        continue
      }

      throw error
    }
  }

  throw lastError
}

async function loadBooksData(url, externalSignal) {
  const cached = getCachedBooks(url)

  if (cached) {
    return cached
  }

  if (prefetchRequests.has(url)) {
    const data = await prefetchRequests.get(url)

    if (externalSignal.aborted) {
      throw createAbortError()
    }

    if (data) {
      return data
    }
  }

  return fetchBooksWithRetry(url, externalSignal)
}

function prefetchBooks(url) {
  if (!url) {
    return Promise.resolve(null)
  }

  const cached = getCachedBooks(url)

  if (cached) {
    return Promise.resolve(cached)
  }

  if (prefetchRequests.has(url)) {
    return prefetchRequests.get(url)
  }

  const controller = new AbortController()

  const request = fetchBooksWithRetry(url, controller.signal)
    .then((data) => data)
    .catch(() => null)
    .finally(() => {
      prefetchRequests.delete(url)
    })

  prefetchRequests.set(url, request)
  return request
}

function useBooks(url) {
  const cachedPage = getCachedBooks(url)
  const [books, setBooks] = useState(cachedPage?.results ?? [])
  const [loading, setLoading] = useState(!cachedPage)
  const [error, setError] = useState(null)
  const [next, setNext] = useState(cachedPage?.next ?? null)
  const [previous, setPrevious] = useState(cachedPage?.previous ?? null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadBooks() {
      const cached = getCachedBooks(url)

      if (cached) {
        setBooks(cached.results)
        setNext(cached.next)
        setPrevious(cached.previous)
        setError(null)
        setLoading(false)

        if (cached.next) {
          prefetchBooks(cached.next)
        }

        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await loadBooksData(url, controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setBooks(data.results)
        setNext(data.next)
        setPrevious(data.previous)
        setLoading(false)

        if (data.next) {
          prefetchBooks(data.next)
        }
      } catch (loadError) {
        if (loadError.name === 'AbortError' || controller.signal.aborted) {
          return
        }

        setError('Could not load books.')
        setLoading(false)
      }
    }

    loadBooks()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  function retry() {
    setAttempt((value) => value + 1)
  }

  return { books, loading, error, next, previous, retry }
}

export { prefetchBooks }
export default useBooks
