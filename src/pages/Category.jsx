import { useParams } from 'react-router-dom'
import BookList from '../components/BookList'
import BookListSkeleton from '../components/BookListSkeleton'
import Pagination from '../components/Pagination'
import useBooks from '../hooks/useBooks'

function Category() {
  const { category } = useParams()
  const url = `https://gutendex.com/books/?topic=${encodeURIComponent(category)}`
  const { books, loading, error, next, previous, goToPage, retry } = useBooks(url)

  return (
    <section>
      <h1>Category: {category}</h1>
      {loading && <BookListSkeleton />}
      {error && (
        <div className="message error">
          <p>{error}</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && books.length === 0 && (
        <p className="message">No books found.</p>
      )}
      {!loading && !error && books.length > 0 && (
        <>
          <BookList books={books} />
          <Pagination next={next} previous={previous} onPageChange={goToPage} />
        </>
      )}
    </section>
  )
}

export default Category
