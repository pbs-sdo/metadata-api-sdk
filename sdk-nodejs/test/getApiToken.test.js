// Import required modules
const { refreshToken, retryFetchToken, fetchToken } = require('../src/getApiToken'); // replace 'yourModule' with the actual module name
const fetch = require('node-fetch');
jest.mock('node-fetch');
describe('getApiToken', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    it('should retrieve token successfully', async () => {
        const mockSuccessResponse = { access_token: '12345', expires_in: 3600 };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockSuccessResponse,
        });

        const result = await refreshToken();
        expect(result).toEqual(mockSuccessResponse);
    });

    it('should throw an error when the request fails', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'HTTP error! status: 500' }),
        });
    
        await expect(refreshToken(0, 0, false)).rejects.toThrow('HTTP error! status: 500');
        ; // Pass false for shouldRetry
    });
    
    
    it('should retry when the request fails', async () => {
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
    
        // const result = await refreshToken();
        // Call the retryFetchToken function and check the result
        const result = await retryFetchToken(3, 1000, () =>
            fetchToken("url", {}, new URLSearchParams()),
        );

        expect(result).toEqual({ access_token: '12345', expires_in: 3600 });
    }, 20000); // Set timeout to 20 seconds
    
    
});
