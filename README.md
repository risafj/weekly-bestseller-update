# Weekly Bestseller Update

This project is meant to be executed as an AWS lambda.
It gets the New York Times bestseller list, and sends users an email about any new books that made the ranking.

## Technology and Tools
* AWS Lambda
* DynamoDB
* AWS SES (for sending emails)

## Dependencies
* AWS SAM CLI ([installation instructions](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-mac.html))
* Docker desktop

## Executing locally
### Base command (with environment variables loaded)
```bash
$ echo '{"message": "Invoked" }' | sam local invoke WeeklyBestSellerUpdate --env-vars env.json
```

### Options
* If you want to access the production DynamoDB on AWS: `--profile <profile name>`
  * The lambda can be executed without this option, but accessing AWS resources (like DynamoDB) doesn't work. Without this option, sam attempts to access Dynamo DB Local.

### Debugging locally
1. Create a breakpoint in the code by clicking left of the line number (a red dot should appear).
2. Execute the lambda locally, but with the debug port specified: `-d 5678`
3. Go to the `Debug and Run` tab in VSCode, and click the play button (`Start debugging`).
4. You can debug in the Debug Console.

### Caveats
* Make sure the Docker desktop is running.
  * If you get this error, restart the Docker desktop. `Could not invoke function: Error response from daemon: driver failed programming external connectivity on endpoint: Bind for 0.0.0.0:5678 failed: port is already allocated`
* After executing `sam build`, sam will no longer execute `index.js` in the root folder, but execute the one created in the `build` command.

### References
* https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-debugging-nodejs.html
* https://github.com/aws/aws-toolkit-vscode/blob/master/docs/debugging-nodejs-lambda-functions.md

## Building and deploying
* Build: `sam build`
  * This will create/update the folder named `/.aws-sam`. This is the folder that gets executed locally, and the folder that gets uploaded to AWS when you deploy.
* Deploy: `sam deploy --profile <profile name>`
  * The `--guided` flag is necessary when deploying for the first time (it will prompt you with the necessary options for deployment).

## DynamoDB Local setup
If you don't want to hit the production DB, you can use DynamoDB Local instead (run inside a Docker container).

### 1. Start the DynamoDB Local container
```bash
$ docker run -p 8000:8000 amazon/dynamodb-local

# Should return something like this
Initializing DynamoDB Local with the following configuration:
Port:	8000
InMemory:	true
DbPath:	null
SharedDb:	false
shouldDelayTransientStatuses:	false
CorsParams:	*
```
### 2. In a different terminal window, create a test DB
```bash
$ export LOCAL="--endpoint-url http://localhost:8000"

$ aws dynamodb create-table $LOCAL \
--table-name 'weekly-bestseller-updates' \
--attribute-definitions AttributeName=email,AttributeType=S \
--key-schema AttributeName=email,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 3. Add an item to the table
```bash
$ aws dynamodb put-item $LOCAL \
--table-name 'weekly-bestseller-updates' \
--item '{"email": {"S": "test@email.com"}, "books": {"SS": ["Becoming", "Educated"]}}'
```

#### Caveats
* All data in the local DB is cleared every time it is shut down.
* The only options for `AttributeType` when creating a table are S/N/B (String, Number or Binary). You can create the list column later when you populate the table with data ([further explanation](https://stackoverflow.com/a/48809570/11249670)).

#### References
* https://stackoverflow.com/questions/48926260/connecting-aws-sam-local-with-dynamodb-in-docker

## Environment Variables
This project uses `env.json` for storing environment variables locally (file added to `.gitignore`). However, `template.yaml` also requires that any environment variables be declared and populated with a value. So when adding a environment variable, do this:

1. Add it to the list in `template.yaml` with a dummy value
2. Add the actual environment variable to `env.json`
