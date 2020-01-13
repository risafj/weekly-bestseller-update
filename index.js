const axios = require('axios')

exports.handler = async (event) => {
  await getNYTList()
}

async function getNYTList () {
  const nytBookRootUrl = 'https://api.nytimes.com/svc/books/v3/lists/current'
  const fictionPath = '/combined-print-and-e-book-fiction.json'
  // const nonFictionPath = '/combined-print-and-e-book-nonfiction.json'
  const params = {'api-key': process.env.NYT_API_KEY }

  await axios.get(
    nytBookRootUrl + fictionPath,
    { params: params }
  )
  .then(function (response) {
    console.log(response.data.results.books)
  })
  .catch(function (error) {
    // Add error handling at some point
    console.log(error)
  })
}
