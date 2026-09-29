import { useParams } from 'react-router-dom'

function BookDetails() {
  const { id } = useParams()

  return <h1>Book ID: {id}</h1>
}

export default BookDetails
