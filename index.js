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
    var nytFictionList = await getNytList('/combined-print-and-e-book-fiction.json')
    var nytNonfictionList = await getNytList('/combined-print-and-e-book-nonfiction.json')
    var nytFictionIsbns = nytFictionList.data.results.books.map(book => book.primary_isbn13)
    var nytNonfictionIsbns = nytNonfictionList.data.results.books.map(book => book.primary_isbn13)

    var userTable = await scanDynamoTable()
  } catch (e) {
    console.log(e.message)
  }

  for (const user of userTable.Items) {
    var newFictionIsbns = []
    var newNonfictionIsbns = []
    newFictionIsbns = newIsbnsForUser(user.fiction, nytFictionIsbns, user)
    newNonfictionIsbns = newIsbnsForUser(user.nonfiction, nytNonfictionIsbns, user)

    if (newFictionIsbns.length === 0 && newNonfictionIsbns.length === 0) {
      console.log(`Skipping because there are no new books to send for user ${user.email}`)
      continue
    }

    try {
      await emailUser(user.email, emailContent(newFictionIsbns, nytFictionList, newNonfictionIsbns, nytNonfictionList))
      await updateTable(user.email, newFictionIsbns, newNonfictionIsbns)
    } catch (e) {
      console.log(`Error: ${e.message}`)
    }
  }
  console.log('Done')
}

function getNytList (path) {
  const nytBookRootUrl = 'https://api.nytimes.com/svc/books/v3/lists/current'
  const params = { 'api-key': process.env.NYT_API_KEY }

  return axios.get(
    nytBookRootUrl + path,
    { params: params }
  )
}

function scanDynamoTable () {
  const scanParams = {
    TableName: process.env.DYNAMO_TABLE_NAME
  }
  return dynamo.scan(scanParams).promise()
}

function newIsbnsForUser (userIsbns, nytIsbns, user) {
  if (!!userIsbns && userIsbns.length !== 0) {
    return nytIsbns.filter(i => !userIsbns.includes(i))
  } else {
    return nytIsbns
  }
}

function emailUser (email, emailContent) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const params = {
    Destination: {
      ToAddresses: [email]
    },
    Source: process.env.SOURCE_EMAIL_ADDRESS,
    Message: {
      Subject: {
        Data: `Your weekly bestsellers update (${date})`
      },
      Body: {
        Html: {
          Data: emailContent,
          Charset: 'UTF-8'
        }
      }
    }
  }
  console.log(`About to send email to ${email}`)
  return ses.sendEmail(params).promise()
}

function emailContent (newFictionIsbns, nytFictionList, newNonfictionIsbns, nytNonfictionList) {
  var emailContent = '<h1>Your weekly bestsellers update</h1><br />'

  if (newFictionIsbns.length !== 0) {
    emailContent = emailContent.concat('<h2>Fiction</h2>')
    emailContent = emailContent.concat(bookListForCategory(newFictionIsbns, nytFictionList))
  }
  if (newNonfictionIsbns.length !== 0) {
    emailContent = emailContent.concat('<h2>Nonfiction</h2>')
    emailContent = emailContent.concat(bookListForCategory(newNonfictionIsbns, nytNonfictionList))
  }
  return emailContent
}

function bookListForCategory (newIsbns, nytList) {
  var bookListForCategory = ''

  for (const isbn of newIsbns) {
    const book = nytList.data.results.books.find(book => book.primary_isbn13 === isbn)
    bookListForCategory = bookListForCategory.concat(`
    <h3> # ${book.rank} ${book.title} by ${book.author} </h3>
    <img src="${book.book_image}" width="200"><br />
    ${book.description}<br />
    Check out on <a href="${book.buy_links.find((linkItem) => linkItem.name === 'Amazon').url}">Amazon</a> / <a href="https://www.goodreads.com/book/isbn/${isbn}">Goodreads</a>
    `)
  }
  return bookListForCategory
}

function updateTable (email, newFictionIsbns, newNonfictionIsbns) {
  var updateParams = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      email: email
    }
  }
  // NOTE: Building the params this way because calling createSet on an empty array returns an error.
  if (newFictionIsbns.length !== 0 && newNonfictionIsbns.length !== 0) {
    updateParams.UpdateExpression = 'ADD fiction :fiction, nonfiction :nonfiction'
    updateParams.ExpressionAttributeValues = {
      ':fiction': dynamo.createSet(newFictionIsbns),
      ':nonfiction': dynamo.createSet(newNonfictionIsbns)
    }
  } else if (newFictionIsbns.length !== 0) {
    updateParams.UpdateExpression = 'ADD fiction :fiction'
    updateParams.ExpressionAttributeValues = { ':fiction': dynamo.createSet(newFictionIsbns) }
  } else if (newNonfictionIsbns.length !== 0) {
    updateParams.UpdateExpression = 'ADD nonfiction :nonfiction'
    updateParams.ExpressionAttributeValues = { ':nonfiction': dynamo.createSet(newNonfictionIsbns) }
  }

  console.log(`About to update table for user ${email}`)
  return dynamo.update(updateParams).promise()
}
