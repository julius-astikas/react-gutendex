import { useEffect, useState } from 'react'

function useBooks(url) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [next, setNext] = useState(null)
  const [previous, setPrevious] = useState(null)
  const [sourceUrl, setSourceUrl] = useState(url)
  const [currentUrl, setCurrentUrl] = useState(url)
  const [attempt, setAttempt] = useState(0)

  if (url !== sourceUrl) {
    setSourceUrl(url)
    setCurrentUrl(url)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadBooks() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(currentUrl, { signal: controller.signal })

        if (!response.ok) {
          throw new Error('Could not load books')
        }

        const data = await response.json()

        if (controller.signal.aborted) {
          return
        }

        setBooks(data.results)
        setNext(data.next)
        setPrevious(data.previous)
      } catch (loadError) {
        if (loadError.name === 'AbortError') {
          return
        }

        setError('Could not load books.')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadBooks()

    return () => {
      controller.abort()
    }
  }, [currentUrl, attempt])

  function goToPage(pageUrl) {
    if (!pageUrl) {
      return
    }

    setLoading(true)
    setError(null)
    setCurrentUrl(pageUrl)
  }

  function retry() {
    setLoading(true)
    setError(null)
    setAttempt((value) => value + 1)
  }

  return { books, loading, error, next, previous, goToPage, retry }
}

export default useBooks
