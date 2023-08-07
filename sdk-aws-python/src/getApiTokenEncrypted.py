# Import necessary libraries
from dotenv import load_dotenv
import os
import json
import time
import boto3
import base64
import requests
import logging
from urllib.parse import urlencode
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from cryptography.hazmat.primitives.padding import PKCS7
from cryptography.hazmat.backends import default_backend

# Load environment variables from .env file
load_dotenv()

# Configure the AWS SDK to use LocalStack for testing
is_local = os.getenv("IS_LOCAL")
endpoint_url = "http://localhost:4566" if is_local else None
region_name = "us-east-1"

# Initialize AWS services clients
dynamodb = boto3.resource(
    "dynamodb", region_name=region_name, endpoint_url=endpoint_url
)
table = dynamodb.Table("Tokens")
secretsmanager = boto3.client(
    "secretsmanager", region_name=region_name, endpoint_url=endpoint_url
)


# Function to retrieve secrets from AWS Secrets Manager
def get_secrets():
    secret_name = os.getenv("SECRET_NAME")
    if not secret_name:
        raise ValueError("SECRET_NAME environment variable is not set")
    try:
        response = secretsmanager.get_secret_value(SecretId=secret_name)
        if "SecretString" in response:
            return json.loads(response["SecretString"])
        else:
            return base64.b64decode(response["SecretBinary"]).decode("utf-8")
    except Exception as e:
        print(f"Failed to retrieve secrets: {e}")
        raise


# Function to generate encryption key
def generate_encryption_key(consumer_key, consumer_secret):
    logging.info("Generating encryption key.")

    try:
        if not consumer_key or not consumer_secret:
            logging.error("consumerKey or consumerSecret is undefined.")
            raise ValueError("consumerKey or consumerSecret is undefined")

        digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
        digest.update(consumer_key.encode("utf-8") + consumer_secret.encode("utf-8"))
        encryption_key = digest.finalize()[:32]
        logging.info("Encryption key generated successfully.")
        return encryption_key

    except Exception as e:
        logging.error(f"An error occurred during encryption key generation: {e}")
        raise


# Function to encrypt data
def encrypt(data, key):
    try:
        iv = os.urandom(16)
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        # Add PKCS7 padding to the data
        padder = PKCS7(128).padder()  # 128-bit block size for AES
        padded_data = padder.update(data.encode("utf-8")) + padder.finalize()
        encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
        b64_encoded_encrypted_data = base64.b64encode(iv + encrypted_data).decode(
            "utf-8"
        )
        return b64_encoded_encrypted_data
    except Exception as e:
        print(f"An error occurred during encryption: {e}")

        raise


# Function to decrypt data
def decrypt(data, key):
    try:
        data = base64.b64decode(data)
        iv = data[:16]
        encrypted_data = data[16:]
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        padded_data = decryptor.update(encrypted_data) + decryptor.finalize()

        # Remove PKCS7 padding
        unpadder = PKCS7(128).unpadder()  # 128-bit block size for AES
        decrypted_data = unpadder.update(padded_data) + unpadder.finalize()

        try:
            return json.loads(decrypted_data.decode("utf-8"))
        except UnicodeDecodeError:
            print(f"Cannot decode decrypted data as UTF-8: {decrypted_data}")
            raise ValueError("Decrypted data is not a valid UTF-8 string")
    except Exception as e:
        print(f"An error occurred during decryption: {e}")

        raise


# Function to save token to DynamoDB
def save_token_to_dynamodb(token, key):
    encrypted_token = encrypt(json.dumps(token), key)
    table.put_item(Item={"Id": "apiToken1", "token": encrypted_token})


# Function to load token from DynamoDB
def load_token_from_dynamodb(key):
    response = table.get_item(Key={"Id": "apiToken1"})
    if "Item" in response:
        decrypted_data = decrypt(response["Item"]["token"], key)
        token = decrypted_data
        if time.time() < token["expiry"]:
            return token
    return None


# Function to fetch token from the server
def fetch_token(url, headers, params):
    response = requests.post(url, headers=headers, data=params)
    response.raise_for_status()
    return response.json()


# Function to retry fetching the token
def retry_fetch_token(retries, interval, fetch_token_func):
    for i in range(retries):
        try:
            return fetch_token_func()
        except Exception as e:
            print(f"Attempt {i+1} failed to refresh token: {e}")
            if i < retries - 1:
                print(f"Retrying in {interval / 1000} seconds...")
                time.sleep(interval / 1000)
            else:
                print(
                    "All retries failed. Please check your connection and credentials."
                )
                raise


# Function to refresh the token
def refresh_token(retries=2, interval=3000, should_retry=True):
    try:
        secrets = get_secrets()
        consumer_key = secrets["consumerKey"]
        consumer_secret = secrets["consumerSecret"]
        url = os.getenv("URL")
        scope = os.getenv("SCOPE")
        credentials = base64.b64encode(
            f"{consumer_key}:{consumer_secret}".encode("utf-8")
        ).decode("utf-8")
        headers = {
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        params = urlencode({"grant_type": "client_credentials", "scope": scope})

        def fetch_token_func():
            return fetch_token(url, headers, params)

        encryption_key = generate_encryption_key(consumer_key, consumer_secret)
        token = load_token_from_dynamodb(encryption_key)
        if not token:
            if should_retry:
                token = retry_fetch_token(retries, interval, fetch_token_func)
            else:
                token = fetch_token_func()
            token["expiry"] = time.time() + token["expires_in"]
            save_token_to_dynamodb(token, encryption_key)
        return token

    except Exception as e:
        print(f"An error occurred during token refreshing: {e}")

        raise
