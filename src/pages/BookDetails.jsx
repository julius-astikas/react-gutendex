import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
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

function HeartIcon({ filled }) {
  return (
    <svg
      className={filled ? styles.heartFilled : styles.icon}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
    </svg>
  )
}

function BookDetails() {
  const { id } = useParams()
  const location = useLocation()
  const passedBook = location.state?.book
  const instantBook =
    passedBook && String(passedBook.id) === String(id) ? passedBook : null
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  const [fetchedBook, setFetchedBook] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (instantBook) {
      return
    }

    const controller = new AbortController()

    async function loadBook() {
      try {
        setError(null)

        const response = await fetch(`https://gutendex.com/books/${id}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load book')
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setFetchedBook(data)
        }
      } catch (loadError) {
        if (loadError.name === 'AbortError') {
          return
        }

        setError('Could not load book.')
      }
    }

    loadBook()

    return () => {
      controller.abort()
    }
  }, [id, instantBook, attempt])

  const book =
    instantBook ||
    (fetchedBook && String(fetchedBook.id) === String(id) ? fetchedBook : null)

  if (!book && error) {
    return (
      <div className="message error">
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
      </div>
    )
  }

  if (!book) {
    return (
      <div className={styles.skeleton} aria-busy="true" aria-label="Loading book">
        <span className={styles.skeletonCover} />
        <span className={styles.skeletonInfo}>
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLine} />
        </span>
      </div>
    )
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
          {authors && <p className={styles.authors}>{authors}</p>}
          <p className={styles.meta}>
            <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v10" />
              <path d="M8 10l4 4 4-4" />
              <path d="M5 19h14" />
            </svg>
            Downloads: {book.download_count}
          </p>
          {book.languages && book.languages.length > 0 && (
            <p>Languages: {book.languages.join(', ')}</p>
          )}
          {book.subjects && book.subjects.length > 0 && (
            <div>
              <p className={styles.label}>Categories / Subjects</p>
              <ul className={styles.subjects}>
                {book.subjects.map((subject) => (
                  <li key={subject}>{subject}</li>
                ))}
              </ul>
            </div>
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
            className={saved ? styles.saved : undefined}
            type="button"
            onClick={() =>
              saved ? removeFavorite(book.id) : addFavorite(book)
            }
          >
            <HeartIcon filled={saved} />
            {saved ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default BookDetails
