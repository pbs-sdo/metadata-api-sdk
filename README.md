# Metadata Bank API SDK

Welcome to the Metadata Bank API SDK repository! This repository contains SDKs for different platforms and languages, enabling seamless integration with Metadata Bank's services. Below you'll find an overview of the repository structure and the functionality provided by each SDK.

Before you jump in, you should get familiar with the [Guidelines and Recommendations for handling OAuth API Access Tokens.](./Guidelines%20and%20Recommendations%20for%20Handling%20OAuth%20API%20Access%20Tokens.md)

## Repository Structure

1. **sdk-web**: A Javascript SDK providing a simple way to get an API token from the Metadata Bank for an SPA or web application
2. **sdk-nodejs**: A Node.js SDK providing a simple way to get API tokens from Metadata Bank.
3. **sdk-aws-python**: A Python SDK optimized for AWS environments, with additional encryption features for secure token handling.
4. **sdk-aws-lambda-nodejs**: A Node.js SDK tailored for AWS Lambda, enabling serverless interactions with Metadata Bank's API.

### ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) sdk-web 

The `sdk-web` folder contains a Javascript implementation that provide a straightforward way to get an API token.

- **getApiTokenForWebApp**: A simpler function similar to the Node.js for Web applications and Single Page Applications(SPA)

### ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) sdk-nodejs

The `sdk-nodejs` folder contains a Node.js implementation that provides a straightforward way to get API tokens. It's designed for simplicity and easy integration into various Node.js applications. It includes the following:

- **getApiTokenEncrypted**: A function to fetch, encrypt, and save API tokens to a local file. It also manages token expiry by checking the token's expiration time before making a new API call.
- **getApiToken**: A simpler function similar to the Node.js version for fetching API tokens without encryption.

### ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white) sdk-aws-python

The `sdk-aws-python` folder offers a Python SDK with advanced features specially crafted for AWS Lambda environments. This enables serverless applications to interact with Metadata Bank's API efficiently.

### ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white) sdk-aws-lambda-nodejs

The `sdk-aws-lambda-nodejs` folder includes a Node.js SDK specially crafted for AWS Lambda environments. This enables serverless applications to interact with Metadata Bank's API efficiently.

## Getting Started

Please navigate to the specific SDK folder that meets your requirements. Inside each folder, you'll find detailed instructions on how to install, configure, and use the SDK.

- [Vanilla Javascript for web](./sdk-web/README.md)
- [Node.js SDK (sdk-nodejs)](./sdk-nodejs/README.md)
- [Python SDK for AWS (sdk-aws-python)](./sdk-aws-python/README.md)
- [Node.js SDK for AWS Lambda (sdk-aws-lambda-nodejs)](./sdk-aws-lambda-nodejs/README.md)

## Contributing

If you'd like to contribute, please follow the guidelines provided in the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## License

This project is licensed under the terms of the [GNU General Public License v3.0 (GPLv3)](./LICENSE.txt).

## Support

For support, questions, or additional information, please refer to the [SUPPORT.md](./SUPPORT.md) file or contact us directly at [metadata-api-sdk](mailto:metadata@pbstesting2.freshdesk.com).
