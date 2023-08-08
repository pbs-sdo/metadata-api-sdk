
# Metadata Bank - API Token Management SDK AWS(Python)

This Python script provides functionality to manage and encrypt API tokens for Metadata Bank. It allows you to fetch, save, load, encrypt, and decrypt tokens using AWS DynamoDB and Secrets Manager.

## Table of Contents

- [Metadata Bank - API Token Management SDK AWS(Python)](#metadata-bank---api-token-management-sdk-awspython)
  - [Table of Contents](#table-of-contents)
    - [Prerequisites](#prerequisites)
    - [Environment Variable Setup](#environment-variable-setup)
    - [Functionality](#functionality)
    - [Additional Functions](#additional-functions)
    - [Testing](#testing)
    - [Using getApiTokenEncrypted in an AWS Lambda](#using-getapitokenencrypted-in-an-aws-lambda)
      - [Required Permissions](#required-permissions)
    - [License](#license)
    - [Author](#author)

### Prerequisites

- Python 3.x
- AWS DynamoDB and Secrets Manager
- Libraries: boto3, requests, cryptography, os, json, time, urllib, dotenv

You can install the required libraries using:

```bash
pip install boto3 requests cryptography python-dotenv
```

### Environment Variable Setup

You'll need to set the following environment variables either in your shell or in a `.env` file:

- `SECRET_NAME`: Name of the secret in AWS Secrets Manager.
- `IS_LOCAL`: (Optional) Set to `True` if using LocalStack, otherwise leave undefined.
- `URL`: The URL for fetching the token.
- `SCOPE`: The scope for the token request.
- `INTERVAL`: Interval in milliseconds between token fetching retries (e.g., `3000`).
- `RETRIES`: Number of retries for token fetching (e.g., `2`).

### Functionality

The `refreshToken` function performs the following steps:

1. It first retrieves the consumer key and consumer secret from AWS Secrets Manager.

2. It then checks if a valid token is already available in the DynamoDB table. The token is considered valid if it has not yet expired. The function reads the token from the table and decrypts it using a key generated from the consumer key and consumer secret.

3. If a valid token is not available in the table (either the table does not exist, or the token has expired), the function will attempt to fetch a new token from the API.

4. The function makes a POST request to the API's token endpoint, passing the consumer key and consumer secret as part of the request headers.

5. If the request is successful, the API will return a new access token along with its expiration time. The function calculates the expiry timestamp (in milliseconds) and adds it to the token object.

6. The function then saves the token object (including the expiry timestamp) to the DynamoDB table. The token object is encrypted using the same key as before, and then written to the table.

7. If the request fails, the function will retry the request a certain number of times (defined by the `retries` parameter) with a delay between each attempt (defined by the `interval` parameter). If all retries fail, the function will throw an error.

8. Finally, the function returns the token object (including the expiry timestamp).

This process ensures that the SDK always has a valid access token to use for API requests. By saving the token to a DynamoDB table, the SDK can minimize the number of requests made to the API's token endpoint.

### Additional Functions

- **Get Secrets**: Call `get_secrets()` to retrieve secrets from AWS Secrets Manager.
- **Generate Encryption Key**: Call `generate_encryption_key(consumer_key, consumer_secret)` to generate the encryption key.
- **Encrypt Data**: Call `encrypt(data, key)` to encrypt data.
- **Decrypt Data**: Call `decrypt(data, key)` to decrypt data.
- **Save Token to DynamoDB**: Call `save_token_to_dynamodb(token, key)` to save the token to DynamoDB.
- **Load Token from DynamoDB**: Call `load_token_from_dynamodb(key)` to load the token from DynamoDB.
- **Fetch Token from Server**: Call `fetch_token(url, headers, params)` to fetch the token from the server.
- **Retry Fetch Token**: Call `retry_fetch_token(retries, interval, fetch_token_func)` to retry fetching the token.
- **Refresh Token**: Call `refresh_token(retries, interval, should_retry)` to refresh the token.

### Testing

To run the tests, you'll need to have the required environment variables set up as mentioned above. You can run the tests using:

```shell
python -m unittest tests/test_getApiTokenEncrypted.py
```

Make sure to replace the path with the actual location of your test file.

### Using getApiTokenEncrypted in an AWS Lambda

You can use `getApiTokenEncrypted` in an AWS Lambda function to manage API tokens securely. Here's a guide on how to do that:

1. **Package the Code**: Include `getApiTokenEncrypted.py` along with any dependencies in a ZIP file.
2. **Create a Lambda Function**: In the AWS Management Console, create a new Lambda function and upload the ZIP file.
3. **Set Environment Variables**: Configure the Lambda function with the necessary environment variables mentioned in the [Environment Variable Setup](#environment-variable-setup) section.
4. **Handler Configuration**: Set the handler to the specific function you want to invoke within `getApiTokenEncrypted.py`, such as `getApiTokenEncrypted.refresh_token`.
5. **Test the Function**: Create a test event and execute the Lambda function to verify that it's working as expected.

#### Required Permissions

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

### License

This project is licensed under the GNU General Public License v3.0 (GPLv3). See the [LICENSE](./LICENSE.txt) file for more details.

### Author

- Patrick Roch
