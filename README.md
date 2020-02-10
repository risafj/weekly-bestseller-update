# Weekly Bestseller Update

This project is meant to be executed as an AWS lambda.
It gets the New York Times bestseller list, and sends an email about any new books that made the ranking.

## Technology and Tools
* AWS Lambda
* DynamoDB (for storing information on books already sent)
* AWS SES (for sending emails)

## How to execute the Lambda locally
1. Make sure Docker is running.
2. `echo '{"message": "Invoked" }' | sam local invoke WeeklyBestSellerUpdate --env-vars env.json --profile <profile name>`

### Gotchas
* The lambda can be executed without the profile, but accessing AWS resources (like DynamoDB) may not work because it doesn't know which profile to use.

## How to debug the Lambda locally
1. Create a breakpoint in the code by clicking next to the line number (a red dot should appear).
2. Execute the lambda locally, but with the debug port specified.
`echo '{"message": "Invoked" }' | sam local invoke WeeklyBestSellerUpdate --env-vars env.json -d 5678 --profile <profile name>`
3. Go to the `Debug and Run` tab in VSCode, and click the play button (`Start debugging`).
4. You can debug in the Debug Console.

### Gotchas
* Make sure the Docker desktop is running.
* If you get this error, restart the Docker desktop. `Could not invoke function: Error response from daemon: driver failed programming external connectivity on endpoint: Bind for 0.0.0.0:5678 failed: port is already allocated`

### References
* https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-debugging-nodejs.html
* https://github.com/aws/aws-toolkit-vscode/blob/master/docs/debugging-nodejs-lambda-functions.md

## How to build and deploy the Lambda
* Build: `sam build`
  * This will create/update the folder named `.aws-sam`. This is the folder that gets executed locally, and the folder that gets uploaded to AWS when you deploy.
* Deploy: `sam deploy --profile <profile name>`
  * The `--guided` flag is necessary when deploying for the first time (it will prompt you with the necessary options for deployment).
