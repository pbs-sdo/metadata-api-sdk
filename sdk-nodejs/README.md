# Metadata Bank - API Token Management SDK (Node.js)

This SDK provides two Node.js modules to manage OAuth tokens:

1. **`getApiToken.js`**: Fetches a token from the server and optionally handles retries.
2. **`getApiTokenEncrypted.js`**: Extends the functionality of `getApiToken.js` by adding encryption and decryption of the token, and saving/loading the token to/from a file.

## Prerequisites

- Node.js 18 or higher.
- `node-fetch` library.
- `dotenv` library (if using a `.env` file).
- `Consumer Key`, `Consumer Secret`, `OAuth Scope`, `URL` to fetch token

## Setup

1. Clone the repository or download the SDK.
2. Navigate to the project directory and run `npm install` to install the dependencies.
3. Set up your environment variables in a `.env` file

## Environment Variable Setup

You must set the following environment variables for both modules:

- `CONSUMER_KEY`: Your consumer key.
- `CONSUMER_SECRET`: Your consumer secret.
- `URL`: The URL to fetch the token.
- `SCOPE`: The scope for the token request.
- `RETRIES`: Number of retries for fetching the token (optional).
- `INTERVAL`: Interval between retries in milliseconds (optional).

For `getApiTokenEncrypted.js`, you also need to provide:

- `TOKEN_PATH`: The path to the file where the encrypted token will be saved.

You can create a `.env` file in the root directory to load these variables.

## Testing

You can run the tests locally using Jest:

```bash
npm test
```

## Usage

### Using `getApiToken.js`

You can import the `refreshToken` function from `getApiToken.js` and call it to fetch a token:

```javascript
const { refreshToken } = require('../src/getApiToken');
const tokenData = await refreshToken();
// Your code here
```

### Using `getApiTokenEncrypted.js`

This module provides additional functions to encrypt and decrypt data and to save and load encrypted tokens to/from a file:

```javascript
const { refreshToken } = require('../src/getApiTokenEncrypted');
const tokenData = await refreshToken();
// Your code here
```

## API

For more information, please refer to the `Documentation` folder in this repository.

## Contributing

Feel free to open issues or submit pull requests if you find any problems or have suggestions.

## License

These modules are licensed under the GPLv3. Please see the [LICENSE](../LICENSE.txt) file in the root directory for more information.

## Author

- Patrick Roch
