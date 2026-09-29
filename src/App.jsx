import { Link, Outlet } from 'react-router-dom'

function App() {
  return (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/favorites">Favorites</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App
