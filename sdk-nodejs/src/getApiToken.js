require("dotenv").config();
const fetch = require("node-fetch");

/**
 * Function to handle the fetch request
 * @param {string} url - The URL to fetch from
 * @param {Object} headers - The headers for the request
 * @param {URLSearchParams} params - The body parameters for the request
 * @returns {Promise<Object>} The JSON response from the fetch request
 * @throws {Error} If the fetch request fails
 */
async function fetchToken(url, headers, params) {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: params,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Function to handle retries
 * @param {number} retries - The number of retries
 * @param {number} interval - The interval between retries in milliseconds
 * @param {Function} fetchTokenFunc - The function to retry
 * @returns {Promise<Object>} The JSON response from the fetch request
 * @throws {Error} The error from the last attempt
 */
async function retryFetchToken(retries, interval, fetchTokenFunc, attempt = 0) {
  try {
    const result = await fetchTokenFunc();
    return result;
  } catch (error) {
    console.error(`Attempt ${attempt + 1} failed to refresh token: ${error}`);
    if (attempt < retries - 1) {
      console.log(`Retrying in ${interval / 1000} seconds...`);
      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, interval)); // No need to return anything here
      return retryFetchToken(retries, interval, fetchTokenFunc, attempt + 1);
    }
    console.error(
      "All retries failed. Please check your connection and credentials.",
    );
    throw error;
  }
}

/**
 * Main refreshToken function
 * @param {number} [retries=process.env.RETRIES || 3] - The number of retries
 * @param {number} [interval=process.env.INTERVAL || 300000] - The interval between retries in milliseconds
 * @returns {Promise<Object>} The JSON response from the fetch request
 */
async function refreshToken(
  retries = process.env.RETRIES || 2,
  interval = process.env.INTERVAL || 1000,
  shouldRetry = true,
) {
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;
  const url = process.env.URL;
  const scope = process.env.SCOPE;

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64",
  );

  const headers = {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("scope", scope);
  const fetchTokenFunc = () => fetchToken(url, headers, params);

  const data = shouldRetry
    ? await retryFetchToken(retries, interval, fetchTokenFunc)
    : await fetchTokenFunc(); // Don't retry if shouldRetry is false
  return data;
}

module.exports = {
  refreshToken,
  fetchToken,
  retryFetchToken,
};
