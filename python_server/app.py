from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import logging
import os

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

app = FastAPI()

# Model identifiers
models = {
    "llama3": "SweatyCrayfish/llama-3-8b-quantized",
    "mistral2": "TheBloke/Mistral-7B-Instruct-v0.2-GPTQ",
}

# Load all models at startup
loaded_models = {}


def load_all_models():
    base_path = os.path.abspath("./models")
    for model_name in models.keys():
        model_path = os.path.join(base_path, model_name)
        if not os.path.exists(model_path):
            logging.error(f"Model path {model_path} does not exist.")
            continue

        try:
            logging.info(f"Loading model {model_name} from {model_path}...")
            model = AutoModelForCausalLM.from_pretrained(
                model_path, torch_dtype=torch.float16
            )
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model.to("mps")  # Use Apple Metal Performance Shaders for my M1 device
            loaded_models[model_name] = (model, tokenizer)
            logging.info(f"Model {model_name} loaded successfully.")
        except Exception as e:
            logging.error(f"Failed to load model {model_name}: {e}")


load_all_models()


class SelectModelRequest(BaseModel):
    model: str


class QueryRequest(BaseModel):
    model: str
    query: str
    max_length: int = 500


@app.post("/select_model")
async def select_model(request: SelectModelRequest):
    model = request.model
    if model not in models:
        logging.error(f"Model {model} not found.")
        raise HTTPException(status_code=404, detail="Model not found.")
    logging.info(f"Model {model} selected.")
    return {"message": f"{model} model is ready to use."}


@app.post("/query")
async def query(request: QueryRequest):
    user_query = request.query
    model_name = request.model
    max_length = request.max_length

    if model_name not in models:
        logging.error(f"Model {model_name} is not available.")
        raise HTTPException(status_code=503, detail="Model not available.")

    if model_name not in loaded_models:
        logging.error(f"Model {model_name} is not loaded.")
        raise HTTPException(status_code=503, detail="Model not loaded.")

    logging.debug(f"User query: {user_query}")
    model, tokenizer = loaded_models[model_name]

    inputs = tokenizer(
        user_query,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=max_length,
    ).to(
        "mps"
    )  # Move tensors to MPS

    input_ids = inputs["input_ids"]
    attention_mask = inputs["attention_mask"]

    outputs = model.generate(
        input_ids=input_ids,
        attention_mask=attention_mask,
        max_new_tokens=max_length,
        pad_token_id=tokenizer.eos_token_id,
    )

    response_text = tokenizer.decode(outputs[0].cpu(), skip_special_tokens=True)

    logging.debug(f"Bot response: {response_text}")
    return {"response": response_text}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=4000)
