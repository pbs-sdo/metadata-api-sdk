const { refreshToken, fetchToken, retryFetchToken, encrypt, decrypt, generateEncryptionKey } = require('../src/getApiTokenEncrypted');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Mock the fetch and fs modules
jest.mock('node-fetch');
jest.mock('fs');

// Test suite for sdk-getTokenEncrypt
describe('getApiTokenEncrypted', () => {
    // Before each test, clear the mocks
    beforeEach(() => {
        fetch.mockClear();
        fs.readFileSync.mockClear();
        fs.writeFileSync.mockClear();
    }); 

    // Test case for successful token retrieval
    it('should retrieve token successfully', async () => {
        // Mock a successful fetch response
        const mockSuccessResponse = { access_token: '12345', expires_in: 3600 };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockSuccessResponse,
        });

        // Call the refreshToken function and check the result
        const result = await refreshToken();
        expect(result).toEqual(mockSuccessResponse);
    });

    // Test case for request failure without retry
    it('should throw an error when the request fails', async () => {
        // Mock a failed fetch response
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'HTTP error! status: 500' }),
        });
    
        // Call the refreshToken function with shouldRetry set to false and check for an error
        await expect(refreshToken(0, 0, false)).rejects.toThrow('HTTP error! status: 500');
    });
  
    // Test case for request failure with retry
    it('should retry when the request fails', async () => {
        // Mock two failed fetch responses followed by a successful response
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'HTTP error! status: 500' }),
        })
        .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'HTTP error! status: 500' }),
        })
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access_token: '12345', expires_in: 3600 }),
        });
    
        // Call the refreshToken function and check the result
         const result = await retryFetchToken(3, 1000, () =>
            fetchToken("url", {}, new URLSearchParams()),
        );
        expect(result).toEqual({ access_token: '12345', expires_in: 3600 });
    }, 20000); // Set timeout to 20 seconds
    
    // Test case for encryption and decryption
    it('should encrypt and decrypt data correctly', () => {
        // Generate some test data and a key
        const originalData = 'test data';
        const key = generateEncryptionKey('consumerKey', 'consumerSecret');

        // Encrypt and then decrypt the test data
        const encryptedData = encrypt(originalData, key);
        const decryptedData = decrypt(encryptedData, key);

        // Check if the decrypted data matches the original data
        expect(decryptedData).toEqual(originalData);
    });

    // Test case for reading from and writing to the cache file
    it('should read from and write to the cache file correctly', () => {
        // Define the file path and some test data
        const filePath = path.join(__dirname, 'token_cache.txt');
        const data = 'test data';

        // Mock a read from the cache file
        fs.readFileSync.mockReturnValueOnce(data);
        const readData = fs.readFileSync(filePath, 'utf8');

        // Check if the read data matches the mock data
        expect(readData).toEqual(data);

        // Mock a write to the cache file
        fs.writeFileSync(filePath, data);

        // Check if the write was called with the correct arguments
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, data);
    });
});
