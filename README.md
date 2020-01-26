# Weekly Bestseller Update

This project is meant to be executed as an AWS lambda.
It gets the New York Times bestseller list, and sends an email about any new books that made the ranking.

## Technology and Tools
* AWS Lambda
* DynamoDB (for storing information on books already sent)
* AWS SES (for sending emails)

## How to execute the Lambda locally
1. Make sure Docker is running.
2. `echo '{"message": "Invoked" }' | sam local invoke WeeklyBestSellerUpdate --env-vars env.json`

## References
* Debugging the Lambda locally: https://github.com/aws/aws-toolkit-vscode/blob/master/docs/debugging-nodejs-lambda-functions.md
