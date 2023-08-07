
# Example: Fetching Episode Data with Encrypted Token

This example demonstrates how to use the Metadata Bank's `getApiTokenEncrypted` module to fetch episode data securely using an encrypted token. The code includes fetching an OAuth token, handling the token securely, and making a GET request to retrieve episode information.

## Prerequisites

- Python 3.6 or higher.
- Boto3 library.
- Requests library.
- An AWS account with access to DynamoDB and Secrets Manager (if not using LocalStack).

## Environment Variable Setup

You must set the following environment variables:

- `IS_LOCAL`: Set to "1" if using LocalStack, otherwise leave it unset or set to "0".
- `CONSUMER_KEY`: Your consumer key.
- `CONSUMER_SECRET`: Your consumer secret.
- `SECRET_NAME`: The name of the secret in Secrets Manager.
- `URL`: The URL to fetch the token.
- `SCOPE`: The scope for the token request.
- `RETRIES`: Number of retries for fetching the token (optional).
- `INTERVAL`: Interval between retries in milliseconds (optional).

You may create a `.env` file in the root directory and use the `dotenv` package to load the environment variables.

## Usage

1. **Install Dependencies**: Make sure you have installed the required dependencies:

   ```shell
   pip install boto3 requests python-dotenv
   ```

2. **Configure AWS SDK**: If you're using AWS services, configure the AWS SDK with your credentials.

3. **Run the Example**: Navigate to the example folder and execute:

   ```shell
   python fetchEpisode.py
   ```

## Output

The script will print the JSON response from the episode fetch request. It includes all the details related to the specific episode.

## Error Handling

The script includes basic error handling to print exceptions to the standard error.

## Contributing

If you find any issues or have suggestions, please feel free to open an issue or submit a pull request.

## License

This example is licensed under the GPLv3. Please see the [LICENSE](../LICENSE.txt) file in the root directory for more information.

## Author

- Patrick Roch
