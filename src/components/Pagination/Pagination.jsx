import { useEffect, useRef, useState } from 'react'
import styles from './Pagination.module.css'

function scrollToTop() {
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  window.scrollTo({
    top: 0,
    behavior: reduceMotion ? 'auto' : 'smooth',
  })
}

function Pagination({ next, previous, loading, onPageChange }) {
  const [pendingDirection, setPendingDirection] = useState(null)
  const pendingRef = useRef(null)

  useEffect(() => {
    if (!loading) {
      pendingRef.current = null
    }
  }, [loading, next, previous])

  function changePage(direction, pageUrl) {
    if (!pageUrl || loading || pendingRef.current) {
      return
    }

    pendingRef.current = direction
    setPendingDirection(direction)
    scrollToTop()
    onPageChange(pageUrl)
  }

  const previousDisabled = loading || !previous
  const nextDisabled = loading || !next

  return (
    <div className={styles.pagination}>
      <button
        type="button"
        onClick={() => changePage('previous', previous)}
        disabled={previousDisabled}
      >
        {loading && pendingDirection === 'previous' ? 'Loading…' : 'Previous'}
      </button>
      <button
        type="button"
        onClick={() => changePage('next', next)}
        disabled={nextDisabled}
      >
        {loading && pendingDirection === 'next' ? 'Loading…' : 'Next'}
      </button>
    </div>
  )
}

export default Pagination
