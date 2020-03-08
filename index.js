const axios = require('axios')
const AWS = require('aws-sdk')
const options = { region: 'us-east-1' }
AWS.config.update(options)

if (process.env.AWS_SAM_LOCAL) {
  options.endpoint = 'http://docker.for.mac.localhost:8000'
}
const dynamo = new AWS.DynamoDB.DocumentClient(options)

exports.handler = async (event) => {
  const nytList = await getNytList().catch((error) => {
    console.log(`NYT error: ${error}`)
  })
  const nytIsbns = nytList.data.results.books.map(book => book.primary_isbn13)

  const userTable = await scanDynamoTable().catch((error) => {
    console.log(`Scan error: ${error}`)
  })

  // Using a for loop because forEach does not work well with async.
  for (let i = 0; i < userTable.Items.length; i++) {
    await appendNewBooksInDynamo(userTable.Items[i], nytIsbns).catch((error) => {
      console.log(`Update error: ${error}`)
    })
  }
  console.log('Done')
}

async function getNytList () {
  const nytBookRootUrl = 'https://api.nytimes.com/svc/books/v3/lists/current'
  const fictionPath = '/combined-print-and-e-book-fiction.json'
  const params = { 'api-key': process.env.NYT_API_KEY }

  return axios.get(
    nytBookRootUrl + fictionPath,
    { params: params }
  )
}

async function scanDynamoTable () {
  const scanParams = {
    TableName: process.env.DYNAMO_TABLE_NAME
  }
  return dynamo.scan(scanParams).promise()
}

async function appendNewBooksInDynamo (user, nytIsbns) {
  let newBooks = null
  if (user.books && user.books.values.length !== 0) {
    newBooks = nytIsbns.filter(i => !user.books.values.includes(i))
  } else {
    newBooks = nytIsbns
  }

  if (newBooks.length === 0) {
    console.log(`Skipping because there are no new books to send for user ${user.email}`)
    return
  }
  const updateParams = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      email: user.email
    },
    UpdateExpression: 'ADD books :new_books',
    ExpressionAttributeValues: {
      ':new_books': dynamo.createSet(newBooks)
    }
  }
  console.log(`About to update user ${user.email}`)
  return dynamo.update(updateParams).promise()
}
