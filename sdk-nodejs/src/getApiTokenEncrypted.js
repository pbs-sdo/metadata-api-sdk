require("dotenv").config();
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const fetch = require("node-fetch");

const TOKEN_PATH = path.join(__dirname, "token.json");
const ALGORITHM = "aes-256-cbc";

/**
 * Generates an encryption key using the provided consumer key and secret.
 * @param {string} consumerKey - The consumer key.
 * @param {string} consumerSecret - The consumer secret.
 * @returns {Buffer} The generated encryption key.
 * @throws {Error} If there's an error during the hash creation process.
 */
function generateEncryptionKey(consumerKey, consumerSecret) {
  try {
    if (!consumerKey || !consumerSecret) {
      throw new Error("consumerKey or consumerSecret is undefined");
    }
    const hash = crypto.createHash("sha256");
    hash.update(consumerKey + consumerSecret);
    return hash.digest().subarray(0, 32);
  } catch (error) {
    console.error("Error during encryption key generation:", error);
    throw new Error(`Failed to generate encryption key: ${error.message}`);
  }
}

/**
 * Encrypts the given data using the provided key.
 * @param {string} data - The data to encrypt.
 * @param {Buffer} key - The encryption key.
 * @returns {string} The encrypted data in hex format.
 * @throws {Error} If there's an error during encryption.
 */
function encrypt(data, key) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
    return `${iv.toString("hex")}:${encryptedData.toString("hex")}`;
  } catch (error) {
    console.error("Error during encryption:", error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

/**
 * Decrypts the provided data using the provided key.
 * @param {string} data - The data to decrypt.
 * @param {Buffer} key - The decryption key.
 * @returns {string} The decrypted data.
 * @throws {Error} If there is an error while decrypting the data.
 */
function decrypt(data, key) {
  try {
    const [iv, encryptedData] = data
      .split(":")
      .map((part) => Buffer.from(part, "hex"));
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
    return decryptedData.toString();
  } catch (error) {
    console.error("Error during decryption:", error);
    return null;
  }
}

/**
 * Saves the given token to a file after encrypting it with the provided key.
 * @param {Object} token - The token to save.
 * @param {Buffer} key - The encryption key.
 * @throws {Error} If there's an error during the encryption or file writing process.
 */
function saveTokenToFile(token, key) {
  try {
    const encryptedToken = encrypt(JSON.stringify(token), key);
    fs.writeFileSync(TOKEN_PATH, encryptedToken);
  } catch (error) {
    console.error("Error during saving token to file:", error);
    throw new Error(`Failed to save token to file: ${error.message}`);
  }
}

/**
 * Loads the token from a file. The token is decrypted using the provided key after being loaded.
 * @param {Buffer} key - The decryption key.
 * @returns {Object|null} The loaded token, or null if the token does not exist or is expired.
 */
function loadTokenFromFile(key) {
  if (fs.existsSync(TOKEN_PATH)) {
    const encryptedToken = fs.readFileSync(TOKEN_PATH, "utf8");
    const token = JSON.parse(decrypt(encryptedToken, key));
    if (Date.now() < token.expiry) {
      return token;
    }
  }
  return null;
}

/**
 * Fetches a token from the provided URL with the provided headers and body parameters.
 * @param {string} url - The URL to fetch from.
 * @param {Object} headers - The headers for the request.
 * @param {URLSearchParams} params - The body parameters for the request.
 * @returns {Promise<Object>} The JSON response from the fetch request.
 * @throws {Error} If the fetch request fails.
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
 * Attempts to fetch a token using the provided fetch function. If the fetch fails, it will retry the specified number of times, waiting the specified interval between each attempt.
 * @param {number} retries - The number of retries.
 * @param {number} interval - The interval between retries in milliseconds.
 * @param {Function} fetchTokenFunc - The function to retry.
 * @returns {Promise<Object>} The JSON response from the fetch request.
 * @throws {Error} If all retries fail.
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
 * Main function of the module. Attempts to refresh the token. If `shouldRetry` is true, it will use `retryFetchToken` to fetch the token, otherwise it will use `fetchToken`. If the token fetch is successful, it will save the token to a file and return it.
 * @param {number} [retries=process.env.RETRIES || 2] - The number of retries.
 * @param {number} [interval=process.env.INTERVAL || 3000] - The interval between retries in milliseconds.
 * @param {boolean} [shouldRetry=true] - Whether to retry fetching the token if the fetch fails.
 * @returns {Promise<Object>} The fetched token.
 */
async function refreshToken(
  retries = process.env.RETRIES || 2,
  interval = process.env.INTERVAL || 3000,
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

  const encryptionKey = generateEncryptionKey(consumerKey, consumerSecret);
  let token = loadTokenFromFile(encryptionKey);
  if (!token) {
    if (shouldRetry) {
      token = await retryFetchToken(retries, interval, fetchTokenFunc);
    } else {
      token = await fetchTokenFunc();
    }
    token.expiry = Date.now() + token.expires_in * 1000;
    saveTokenToFile(token, encryptionKey);
  }

  return token;
}

module.exports = {
  refreshToken,
  fetchToken,
  retryFetchToken,
  encrypt,
  decrypt,
  generateEncryptionKey,
};
