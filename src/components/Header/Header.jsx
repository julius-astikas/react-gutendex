import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { categories } from '../../constants/categories'
import { prefetchBooks } from '../../hooks/useBooks'
import styles from './Header.module.css'

const HOME_BOOKS_URL = 'https://gutendex.com/books/'

function HomeIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l5 5" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function getCategoryUrl(category) {
  return `https://gutendex.com/books/?topic=${encodeURIComponent(
    category.toLowerCase(),
  )}`
}

function Header() {
  const [searchParams] = useSearchParams()
  const searchFromUrl = searchParams.get('search') ?? ''
  const [query, setQuery] = useState(searchFromUrl)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function syncSearchInput() {
      setQuery(searchFromUrl)
    }

    syncSearchInput()
  }, [searchFromUrl])

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
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? styles.active : undefined)}
          onMouseEnter={() => prefetchBooks(HOME_BOOKS_URL)}
          onFocus={() => prefetchBooks(HOME_BOOKS_URL)}
        >
          <HomeIcon />
          Home
        </NavLink>
        <NavLink
          to="/favorites"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          <HeartIcon />
          Favorites
        </NavLink>
      </nav>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search books"
          aria-label="Search books"
        />
        <button type="submit">
          <SearchIcon />
          Search
        </button>
      </form>

      <button
        type="button"
        className={styles.categoryToggle}
        aria-expanded={categoriesOpen}
        aria-controls="category-menu"
        onClick={() => setCategoriesOpen((open) => !open)}
      >
        <ChevronIcon />
        Categories
      </button>

      <nav
        id="category-menu"
        className={
          categoriesOpen
            ? `${styles.nav} ${styles.categories} ${styles.categoriesOpen}`
            : `${styles.nav} ${styles.categories}`
        }
      >
        {categories.map((category) => (
          <NavLink
            key={category}
            to={`/category/${category.toLowerCase()}`}
            className={({ isActive }) => (isActive ? styles.active : undefined)}
            onClick={() => setCategoriesOpen(false)}
            onMouseEnter={() => prefetchBooks(getCategoryUrl(category))}
            onFocus={() => prefetchBooks(getCategoryUrl(category))}
          >
            {category}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default Header
