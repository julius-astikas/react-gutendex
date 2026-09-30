import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BookList from '../components/BookList'
import Pagination from '../components/Pagination'

function Category() {
  const { category } = useParams()
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
    async function loadFirstPage() {
      await loadBooks(
        `https://gutendex.com/books/?topic=${encodeURIComponent(category)}`,
      )
    }

    loadFirstPage()
  }, [category])

  return (
    <section>
      <h1>Category: {category}</h1>
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

export default Category
