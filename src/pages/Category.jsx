import { useParams, useSearchParams } from 'react-router-dom'
import BookList from '../components/BookList'
import BookListSkeleton from '../components/BookListSkeleton'
import LoadingPanel from '../components/LoadingPanel'
import Pagination from '../components/Pagination'
import useBooks from '../hooks/useBooks'

function buildCategoryUrl(category, page) {
  const params = new URLSearchParams()

  if (page && page !== '1') {
    params.set('page', page)
  }

  params.set('topic', category)

  return `https://gutendex.com/books/?${params.toString()}`
}

function Category() {
  const { category } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = searchParams.get('page')
  const url = buildCategoryUrl(category, page)
  const { books, loading, slowLoading, error, next, previous, retry } =
    useBooks(url)

  function goToPage(pageUrl) {
    if (!pageUrl) {
      return
    }

    const apiUrl = new URL(pageUrl)
    const nextPage = apiUrl.searchParams.get('page')

    if (nextPage && nextPage !== '1') {
      setSearchParams({ page: nextPage })
    } else {
      setSearchParams({})
    }
  }

  return (
    <section>
      <h1>Category: {category}</h1>
      {loading && (
        <LoadingPanel
          slowLoading={slowLoading}
          hasPreviousResults={books.length > 0}
          currentApiUrl={url}
        />
      )}
      {loading && books.length === 0 && <BookListSkeleton />}
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
      {books.length > 0 && !error && (
        <>
          <BookList books={books} />
          <Pagination next={next} previous={previous} onPageChange={goToPage} />
        </>
      )}
    </section>
  )
}

export default Category
