import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import styles from './BookDetails.module.css'

const readFormats = ['text/html', 'application/epub+zip', 'text/plain']

function getReadUrl(formats) {
  if (!formats) {
    return null
  }

  for (const type of readFormats) {
    const match = Object.keys(formats).find(
      (key) => key === type || key.startsWith(`${type};`),
    )

    if (match) {
      return formats[match]
    }
  }

  return null
}

function BookDetails() {
  const { id } = useParams()
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadBook() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`https://gutendex.com/books/${id}`)

        if (!response.ok) {
          throw new Error('Could not load book')
        }

        const data = await response.json()
        setBook(data)
      } catch {
        setError('Could not load book.')
      } finally {
        setLoading(false)
      }
    }

    loadBook()
  }, [id])

  if (loading) {
    return <p className="message">Loading book...</p>
  }

  if (error) {
    return <p className="message error">{error}</p>
  }

  const authors =
    book.authors && book.authors.length > 0
      ? book.authors.map((author) => author.name).join(', ')
      : ''
  const cover = book.formats?.['image/jpeg']
  const readUrl = getReadUrl(book.formats)
  const saved = isFavorite(book.id)

  return (
    <section>
      <h1>{book.title}</h1>
      <div className={styles.layout}>
        {cover && <img className={styles.cover} src={cover} alt={book.title} />}
        <div className={styles.info}>
          {authors && <p>{authors}</p>}
          <p>Downloads: {book.download_count}</p>
          {book.subjects && book.subjects.length > 0 && (
            <ul className={styles.subjects}>
              {book.subjects.map((subject) => (
                <li key={subject}>{subject}</li>
              ))}
            </ul>
          )}
          {book.languages && book.languages.length > 0 && (
            <p>Languages: {book.languages.join(', ')}</p>
          )}
          {readUrl && (
            <a
              className={styles.readLink}
              href={readUrl}
              target="_blank"
              rel="noreferrer"
            >
              Read / Download book
            </a>
          )}
          <button
            type="button"
            onClick={() =>
              saved ? removeFavorite(book.id) : addFavorite(book)
            }
          >
            {saved ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default BookDetails
