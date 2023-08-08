const fetch = require("node-fetch");
const { refreshToken } = require("../src/getApiTokenEncrypted");

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
  const episodeData = await fetchEpisode(
    //update the url with the episode id you want to fetch
    "https://{baseurl}/episode/cid:org:pbs.org:Episode33933",
    tokenData.access_token,
  );
  console.log(episodeData);
}

main().catch(console.error);
