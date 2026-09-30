import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories } from '../../constants/categories'
import styles from './Header.module.css'

function Header() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()

    const text = query.trim()

    if (!text) {
      return
    }

    navigate(`/?search=${encodeURIComponent(text)}`)
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/">Home</Link>
        <Link to="/favorites">Favorites</Link>
      </nav>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search books"
          aria-label="Search books"
        />
        <button type="submit">Search</button>
      </form>

      <nav className={styles.nav}>
        {categories.map((category) => (
          <Link key={category} to={`/category/${category.toLowerCase()}`}>
            {category}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export default Header
