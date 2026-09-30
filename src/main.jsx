import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Category from './pages/Category.jsx'
import BookDetails from './pages/BookDetails.jsx'
import Favorites from './pages/Favorites.jsx'
import NotFound from './pages/NotFound.jsx'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Home /> },
        { path: 'category/:category', element: <Category /> },
        { path: 'book/:id', element: <BookDetails /> },
        { path: 'favorites', element: <Favorites /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL.replace(/\/+$/, '') || '/',
  },
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FavoritesProvider>
      <RouterProvider router={router} />
    </FavoritesProvider>
  </StrictMode>,
)
