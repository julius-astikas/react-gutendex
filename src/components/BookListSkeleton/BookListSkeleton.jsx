import styles from './BookListSkeleton.module.css'

const cards = [1, 2, 3, 4, 5, 6, 7, 8]

function BookListSkeleton() {
  return (
    <ul className={styles.list} aria-busy="true" aria-label="Loading books">
      {cards.map((card) => (
        <li key={card} className={styles.card}>
          <span className={styles.media} />
          <span className={styles.body}>
            <span className={styles.title} />
            <span className={styles.author} />
          </span>
        </li>
      ))}
    </ul>
  )
}

export default BookListSkeleton
