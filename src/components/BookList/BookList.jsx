import { Link } from 'react-router-dom'
import styles from './BookList.module.css'

function BookList({ books }) {
  return (
    <ul className={styles.list}>
      {books.map((book) => (
        <li key={book.id} className={styles.card}>
          <h2>
            <Link to={`/book/${book.id}`}>{book.title}</Link>
          </h2>
          {book.authors && book.authors.length > 0 && (
            <p>{book.authors.map((author) => author.name).join(', ')}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

export default BookList
