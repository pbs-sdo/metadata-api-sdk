# Example: Fetching Episode Data with Encrypted Token

This example demonstrates how to use the Metadata Bank's `getApiTokenEncrypted` module to fetch episode data from a given URL using an encrypted OAuth token. The code includes fetching an OAuth token using the `refreshToken` function and making a GET request with the `fetchEpisode` function to retrieve episode information.

## Prerequisites

- Node.js 16 or higher.
- `node-fetch` library.

## Environment Variable Setup

You must set the following environment variables:

- `CONSUMER_KEY`: Your consumer key.
- `CONSUMER_SECRET`: Your consumer secret.
- `SECRET_NAME`: The name of the secret in Secrets Manager.
- `URL`: The URL to fetch the token.
- `SCOPE`: The scope for the token request.
- `RETRIES`: Number of retries for fetching the token (optional).
- `INTERVAL`: Interval between retries in milliseconds (optional).

You can create a `.env` file in the root directory and use the `dotenv` package to load the environment variables.

## Usage

1. **Install Dependencies**: Navigate to the SDK root directory and install the required dependencies:

   ```shell
   npm install
   ```

2. **Run the Example**: Navigate to the example folder and execute:

   ```shell
   node fetchEpisode.js
   ```

## Output

The script will print the JSON response from the episode fetch request. It includes all the details related to the specific episode.

## Error Handling

The script includes basic error handling and logs exceptions to the console.

## Contributing

If you find any issues or have suggestions, please feel free to open an issue or submit a pull request.

## License

This example is licensed under the GPLv3. Please see the [LICENSE](../LICENSE.txt) file in the root directory for more information.

## Author

- Patrick Roch
