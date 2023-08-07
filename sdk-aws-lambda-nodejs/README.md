
# SDK AWS Lambda Node.js - (getApiTokenEncrypted)

The `getApiTokenEncrypted` SDK simplifies the process of managing access tokens for the Metadata Bank API. This SDK is designed to be used within an AWS Lambda function and handles the encryption and storage of tokens in AWS DynamoDB, as well as fetching secrets from AWS Secret Manager.

## Table of Contents

- [SDK AWS Lambda Node.js - (getApiTokenEncrypted)](#sdk-aws-lambda-nodejs---getapitokenencrypted)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Usage](#usage)
  - [Testing](#testing)
  - [Additional Documentation](#additional-documentation)
  - [License](#license)
  - [Contributing](#contributing)
  - [Author](#author)

## Prerequisites

- Node.js installed.
- AWS account with proper permissions to create and manage Lambda functions, Secret Manager, and DynamoDB.
- AWS Lambda function must have the proper IAM roles and permissions to `get` and `put` items in DynamoDB, and to access secrets in Secret Manager.
- Valid credentials such as `consumerKey` and `consumerSecret` stored in AWS Secret Manager.
- Environment variables set for `SCOPE`, `Api token url`, `SECRET_NAME`, `RETRIES`, and `INTERVAL`.

## Setup

1. Clone the repository or download the SDK.
2. Navigate to the project directory and run `npm install` to install the dependencies.
3. Set up your environment variables in a `.env` file or through the AWS Lambda environment variables configuration.
4. Deploy the SDK as part of your AWS Lambda function.

## Usage

You can use the `getApiTokenEncrypted` function within your AWS Lambda handler to manage access tokens. Here's an example:

```javascript
const { refreshToken } = require('./getApiTokenEncrypted'); // Adjust the path as needed

exports.handler = async (event) => {
  const token = await refreshToken();
  // Your code here
};

```

## Testing

You can run the tests locally using Jest:

```bash
npm test
```

## Additional Documentation

For more comprehensive documentation, please refer to the [`Documentation`](./Documentation/getApiTokenEncrypted.md) folder in this repository.

## License

This project is licensed under the GPL-3.0-or-later license. See the [LICENSE](./LICENSE.txt) file for details.

## Contributing

Please read [CONTRIBUTING](../CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Author

- Patrick Roch
