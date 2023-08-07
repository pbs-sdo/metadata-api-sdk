# This file contains unit tests for the getApiTokenEncrypted.py file.
import os
import boto3
import json
import time
from moto import mock_secretsmanager
from moto import mock_dynamodb
from unittest import TestCase
from unittest.mock import MagicMock, patch
import requests_mock
import sys

# get the path of the parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = os.path.join(parent_dir, "src")
sys.path.append(src_dir)
# import the getApiTokenEncrypted.py file
from getApiTokenEncrypted import (
    get_secrets,
    encrypt,
    decrypt,
    generate_encryption_key,
    save_token_to_dynamodb,
    load_token_from_dynamodb,
    fetch_token,
    retry_fetch_token,
    refresh_token,
)

# client for secrets manager
client = boto3.client("secretsmanager")

# Set fake environment variables
os.environ["CONSUMER_KEY"] = "tsdfsfeqwefeeds"
os.environ["CONSUMER_SECRET"] = "qewdasknafienudfnafn"


class TestGetSecretsFunction(TestCase):
    @mock_secretsmanager
    def test_get_secrets(self):
        # Set the secret name in an environment variable
        os.environ["SECRET_NAME"] = "exodus3"

        secretsmanager = boto3.client("secretsmanager", region_name="us-east-1")
        secret_dict = {
            "consumerKey": os.getenv("CONSUMER_KEY"),
            "consumerSecret": os.getenv("CONSUMER_SECRET"),
        }
        secret_string = json.dumps(secret_dict)

        secretsmanager.create_secret(
            Name=os.environ["SECRET_NAME"], SecretString=secret_string
        )

        # Call the function to test
        secrets = get_secrets()

        # Check the result
        self.assertEqual(
            secrets,
            {
                "consumerKey": os.getenv("CONSUMER_KEY"),
                "consumerSecret": os.getenv("CONSUMER_SECRET"),
            },
        )

        # Clean up the environment variable
        del os.environ["SECRET_NAME"]


class TestGenerateEncryptionKey(TestCase):
    def test_generate_encryption_key_with_valid_inputs(self):
        consumer_key = os.getenv("CONSUMER_KEY")
        consumer_secret = os.getenv("CONSUMER_SECRET")
        encryption_key = generate_encryption_key(consumer_key, consumer_secret)

        self.assertEqual(len(encryption_key), 32)

    def test_generate_encryption_key_with_empty_key(self):
        consumer_key = ""
        consumer_secret = os.getenv("CONSUMER_SECRET")

        with self.assertRaises(ValueError):
            generate_encryption_key(consumer_key, consumer_secret)

    def test_generate_encryption_key_with_empty_secret(self):
        consumer_key = os.getenv("CONSUMER_KEY")
        consumer_secret = ""
        with self.assertRaises(ValueError):
            generate_encryption_key(consumer_key, consumer_secret)

    def test_generate_encryption_key_with_empty_key_and_secret(self):
        # Arrange
        consumer_key = ""
        consumer_secret = ""

        # Act and assert
        with self.assertRaises(ValueError):
            generate_encryption_key(consumer_key, consumer_secret)


# Test for encryt function. The encrypt function performs
# encryption on the given data using the provided key.
# The function utilizes AES encryption in CBC mode,
# applies PKCS7 padding, and then base64 encodes the result.
class TestEncrypt(TestCase):
    def test_encrypt_with_valid_inputs(self):
        # Arrange
        consumer_key = os.getenv("CONSUMER_KEY")
        consumer_secret = os.getenv("CONSUMER_SECRET")
        encryption_key = generate_encryption_key(consumer_key, consumer_secret)
        data = "test data"

        encrypted_data = encrypt(data, encryption_key)

        # We can't predict what the encrypted data will be,
        # since a random initialization vector is used each time.
        # However, we can check that the result is a string and is not empty.
        self.assertIsInstance(encrypted_data, str)
        self.assertNotEqual(encrypted_data, "")

    def test_encrypt_with_empty_data(self):
        consumer_key = os.getenv("CONSUMER_KEY")
        consumer_secret = os.getenv("CONSUMER_SECRET")
        encryption_key = generate_encryption_key(consumer_key, consumer_secret)
        data = ""

        encrypted_data = encrypt(data, encryption_key)

        # Even an empty string should produce some encrypted
        # output,due to the addition of padding.
        self.assertIsInstance(encrypted_data, str)
        self.assertNotEqual(encrypted_data, "")


# Test the `Decrypt` function
# The decrypt function reverses the operations performed by the encrypt
# function.It base64 decodes the input, extracts the initialization
# vector (IV), decrypts the remaining data, removes the PKCS7 padding,
# and then attempts to convert the result to a string and parse it as JSON.


