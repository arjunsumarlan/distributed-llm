from flask import Flask, request, jsonify
import os
import logging
import requests
from requests.exceptions import HTTPError

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

app = Flask(__name__)
app.secret_key = "supersecretkey"
HF_API_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
HF_API_URL = "https://api-inference.huggingface.co/models"

# Model identifiers on Hugging Face
models = {
    "llama2": "meta-llama/Llama-2-7b-hf",
    "llama3": "meta-llama/Meta-Llama-3-8B-Instruct",
    "mistral": "mistralai/Mistral-7B-v0.1",
    "mistral2": "mistralai/Mistral-7B-Instruct-v0.2",
    "mistral3": "mistralai/Mistral-7B-Instruct-v0.3",
}


def query_huggingface_api(model_path, inputs, max_length=500):
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    try:
        response = requests.post(
            f"{HF_API_URL}/{model_path}",
            headers=headers,
            json={
                "inputs": inputs,
                "parameters": {"max_new_tokens": max_length, "return_full_text": False},
            },
        )
        response.raise_for_status()
        return response.json()
    except HTTPError as http_err:
        logging.error(f"HTTP error occurred: {http_err}")
        return {"error": "Failed to get a response from Hugging Face API"}
    except Exception as err:
        logging.error(f"An error occurred: {err}")
        return {"error": "An unexpected error occurred"}


@app.route("/select_model", methods=["POST"])
def select_model():
    data = request.json
    model_name = data.get("model_name")
    if not model_name:
        return jsonify({"error": "Model name is required."}), 400
    if model_name not in models:
        logging.error(f"Model {model_name} not found.")
        return jsonify({"error": "Model not found."}), 404
    logging.info(f"Model {model_name} selected.")
    return jsonify({"message": f"{model_name} model is ready to use."})


@app.route("/query", methods=["POST"])
def query():
    data = request.json
    user_query = data.get("query")
    model_name = data.get("model_name")
    max_length = data.get("max_length", 500)

    # Check if user query is provided
    if not user_query:
        return jsonify({"error": "User query is required."}), 400

    # Check if model name is provided and is valid
    if not model_name or model_name not in models:
        logging.error(f"Model {model_name} is not available.")
        return jsonify({"error": "Model not available."}), 503

    logging.debug(f"User query: {user_query}")
    model_path = models[model_name]

    # Query the Hugging Face API
    response = query_huggingface_api(model_path, user_query, max_length)

    # Check if the response contains an error
    if "error" in response:
        return jsonify({"error": response["error"]}), 503

    # Handle the response correctly
    if isinstance(response, list) and len(response) > 0:
        bot_response = response[0].get("generated_text", "No response from model.")
    else:
        bot_response = "No response from model."

    logging.debug(f"Bot response: {bot_response}")
    return jsonify({"response": bot_response})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4000)
