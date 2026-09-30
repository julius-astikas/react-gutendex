import styles from './Pagination.module.css'

function Pagination({ next, previous, onPageChange }) {
  return (
    <div className={styles.pagination}>
      <button
        type="button"
        onClick={() => onPageChange(previous)}
        disabled={previous === null}
      >
        Previous
      </button>
      <button
        type="button"
        onClick={() => onPageChange(next)}
        disabled={next === null}
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
