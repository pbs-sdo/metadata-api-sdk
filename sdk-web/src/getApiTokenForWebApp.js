/**
 * Performs a POST request to retrieve an API token.
 * 
 * @param {string} url - The URL to fetch from.
 * @param {Headers} headers - The headers for the request.
 * @param {URLSearchParams} params - The body parameters for the request.
 * @returns {Promise<Object>} The JSON response from the fetch request.
 * @throws {Error} If the fetch request fails.
 */
async function fetchToken(url, headers, params) {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: params
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Retries the fetchToken function a specified number of times with a delay between attempts.
 * 
 * @param {number} retries - The number of retries.
 * @param {number} interval - The interval between retries in milliseconds.
 * @param {Function} fetchTokenFunc - The function to retry.
 * @param {number} [attempt=0] - The current attempt number.
 * @returns {Promise<Object>} The JSON response from the fetch request.
 * @throws {Error} If all retries fail.
 */
async function retryFetchToken(retries, interval, fetchTokenFunc, attempt = 0) {
  try {
    const result = await fetchTokenFunc();
    return result;
  } catch (error) {
    if (attempt < retries - 1) {
      console.error(`Attempt ${attempt + 1} failed to refresh token: ${error}`);
      await new Promise(resolve => setTimeout(resolve, interval));
      return retryFetchToken(retries, interval, fetchTokenFunc, attempt + 1);
    } else {
      console.error("All retries failed. Please check your connection and credentials.");
      throw error;
    }
  }
}

/**
 * Retrieves an API token and stores it in localStorage for the duration of the session.
 * If retries are enabled and the first attempt fails, it will retry the request.
 * 
 * @param {number} [retries=2] - The number of retries.
 * @param {number} [interval=1000] - The interval between retries in milliseconds.
 * @returns {Promise<Object>} The token data.
 */
async function refreshToken(retries = 2, interval = 1000) {
  const url = `${apiURL}/path/to/token/endpoint`; // The endpoint for the token
  const credentials = btoa(`${consumerKey}:${consumerSecret}`);

  const headers = {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("scope", scope);

  const fetchTokenFunc = () => fetchToken(url, headers, params);

  const data = await retryFetchToken(retries, interval, fetchTokenFunc);
  // Store the token in localStorage
  localStorage.setItem('authToken', data.access_token);
  // We assume the token response has an access_token field
  return data;
}

export default {
  refreshToken,
  fetchToken,
  retryFetchToken
};

