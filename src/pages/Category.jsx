import { useParams } from 'react-router-dom'

function Category() {
  const { category } = useParams()

  return <h1>Category: {category}</h1>
}

export default Category
