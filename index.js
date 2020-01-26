const axios = require('axios')
const nytBookRootUrl = 'https://api.nytimes.com/svc/books/v3/lists/current'
const fictionPath = '/combined-print-and-e-book-fiction.json'
// const nonFictionPath = '/combined-print-and-e-book-nonfiction.json'
const params = {'api-key': process.env.NYT_API_KEY }

exports.handler = async (event) => {
  const list = await axios.get(
    nytBookRootUrl + fictionPath,
    { params: params }
  ).catch((error) => {
    console.log(`Error: ${error}`)
  })

  if (list) {
    console.log(list)
  }
}
