import BookList from '../components/BookList'
import { useFavorites } from '../context/FavoritesContext'

function Favorites() {
  const { favorites } = useFavorites()

  return (
    <section>
      <h1>Favorites</h1>
      {favorites.length === 0 ? (
        <p className="message">No favorite books yet.</p>
      ) : (
        <BookList books={favorites} />
      )}
    </section>
  )
}

export default Favorites
