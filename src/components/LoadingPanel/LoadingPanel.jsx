import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCachedBookDestinations } from '../../hooks/useBooks'
import styles from './LoadingPanel.module.css'

function LoadingPanel({ slowLoading, hasPreviousResults, currentApiUrl }) {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default'
  const cachedDestinations = slowLoading
    ? getCachedBookDestinations(currentApiUrl)
    : []

  let message = 'Loading books…'

  if (hasPreviousResults && slowLoading) {
    message =
      'Still loading — Gutendex is responding slowly. Previous results are still available below.'
  } else if (hasPreviousResults) {
    message = 'Loading new results — previous results are still available below.'
  } else if (slowLoading) {
    message = 'Still loading — Gutendex is responding slowly…'
  }

  return (
    <div className={styles.panel} role="status" aria-live="polite">
      <p className={styles.message}>{message}</p>

      <div className={styles.actions}>
        {canGoBack && (
          <button type="button" onClick={() => navigate(-1)}>
            Back
          </button>
        )}
        <Link className={styles.favoritesLink} to="/favorites">
          Favorites
        </Link>
      </div>

      {slowLoading && cachedDestinations.length > 0 && (
        <div className={styles.cached}>
          <p className={styles.cachedTitle}>Available instantly</p>
          <div className={styles.chips}>
            {cachedDestinations.map((destination) => (
              <Link
                key={destination.apiUrl}
                className={styles.chip}
                to={destination.to}
              >
                {destination.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LoadingPanel
