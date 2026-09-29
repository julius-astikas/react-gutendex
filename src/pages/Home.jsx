import { useEffect, useState } from 'react'

function Home() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadBooks() {
      try {
        const response = await fetch('https://gutendex.com/books/')

        if (!response.ok) {
          throw new Error('Could not load books')
        }

        const data = await response.json()
        setBooks(data.results)
      } catch {
        setError('Could not load books.')
      } finally {
        setLoading(false)
      }
    }

    loadBooks()
  }, [])

  return (
    <section>
      <h1>Gutendex Books</h1>
      {loading && <p>Loading books...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              <h2>{book.title}</h2>
              {book.authors && book.authors.length > 0 && (
                <p>{book.authors.map((author) => author.name).join(', ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Home
