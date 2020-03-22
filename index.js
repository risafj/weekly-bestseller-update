const axios = require('axios')
const AWS = require('aws-sdk')
const options = { region: 'us-east-1' }
AWS.config.update(options)

const ses = new AWS.SES(options)

if (process.env.AWS_SAM_LOCAL) {
  options.endpoint = 'http://docker.for.mac.localhost:8000'
}
const dynamo = new AWS.DynamoDB.DocumentClient(options)

exports.handler = async (event) => {
  try {
    var nytList = await getNytList()
    var nytIsbns = nytList.data.results.books.map(book => book.primary_isbn13)
    var userTable = await scanDynamoTable()
  } catch (e) {
    console.log(e.message)
  }

  for (const user of userTable.Items) {
    const newIsbns = newIsbnsForUser(user, nytIsbns)

    if (newIsbns.length === 0) {
      console.log(`Skipping because there are no new books to send for user ${user.email}`)
      continue
    }

    try {
      await emailUser(user.email, newIsbns)
      await updateTable(user.email, newIsbns)
    } catch (e) {
      console.log(`Error: ${e.message}`)
    }
  }
  console.log('Done')
}

function getNytList () {
  const nytBookRootUrl = 'https://api.nytimes.com/svc/books/v3/lists/current'
  const fictionPath = '/combined-print-and-e-book-fiction.json'
  const params = { 'api-key': process.env.NYT_API_KEY }

  return axios.get(
    nytBookRootUrl + fictionPath,
    { params: params }
  )
}

function scanDynamoTable () {
  const scanParams = {
    TableName: process.env.DYNAMO_TABLE_NAME
  }
  return dynamo.scan(scanParams).promise()
}

function newIsbnsForUser (user, nytIsbns) {
  if (user.books && user.books.valueslength !== 0) {
    return nytIsbns.filter(i => !user.books.values.includes(i))
  } else {
    return nytIsbns
  }
}

function emailUser (email, newIsbns) {
  const params = {
    Destination: {
      ToAddresses: [email]
    },
    Source: process.env.SOURCE_EMAIL_ADDRESS,
    Message: {
      Subject: {
        Data: 'Your weekly bestselling books update'
      },
      Body: {
        Text: {
          Data: `Here are the books newly listed ${newIsbns}`
        }
      }
    }
  }
  console.log(`About to send email to ${email}`)
  return ses.sendEmail(params).promise()
}

function updateTable (email, newIsbns) {
  const updateParams = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      email: email
    },
    UpdateExpression: 'ADD books :new_books',
    ExpressionAttributeValues: {
      ':new_books': dynamo.createSet(newIsbns)
    }
  }

  console.log(`About to update table for user ${email}`)
  return dynamo.update(updateParams).promise()
}
