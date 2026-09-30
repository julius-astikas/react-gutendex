import { createContext, useContext } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useLocalStorage('gutendex_favorites', [])

  function addFavorite(book) {
    setFavorites((current) => {
      const alreadySaved = current.some((item) => item.id === book.id)

      if (alreadySaved) {
        return current
      }

      return [...current, book]
    })
  }

  function removeFavorite(id) {
    setFavorites((current) => current.filter((book) => book.id !== id))
  }

  function isFavorite(id) {
    return favorites.some((book) => book.id === id)
  }

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

// The provider and its hook belong in the same context file.
// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  return useContext(FavoritesContext)
}
