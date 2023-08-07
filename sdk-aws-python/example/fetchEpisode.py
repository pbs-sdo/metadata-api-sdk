import sys
import os
import json
import boto3
import requests
import traceback

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = os.path.join(parent_dir, "src")
sys.path.append(src_dir)

# import the getApiTokenEncrypt
from getApiTokenEncrypted import refresh_token

# Configure the AWS SDK to use LocalStack
is_local = os.getenv("IS_LOCAL")

endpoint_url = "http://localhost:4566" if is_local else None
region_name = "us-east-1"

dynamodb = boto3.resource(
    "dynamodb", region_name=region_name, endpoint_url=endpoint_url
)


def fetch_episode(url, token):
    """
    Function to fetch episode data
    :param url: The URL to fetch from
    :param token: The OAuth token
    :return: The JSON response from the fetch request
    """
    headers = {
        "Authorization": f"Bearer {token}",
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()


def main():
    """
    Main function
    """
    try:
        token_data = refresh_token()
        episode_data = fetch_episode(
            # replace_this_with_api_baseurl
            "https://replace_this_with_api_baseurl/episode/cid:org:pbs.org:Episode29273",
            token_data["access_token"],
        )
        # print(episode_data)
        print(json.dumps(episode_data))
    except Exception as e:
        traceback.print_exc(file=sys.stderr)


if __name__ == "__main__":
    main()
