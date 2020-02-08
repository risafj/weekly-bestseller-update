const axios = require('axios')
const AWS = require('aws-sdk')
const dynamo = new AWS.DynamoDB.DocumentClient()

exports.handler = async (event) => {
  const nytList = await getNytList().catch((error) => {
    console.log(`Error: ${error}`)
  })

  if (nytList) {
    console.log(nytList)
  }
}

async function getNytList() {
  const nytBookRootUrl = 'https://api.nytimes.com/svc/books/v3/lists/current'
  const fictionPath = '/combined-print-and-e-book-fiction.json'
  // const nonFictionPath = '/combined-print-and-e-book-nonfiction.json'
  const params = {'api-key': process.env.NYT_API_KEY }

  return axios.get(
    nytBookRootUrl + fictionPath,
    { params: params }
  )
}
