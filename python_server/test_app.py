import unittest
from unittest.mock import patch
from flask import json
from app import app


class FlaskAppTests(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    @patch("app.query_huggingface_api")
    def test_select_model_success(self, mock_query):
        response = self.app.post(
            "/select_model",
            data=json.dumps({"model_name": "llama2"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"message": "llama2 model is ready to use."})

    def test_select_model_no_model_name(self):
        response = self.app.post(
            "/select_model", data=json.dumps({}), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json, {"error": "Model name is required."})

    def test_select_model_model_not_found(self):
        response = self.app.post(
            "/select_model",
            data=json.dumps({"model_name": "unknown_model"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json, {"error": "Model not found."})

    @patch("app.query_huggingface_api")
    def test_query_success(self, mock_query):
        mock_query.return_value = [
            {"generated_text": "This is a test response from the model."}
        ]
        response = self.app.post(
            "/query",
            data=json.dumps({"query": "Hello", "model_name": "llama2"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json, {"response": "This is a test response from the model."}
        )

    def test_query_no_query(self):
        response = self.app.post(
            "/query",
            data=json.dumps({"model_name": "llama2"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json, {"error": "User query is required."})

    def test_query_model_not_available(self):
        response = self.app.post(
            "/query",
            data=json.dumps({"query": "Hello", "model_name": "unknown_model"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json, {"error": "Model not available."})

    @patch("app.query_huggingface_api")
    def test_query_huggingface_api_error(self, mock_query):
        mock_query.return_value = {
            "error": "Failed to get a response from Hugging Face API"
        }
        response = self.app.post(
            "/query",
            data=json.dumps({"query": "Hello", "model_name": "llama2"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json, {"error": "Failed to get a response from Hugging Face API"}
        )


if __name__ == "__main__":
    unittest.main()
