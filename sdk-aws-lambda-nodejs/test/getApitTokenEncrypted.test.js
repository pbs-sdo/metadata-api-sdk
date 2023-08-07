const AWS = require("aws-sdk-mock");
const fetch = require("node-fetch");
const {
  refreshToken,
  getSecrets,
  saveTokenToDynamoDB,
  loadTokenFromDynamoDB,
  fetchToken,
  retryFetchToken,
  encrypt,
  decrypt,
  generateEncryptionKey,
} = require("../src/getApiTokenEncrypted");

// Mock the fetch function to simulate a successful API response
jest.mock("node-fetch", () =>
  jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ access_token: "def456", expires_in: 3600 }),
    }),
  ),
);
const { Response } = jest.requireActual("node-fetch");

// Set the environment variables with fake values
process.env.CONSUMER_KEY = "tsdfsfeqwefeeds";
process.env.CONSUMER_SECRET = "qewdasknafienudfnafn";
process.env.SECRET_NAME = "exodus1";

describe("getApiTokenEncrypted", () => {
  // Clear the mock implementations before each test
  beforeEach(() => {
    AWS.restore();
    fetch.mockClear();
  });

  // Test that the fetchToken function makes a request with the correct parameters
  it("should make a request with the correct parameters", async () => {
    const url = "https://example.com";
    const headers = { Authorization: "Basic abc123" };

    await fetchToken(url, headers, new URLSearchParams());

    expect(fetch).toHaveBeenCalledWith(url, {
      method: "POST",
      headers,
      body: new URLSearchParams(),
    });
  });

  // Test that the getSecrets function retrieves the correct secrets
  it("should get Secrets successfully", async () => {
    AWS.mock("SecretsManager", "getSecretValue", (params, callback) => {
      callback(null, {
        SecretString: JSON.stringify({
          consumerKey: process.env.CONSUMER_KEY,
          consumerSecret: process.env.CONSUMER_SECRET,
        }),
      });
    });
    const secrets = await getSecrets();
    expect(secrets).toEqual({
      consumerKey: process.env.CONSUMER_KEY,
      consumerSecret: process.env.CONSUMER_SECRET,
    });
  });

  // Test that the getSecrets function throws an error when it fails to retrieve the secret
  it("should throw an error when it fails to retrieve the secret", async () => {
    // Mock the getSecretValue method to call the callback with an error
    AWS.mock("SecretsManager", "getSecretValue", (params, callback) => {
      callback(new Error("Failed to retrieve secret"), null);
    });

    // Call the getSecrets function and check that it throws an error
    await expect(getSecrets()).rejects.toThrow("Failed to retrieve secret");

    // Restore the AWS mock
    AWS.restore("SecretsManager", "getSecretValue");
  });

  // Test that the generateEncryptionKey function generates a valid encryption key
  it("should generate a valid encryption key", () => {
    const key = generateEncryptionKey(
      process.env.CONSUMER_KEY,
      process.env.CONSUMER_SECRET,
    );

    // Check that the key is a string and not empty
    expect(typeof key).toBe("object");
    expect(key).not.toBeNull();
  });

  // Test that the encrypt and decrypt functions correctly encrypt and decrypt data
  it("should encrypt and decrypt data correctly", () => {
    const key = generateEncryptionKey(
      process.env.CONSUMER_KEY,
      process.env.CONSUMER_SECRET,
    );
    const encryptedData = encrypt("data", key);
    const decryptedData = decrypt(encryptedData, key);
    expect(decryptedData).toBe("data");
  });
});

// Test that the saveTokenToDynamoDB function saves the token to DynamoDB without throwing an error
it("should save the token to DynamoDB", async () => {
  const token = {
    Id: "apiToken",
    token: "encryptedToken", // This represents the token object that you're trying to save
  };
  const key = generateEncryptionKey(
    process.env.CONSUMER_KEY,
    process.env.CONSUMER_SECRET,
  ); // This is the encryption key

  await expect(saveTokenToDynamoDB(token, key)).resolves.not.toThrow();
});

// Test that the loadTokenFromDynamoDB function returns null when the token has expired
it("should return null when the token has expired", async () => {
  const expiryTime = Date.now() - 10000; // 10 seconds in the past
  AWS.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
    callback(null, {
      Item: {
        token: encrypt(
          JSON.stringify({ token: "token", expiry: expiryTime }),
          generateEncryptionKey(
            process.env.CONSUMER_KEY,
            process.env.CONSUMER_SECRET,
          ),
        ),
      },
    });
  });
  const key = generateEncryptionKey(
    process.env.CONSUMER_KEY,
    process.env.CONSUMER_SECRET,
  );
  const token = await loadTokenFromDynamoDB(key);
  expect(token).toBeNull();
});

it("should refresh the token when it is expired", async () => {
  // Mock the fetch API to simulate fetching the token from the API
  fetch.mockReturnValue(
    Promise.resolve(
      new Response(
        JSON.stringify({ access_token: "newToken", expires_in: 3600 }),
      ),
    ),
  );
  // Mock the AWS SDK methods used in the refreshToken function
  AWS.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
    callback(null, {
      Item: {
        token: encrypt(
          JSON.stringify({ token: "token", expiry: Date.now() - 1000 }),
          generateEncryptionKey(
            process.env.CONSUMER_KEY,
            process.env.CONSUMER_SECRET,
          ),
        ),
      },
    });
  });
  AWS.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
    callback(null, {}); // Simulate a successful put operation
  });
  const token = await refreshToken(0, 0, false);
  expect(token).toEqual({
    access_token: "newToken",
    expires_in: 3600,
    expiry: expect.any(Number),
  });
  // Restore fetch and AWS SDK mocks to their original implementations
  fetch.mockClear();
  AWS.restore("DynamoDB.DocumentClient", "get");
  AWS.restore("DynamoDB.DocumentClient", "put");
});
// Test that the fetchToken function throws an error when the request fails
it("should throw an error when the request fails", async () => {
  fetch.mockImplementationOnce(() =>
    Promise.reject(new Error("Request failed")),
  );
  await expect(fetchToken("url", {}, new URLSearchParams())).rejects.toThrow(
    "Request failed",
  );
});
// Test that the retryFetchToken function retries when the request fails
it("should retry when the request fails", async () => {
  // Mock two failed fetch responses followed by a successful response
  fetch
    .mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "HTTP error! status: 500" }),
    })
    .mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "HTTP error! status: 500" }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ access_token: "12345", expires_in: 3600 }),
    });
  // Call the retryFetchToken function and check the result
  const result = await retryFetchToken(3, 1000, () =>
    fetchToken("url", {}, new URLSearchParams()),
  );
  expect(result).toEqual({ access_token: "12345", expires_in: 3600 });
}, 20000); // Set timeout to 20 seconds
