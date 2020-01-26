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

## How to debug the Lambda locally
1. Create a breakpoint in the code by clicking next to the line number (a red dot should appear).
2. Execute the lambda locally, but with the debug port specified.
`echo '{"message": "Invoked" }' | sam local invoke WeeklyBestSellerUpdate --env-vars env.json -d 5678`
3. Go to the `Debug and Run` tab in VSCode, and click the play button (`Start debugging`).
4. You can debug in the Debug Console.

### References
* https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-debugging-nodejs.html
* https://github.com/aws/aws-toolkit-vscode/blob/master/docs/debugging-nodejs-lambda-functions.md
