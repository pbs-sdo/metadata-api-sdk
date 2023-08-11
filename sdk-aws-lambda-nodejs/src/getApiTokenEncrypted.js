/* eslint-disable no-undef */
require("dotenv").config();
const crypto = require("crypto");
// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require("aws-sdk");
const fetch = require("node-fetch");
// when using LocalStack for testing, comment the following line:
const dynamoDB = new AWS.DynamoDB.DocumentClient();
// if using multiple environments, you can customize DynamoDB table name and token ID through environment variables
const TABLE_NAME = process.env.TABLE_NAME || "Tokens";
const TOKEN_ID = process.env.TOKEN_ID || "apiToken";

/**
 * * Configure the AWS SDK to use LocalStack by uncommenting the following lines:
 * const isLocal = process.env.IS_LOCAL;
 * AWS.config.update({
 * region: "us-east-1",
 * endpoint: isLocal ? "http://localhost:4566" : undefined,
 * });
 * const dynamoDB = new AWS.DynamoDB.DocumentClient({
 * region: "us-east-1",
 *  endpoint: isLocal ? "http://localhost:4566" : undefined,
 * });
 */
const ALGORITHM = "aes-256-cbc";

/**
 * Retrieves secrets from AWS Secrets Manager.
 * @returns {Promise<Object>} The secrets.
 * @throws {Error} If the SECRET_NAME name variable is not set or secrets could not be retrieved.
 * @async
 */
async function getSecrets() {
  const secretsManager = new AWS.SecretsManager();
  const secretName = process.env.SECRET_NAME;
  if (!secretName) {
    throw new Error("SECRET_NAME environment variable is not set");
  }
  try {
    const data = await secretsManager
      .getSecretValue({ SecretId: secretName })
      .promise();
    if (data.SecretString) {
      return JSON.parse(data.SecretString);
    }
    // If the secret is binary, convert it to a string
    const buff = Buffer.from(data.SecretBinary, "base64");
    return buff.toString("ascii");
  } catch (error) {
    console.error("Failed to retrieve secrets:", error);
    throw error;
  }
}

/**
 * Generates an encryption key using the provided consumer key and secret.
 * @param {string} consumerKey - The consumer key.
 * @param {string} consumerSecret - The consumer secret.
 * @returns {Buffer} The generated encryption key.
 * @throws {Error} If the consumer key or secret is undefined.
 */
function generateEncryptionKey(consumerKey, consumerSecret) {
  if (!consumerKey || !consumerSecret) {
    throw new Error("consumerKey or consumerSecret is undefined");
  }
  const hash = crypto.createHash("sha256");
  const key = hash.digest().subarray(0, 32);
  return key;
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
 * Saves the provided token to a DynamoDB table. The token is encrypted using the provided key before being saved.
 * The table name and token ID can be customized through environment variables.
 * @param {Object} token - The token to save.
 * @param {Buffer} key - The encryption key.
 * @throws {Error} If there is an error while saving the token to DynamoDB.
 * @async
 */

async function saveTokenToDynamoDB(token, key) {
  try {
    const encryptedToken = encrypt(JSON.stringify(token), key);
    const params = {
      TableName: TABLE_NAME,
      Item: {
        Id: TOKEN_ID,
        token: encryptedToken,
      },
    };
    await dynamoDB.put(params).promise();
  } catch (error) {
    console.error(`Failed to save token to DynamoDB: ${error}`);
    throw error;
  }
}

/**
 * Decrypts the token from DynamoDB using the provided key.
 * @param {string} key - The encryption key.
 * @returns {Promise<string|null>} The decrypted data or null if not found.
 * @throws {Error} If there's an error during decryption or fetching from DynamoDB.
 * @async
 */


async function getDecryptedDataFromDynamoDB(key) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        Id: TOKEN_ID,
      },
    };
    const data = await dynamoDB.get(params).promise();
    if (data.Item) {
      return decrypt(data.Item.token, key);
    }
  } catch (error) {
    console.error("Error fetching from DynamoDB:", error);
    throw new Error(`Failed to fetch token from DynamoDB: ${error.message}`);
  }
  return null;
}

/**
 * Parses the decrypted data into a token object.
 * @param {string} decryptedData - The decrypted data.
 * @returns {Object|null} The token object or null if invalid or expired.
 * @throws {Error} If there's an error during parsing.
 */
function parseToken(decryptedData) {
  if (decryptedData) {
    try {
      const token = JSON.parse(decryptedData);
      if (Date.now() < token.expiry) {
        return token;
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      throw new Error(`Failed to parse token: ${error.message}`);
    }
  }
  return null;
}

/**
 * Loads the token from DynamoDB, decrypts it, and checks its validity.
 * @param {string} key - The encryption key.
 * @returns {Promise<Object|null>} The token object or null if not found or invalid.
 * @throws {Error} If there's an error during the process.
 * @async
 */
async function loadTokenFromDynamoDB(key) {
  try {
    const decryptedData = await getDecryptedDataFromDynamoDB(key);
    return parseToken(decryptedData);
  } catch (error) {
    error.message = `Failed to load token from DynamoDB: ${error.message}`;
    throw error;
  }
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
 * Fetches a token from the provided URL with the provided headers and body parameters.
 * @param {string} url - The URL to fetch from.
 * @param {Object} headers - The headers for the request.
 * @param {URLSearchParams} params - The body parameters for the request.
 * @returns {Promise<Object>} The JSON response from the fetch request.
 * @throws {Error} If the fetch request fails.
 * @async
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
 * @returns {Promise<Object>} The API token.
 * @throws Will throw an error if loading the token from DynamoDB fails.
 * @async
 */
async function refreshToken(
  retries = process.env.RETRIES || 2,
  interval = process.env.INTERVAL || 3000,
  shouldRetry = true,
) {
  const secrets = await getSecrets();
  const { consumerKey } = secrets;
  const { consumerSecret } = secrets;
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

  let token;
  try {
    token = await loadTokenFromDynamoDB(encryptionKey);
  } catch (error) {
    console.error("Error during loadTokenFromDynamoDB:", error);
  }

  if (!token) {
    if (shouldRetry) {
      token = await retryFetchToken(retries, interval, fetchTokenFunc);
    } else {
      token = await fetchTokenFunc();
    }
    token.expiry = Date.now() + token.expires_in * 1000;
    await saveTokenToDynamoDB(token, encryptionKey);
  }

  return token;
}

module.exports = {
  refreshToken,
  getSecrets,
  saveTokenToDynamoDB,
  loadTokenFromDynamoDB,
  fetchToken,
  retryFetchToken,
  encrypt,
  decrypt,
  generateEncryptionKey,
};
