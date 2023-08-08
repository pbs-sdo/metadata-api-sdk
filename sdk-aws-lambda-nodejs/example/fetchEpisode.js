const fetch = require("node-fetch");
const { refreshToken } = require("../src/getApiTokenEncrypted"); 
const AWS = require('aws-sdk');
// set up error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

/** uncomment to Configure the AWS SDK to use LocalStack
const isLocal = process.env.IS_LOCAL;
AWS.config.update({
  region: 'us-east-1',
  endpoint: isLocal ? 'http://localhost:4566' : undefined,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1',
  endpoint: isLocal ? 'http://localhost:4566' : undefined,
});
*/
/**
 * Function to fetch episode data
 * @param {string} url - The URL to fetch from
 * @param {string} token - The OAuth token
 * @returns {Promise<Object>} The JSON response from the fetch request
 */
async function fetchEpisode(url, token) {
    const headers = {
        Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

/**
 * Main function
 */
async function main() {
  const tokenData = await refreshToken();
  // modify the URL to fetch from the real API url
    const episodeData = await fetchEpisode("https://{baseurl}/episode/cid:org:pbs.org:Episode25243", tokenData.access_token);
    console.log(episodeData); // log the data to the console
    console.log(JSON.stringify(episodeData));//log the data to the console as a json string
}

main().catch(console.error);
