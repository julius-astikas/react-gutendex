import { useSearchParams } from 'react-router-dom'
import BookList from '../components/BookList'
import BookListSkeleton from '../components/BookListSkeleton'
import LoadingPanel from '../components/LoadingPanel'
import Pagination from '../components/Pagination'
import useBooks from '../hooks/useBooks'

function buildHomeUrl(search, page) {
  const params = new URLSearchParams()

  if (page && page !== '1') {
    params.set('page', page)
  }

  if (search) {
    params.set('search', search)
  }

  const query = params.toString()
  return query
    ? `https://gutendex.com/books/?${query}`
    : 'https://gutendex.com/books/'
}

function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search')
  const page = searchParams.get('page')
  const url = buildHomeUrl(search, page)
  const { books, loading, slowLoading, error, next, previous, retry } =
    useBooks(url)

  function goToPage(pageUrl) {
    if (!pageUrl) {
      return
    }

    const apiUrl = new URL(pageUrl)
    const nextParams = new URLSearchParams()
    const nextSearch = apiUrl.searchParams.get('search')
    const nextPage = apiUrl.searchParams.get('page')

    if (nextSearch) {
      nextParams.set('search', nextSearch)
    }

    if (nextPage && nextPage !== '1') {
      nextParams.set('page', nextPage)
    }

    setSearchParams(nextParams)
  }

  return (
    <section>
      <h1>{search ? `Search results for: ${search}` : 'Gutendex Books'}</h1>
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
          <Pagination
            next={next}
            previous={previous}
            loading={loading}
            onPageChange={goToPage}
          />
        </>
      )}
    </section>
  )
}

export default Home
