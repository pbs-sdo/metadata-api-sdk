
# Metadata Bank - API Token Management SDK AWS(Lambda Node JS)

The `getApiTokenEncrypted` SDK simplifies the process of managing access tokens for the Metadata Bank API. This SDK is designed to be used within an AWS Lambda function and handles the encryption and storage of tokens in AWS DynamoDB, as well as fetching secrets from AWS Secret Manager.

## Table of Contents

- [Metadata Bank - API Token Management SDK AWS(Lambda Node JS)](#metadata-bank---api-token-management-sdk-awslambda-node-js)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Required Permissions](#required-permissions)
  - [Testing](#testing)
  - [Usage](#usage)
  - [Additional Documentation](#additional-documentation)
  - [License](#license)
  - [Contributing](#contributing)
  - [Author](#author)

## Prerequisites

- Node.js installed.
- AWS account with proper permissions to create and manage Lambda functions, Secret Manager, and DynamoDB.
- AWS Lambda function must have the proper IAM roles and permissions to `get` and `put` items in DynamoDB, and to access secrets in Secret Manager.
- Valid credentials such as `consumerKey` and `consumerSecret` stored in AWS Secret Manager.
- Environment variables set for `SCOPE`, `Api token url`, `SECRET_NAME`, `RETRIES`, `INTERVAL`, `TABLE_NAME` and `TOKEN_ID`.

**`Important note:`** If you are working with multiple integrations for the Metadata Bank API, it's advisable to set DynamoDB unique `TOKEN_ID` environment variables for each environment. This ensures that there is no collision between token IDs, keeping them distinct and separate for each integration.

## Setup

1. Clone the repository or download the SDK.
2. Navigate to the project directory and run `npm install` to install the dependencies.
3. Set up your environment variables in a `.env` file or through the AWS Lambda environment variables configuration.
4. Deploy the SDK as part of your AWS Lambda function.

## Required Permissions

The IAM role associated with the Lambda function must have the following permissions:

- `dynamodb:GetItem`: To read items from the DynamoDB table.
- `dynamodb:PutItem`: To write items to the DynamoDB table.
- `secretsmanager:GetSecretValue`: To retrieve secrets from Secrets Manager.
- (Optional) Permissions for any other AWS services or resources that the Lambda function interacts with.

You can define these permissions in an IAM policy and attach it to the IAM role used by the Lambda function. Make sure to restrict the resources to only those that the function needs to access.

Example policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem"],
      "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/TableName"
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:SecretName"
    }
  ]
}
```

Replace `REGION`, `ACCOUNT_ID`, `TableName`, and `SecretName` with your specific values.

Please make sure to customize the example policy and other details according to your specific requirements and setup.

## Testing

You can run the tests locally using Jest:

```bash
npm test
```

## Usage

You can use the `getApiTokenEncrypted` function within your AWS Lambda handler to manage access tokens. Here's an example:

```javascript
const { refreshToken } = require('./src/getApiTokenEncrypted'); // Adjust the path as needed

exports.handler = async (event) => {
  const token = await refreshToken();
  // Your code here
};

```

## Additional Documentation

For more comprehensive documentation, please refer to the [`Documentation`](./Documentation/getApiTokenEncrypted.md) folder in this repository.

## License

This project is licensed under the GPL-3.0-or-later license. See the [LICENSE](./LICENSE.txt) file for details.

## Contributing

Please read [CONTRIBUTING](../CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Author

- Patrick Roch
