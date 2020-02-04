const axios = require('axios')
const AWS = require('aws-sdk')
AWS.config.update({
  region: 'ap-northeast-1'
})
const dynamo = new AWS.DynamoDB.DocumentClient()

exports.handler = async (event) => {
  // const nytList = await getNytList().catch((error) => {
  //   console.log(`Error: ${error}`)
  //   return
  // })

  const params = {
    TableName: 'weekly-bestseller-updates'
  }
  const result = await dynamo.scan(params).promise().catch((error) => {
    console.log(`error: ${error}`)
    return
  })
  console.log(`result: ${result.Items}`)
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
