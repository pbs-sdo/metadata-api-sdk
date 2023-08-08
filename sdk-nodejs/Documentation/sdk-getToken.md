
# SDK Node JS - (getApiToken)
`getApiToken` is a Node.js module that provides functions for fetching an API token. It uses the `node-fetch` library for making HTTP requests.

The `refreshToken` function is the main function of the module. It fetches a token from the API provider using the provided credentials and returns the JSON response. It also supports retrying the fetch if it fails.

The `fetchToken` function is a helper function that handles the fetch request. It takes a URL, headers, and body parameters as input and returns the JSON response from the fetch request.

The `retryFetchToken` function is another helper function that handles retries. It takes a fetch function, the number of retries, and the interval between retries as input and returns the JSON response from the fetch request. If the fetch fails, it will retry the specified number of times, waiting the specified interval between each attempt.

Here's an updated documentation for the `getApiToken` module:

## `getApiToken.js`

This module provides functions for fetching an API token. It uses the `node-fetch` library for making HTTP requests.

### Prerequisite

Before using this module, you need to obtain the following information:

- `CONSUMER_KEY`: The consumer key for your API.
- `CONSUMER_SECRET`: The consumer secret for your API.
- `URL`: The URL for the token endpoint.
- `SCOPE`: The scope for the token.

You can obtain these values from the API provider.


### Usage

To use this module, you need to set the following environment variables:

- `CONSUMER_KEY`: The consumer key for your API.
- `CONSUMER_SECRET`: The consumer secret for your API.
- `URL`: The URL for the token endpoint.
- `SCOPE`: The scope for the token.

You can then import the module and call the `refreshToken` function to fetch the token:

```javascript
const { refreshToken } = require('../src/getApiToken');

async function main() {
  const token = await refreshToken();
  console.log(token);
}

main();
```

The `refreshToken` function takes the following optional parameters:

- `retries`: The number of times to retry fetching the token if the fetch fails. Defaults to the value of the `RETRIES` environment variable or 2.
- `interval`: The interval between retries in milliseconds. Defaults to the value of the `INTERVAL` environment variable or 1000.
- `shouldRetry`: Whether to retry fetching the token if the fetch fails. Defaults to true.

## API

The module exports the following functions:

#### `refreshToken(retries, interval, shouldRetry)`

Attempts to refresh the token. If `shouldRetry` is true, it will use `retryFetchToken` to fetch the token, otherwise it will use `fetchToken`. If the token fetch is successful, it will return the JSON response.

- `retries`: The number of times to retry fetching the token if the fetch fails. Defaults to the value of the `RETRIES` environment variable or 2.
- `interval`: The interval between retries in milliseconds. Defaults to the value of the `INTERVAL` environment variable or 1000.
- `shouldRetry`: Whether to retry fetching the token if the fetch fails. Defaults to true.

#### `fetchToken(url, headers, params)`

Fetches a token from the provided URL with the provided headers and body parameters.

- `url`: The URL to fetch from.
- `headers`: The headers for the request.
- `params`: The body parameters for the request.

Returns a Promise that resolves to the JSON response from the fetch request.

#### `retryFetchToken(retries, interval, fetchTokenFunc, attempt)`

Attempts to fetch a token using the provided fetch function. If the fetch fails, it will retry the specified number of times, waiting the specified interval between each attempt.

- `retries`: The number of retries.
- `interval`: The interval between retries in milliseconds.
- `fetchTokenFunc`: The function to retry.
- `attempt`: The current attempt number. Defaults to 0.

Returns a Promise that resolves to the JSON response from the fetch request.

### License

This module is licensed under the GNU General Public License v3.0. See the [LICENSE](../LICENSE.txt) file for details.

### Author

- Patrick Roch