class TestDecrypt(TestCase):
    def test_decrypt_with_valid_inputs(self):
        # Arrange
        consumer_key = os.getenv("CONSUMER_KEY")
        consumer_secret = os.getenv("CONSUMER_SECRET")
        encryption_key = generate_encryption_key(consumer_key, consumer_secret)

        data = json.dumps({"key": "value"})
        encrypted_data = encrypt(data, encryption_key)

        decrypted_data = decrypt(encrypted_data, encryption_key)

        self.assertEqual(decrypted_data, json.loads(data))

    def test_decrypt_with_invalid_data(self):
        consumer_key = os.getenv("CONSUMER_KEY")
        consumer_secret = os.getenv("CONSUMER_SECRET")
        encryption_key = generate_encryption_key(consumer_key, consumer_secret)
        invalid_data = "this is not valid encrypted data"

        with self.assertRaises(Exception):
            decrypt(invalid_data, encryption_key)


# Test save_token_to_dynamodb and load_token_from_dynamodb functions
class TestDynamoDBOperations(TestCase):
    @mock_dynamodb
    def test_save_and_load_token(self):
        consumer_key = os.getenv("CONSUMER_KEY")
        consumer_secret = os.getenv("CONSUMER_SECRET")
        encryption_key = generate_encryption_key(consumer_key, consumer_secret)

        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.create_table(
            TableName="apiToken1",
            KeySchema=[{"AttributeName": "Id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "Id", "AttributeType": "S"}],
            ProvisionedThroughput={"ReadCapacityUnits": 1, "WriteCapacityUnits": 1},
        )

        token = {
            "token": "my_token",
            "expiry": time.time() + 600,
        }  # Token expires in 1 hour

        save_token_to_dynamodb(token, encryption_key)
        loaded_token = load_token_from_dynamodb(encryption_key)
        self.assertIsInstance(loaded_token["expiry"], (int, float))
        self.assertIsInstance(token["expiry"], (int, float))

        del loaded_token["expiry"]
        del token["expiry"]

        self.assertDictEqual(loaded_token, token)


# test the fetch_token function
class TestFetchToken(TestCase):
    @requests_mock.Mocker()
    def test_fetch_token(self, mock_request):
        url = "http://example.com"
        headers = {"Authorization": "Bearer token"}
        params = {"grant_type": "client_credentials", "scope": "scope"}
        mock_response = {"access_token": "token", "expires_in": 3600}

        mock_request.post(url, json=mock_response)

        response = fetch_token(url, headers, params)

        self.assertEqual(response, mock_response)


# test the retry_fetch_token_function
class TestRetryFetchToken(TestCase):
    def test_retry_fetch_token(self):
        retries = 3
        interval = 1000  # 1 second
        fetch_token_func = MagicMock(
            side_effect=[Exception("Failed"), Exception("Failed"), "token"]
        )

        result = retry_fetch_token(retries, interval, fetch_token_func)

        self.assertEqual(result, "token")
        self.assertEqual(fetch_token_func.call_count, 3)


# Test the retry function
class TestRefreshToken(TestCase):
    @patch(
        "getApiTokenEncrypted.get_secrets",
        return_value={
            "consumerKey": os.getenv("CONSUMER_KEY"),
            "consumerSecret": os.getenv("CONSUMER_SECRET"),
        },
    )
    @patch(
        "getApiTokenEncrypted.os.getenv", side_effect=["url", "scope"]
    )  # return 'url' first, then 'scope'
    @patch(
        "getApiTokenEncrypted.fetch_token",
        return_value={"access_token": "token", "expires_in": 3600},
    )
    @patch(
        "getApiTokenEncrypted.generate_encryption_key", return_value="encryption_key"
    )
    @patch(
        "getApiTokenEncrypted.load_token_from_dynamodb", return_value=None
    )  # no token in DynamoDB
    @patch("getApiTokenEncrypted.save_token_to_dynamodb")
    @patch(
        "getApiTokenEncrypted.time.time", return_value=1000.0
    )  # current time is 1000 seconds since the epoch
    def test_refresh_token(
        self,
        mock_time,
        mock_save_token_to_dynamodb,
        mock_load_token_from_dynamodb,
        mock_generate_encryption_key,
        mock_fetch_token,
        mock_os_getenv,
        mock_get_secrets,
    ):
        token = refresh_token(
            retries=0, interval=0, should_retry=False
        )  # we don't want to test retrying here
        expected_token = {
            "access_token": "token",
            "expires_in": 3600,
            "expiry": 4600.0,
        }  # 1000 (current time) + 3600
        self.assertEqual(token, expected_token)
        mock_save_token_to_dynamodb.assert_called_once_with(
            expected_token, "encryption_key"
        )
