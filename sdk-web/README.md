# getApiTokenForWebApp.js Documentation

## Overview

The `getApiTokenForWebApp.js` module provides functionality to retrieve an API token from a specified endpoint. This token is necessary for authenticating subsequent API requests from a web application. The module includes error handling through retries and securely stores the token in the browser's local storage.

## Functions

### `async fetchToken(url, headers, params)`

Fetches an API token using HTTP POST request.

**Parameters:**

- `url` (string): The URL to the token endpoint.
- `headers` (Headers): Request headers.
- `params` (URLSearchParams): Body parameters for the request.

**Returns:**

- `Promise<Object>`: A promise that resolves to the JSON response containing the token.

**Throws:**

- `Error`: If the fetch request fails or the server response is not OK.

### `async retryFetchToken(retries, interval, fetchTokenFunc, attempt)`

Retries the token fetch request if it fails, with a specified number of attempts and delay between them.

**Parameters:**

- `retries` (number): The maximum number of retry attempts.
- `interval` (number): The delay between retry attempts in milliseconds.
- `fetchTokenFunc` (Function): The fetchToken function to retry.
- `attempt` (number): Current attempt number, defaults to 0.

**Returns:**

- `Promise<Object>`: A promise that resolves to the JSON response containing the token.

**Throws:**

- `Error`: If all retries fail.

### `async refreshToken(retries, interval)`

Main function to retrieve and locally store an API token, with optional retry logic.

**Parameters:**

- `retries` (number): The number of retries, defaults to 2.
- `interval` (number): The interval between retries in milliseconds, defaults to 1000.

**Returns:**

- `Promise<Object>`: A promise that resolves to the token data.

**Usage:**

This function should be called to initiate the token retrieval process. It will store the token in local storage under the key `'authToken'`.

## Usage

To use this module, import it into your Vue.js component and call the `refreshToken()` function to retrieve and store the API token.

```javascript
import apiTokenService from './getApiTokenForWebApp';

// Call this function when you need to get a new API token
apiTokenService.refreshToken()
  .then(data => {
    // Use the token from data.access_token
  })
  .catch(error => {
    console.error('Error fetching the API token:', error);
  });
```

## Local Storage

The module stores the retrieved token in the browser's local storage under the key `'authToken'`. The token will persist across browser tabs and windows until the browser is closed.

**Note:** It is important to ensure that the application runs over HTTPS to prevent potential security risks associated with token handling.

## Runtime Environment Variables

The module uses placeholders for runtime environment variables that must be replaced with actual values when the Docker container starts. These variables include:

- `API_URL`: The base URL to the API.
- `CONSUMER_KEY`: The consumer key for the API.
- `CONSUMER_SECRET`: The consumer secret for the API.
- `SCOPE`: The scope for the API token request.

The runtime environment will not directly use the variables `API_URL`, `CONSUMER_KEY`, `CONSUMER_SECRET`, and `SCOPE`. Instead, they are to be used for generating configuration files or scripts during the Docker build, which will subsequently be executed at runtime to inject the necessary values.

Ensure these variables are securely passed and replaced at runtime.

### Docker Build-Time Configuration

This module relies on certain critical values that must be provided at build time:

- `API_URL`: The base URL for the API from which the token will be fetched.
- `CONSUMER_KEY`: The API consumer key.
- `CONSUMER_SECRET`: The API consumer secret.
- `SCOPE`: The scope of access requested from the API.

These values should be stored as secrets in the GitHub repository or other repository and passed to the Docker build process via the `ARG` instruction. They will be utilized during the build to create a proper configuration file or script that will be executed at runtime.

### Dockerfile ARG Instructions

Include the following in your Dockerfile to accept the build-time arguments:

```Dockerfile
ARG API_URL
ARG CONSUMER_KEY
ARG CONSUMER_SECRET
ARG SCOPE
```

### GitHub Actions Secrets

In your GitHub Actions workflow, make sure to pass these arguments using the secrets you have stored in your repository:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build and push Docker image
        uses: docker/build-push-action@v3
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: user/appname:latest
          build-args: |
            API_URL=${{ secrets.API_URL }}
            CONSUMER_KEY=${{ secrets.CONSUMER_KEY }}
            CONSUMER_SECRET=${{ secrets.CONSUMER_SECRET }}
            SCOPE=${{ secrets.SCOPE }}
```

## Contributing

Feel free to open issues or submit pull requests if you find any problems or have suggestions.

## License

These modules are licensed under the GPLv3. Please see the [LICENSE](../LICENSE.txt) file in the root directory for more information.

---
Author: Patrick Roch
