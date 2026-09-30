import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BookList from '../components/BookList'
import Pagination from '../components/Pagination'

function Home() {
  const [searchParams] = useSearchParams()
  const search = searchParams.get('search')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [next, setNext] = useState(null)
  const [previous, setPrevious] = useState(null)

  async function loadBooks(url) {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Could not load books')
      }

      const data = await response.json()
      setBooks(data.results)
      setNext(data.next)
      setPrevious(data.previous)
    } catch {
      setError('Could not load books.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const url = search
      ? `https://gutendex.com/books/?search=${encodeURIComponent(search)}`
      : 'https://gutendex.com/books/'

    async function loadFirstPage() {
      await loadBooks(url)
    }

    loadFirstPage()
  }, [search])

  return (
    <section>
      <h1>{search ? `Search results for: ${search}` : 'Gutendex Books'}</h1>
      {loading && <p className="message">Loading books...</p>}
      {error && <p className="message error">{error}</p>}
      {!loading && !error && books.length === 0 && (
        <p className="message">No books found.</p>
      )}
      {!loading && !error && books.length > 0 && (
        <>
          <BookList books={books} />
          <Pagination
            next={next}
            previous={previous}
            onPageChange={loadBooks}
          />
        </>
      )}
    </section>
  )
}

export default Home
