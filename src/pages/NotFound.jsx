import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Back to Home</Link>
    </section>
  )
}

export default NotFound
