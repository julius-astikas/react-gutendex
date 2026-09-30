import { Link } from 'react-router-dom'
import styles from './BookList.module.css'

function BookList({ books }) {
  return (
    <ul className={styles.list}>
      {books.map((book) => {
        const cover = book.formats?.['image/jpeg']
        const authors =
          book.authors && book.authors.length > 0
            ? book.authors.map((author) => author.name).join(', ')
            : ''

        return (
          <li key={book.id} className={styles.card}>
            <Link
              className={styles.link}
              to={`/book/${book.id}`}
              state={{ book }}
            >
              <span className={styles.media}>
                {cover ? (
                  <img
                    className={styles.cover}
                    src={cover}
                    alt={book.title}
                    loading="lazy"
                  />
                ) : (
                  <span className={styles.placeholder}>
                    <svg
                      className={styles.placeholderIcon}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 0-3 3z" />
                      <path d="M5 4.5A3 3 0 0 1 8 7.5h10" />
                    </svg>
                    <span>No cover</span>
                  </span>
                )}
              </span>
              <span className={styles.body}>
                <h2>{book.title}</h2>
                {authors && <p>{authors}</p>}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default BookList
