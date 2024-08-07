# Distributed LLM

The project aims to provide an API that supports session-based interaction with various language models from Hugging Face. It allows users to create sessions, start conversations, query the models, and retrieve conversation histories. The communication context is maintained throughout the interaction.

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [Environment Variables](#environment-variables)
  - [Project Structure](#project-structure)
- [Building and Running the Containers](#building-and-running-the-containers)
  - [Build and Run](#build-and-run)
  - [Rebuild and Restart Node Server](#rebuild-and-restart-node-server)
  - [Rebuild and Restart Python Server](#rebuild-and-restart-python-server)
- [API Endpoints](#api-endpoints)
  - [Node Server Endpoints](#node-server-endpoints)
    - [Create Session](#create-session)
    - [Create Conversation](#create-conversation)
    - [Query](#query)
    - [Get Conversation History](#get-conversation-history)
    - [Switch Model](#switch-model)
    - [Get All Conversations](#get-all-conversations)
  - [Python Server Endpoints](#python-server-endpoints)
    - [Select Model](#select-model)
    - [Query](#query)
- [Development and Production Environments](#development-and-production-environments)
  - [Development](#development)
  - [Production](#production)
  - [Shell Script for Building and Running](#shell-script-for-building-and-running)
- [Testing](#testing)
  - [Running NestJS Tests](#running-nestjs-tests)
  - [Running Flask Tests](#running-flask-tests)
- [Error Handling](#error-handling)
- [Validations](#validations)
- [Logging](#logging)
- [License](#license)

## Project Overview

This project consists of two main services:

1. **Node Server**: Handles sessions, conversations, and communication with the Python server.
2. **Python Server**: Communicates with the Hugging Face API to process queries and return responses.

## Getting Started

To get started with the project, you need to have Docker and Docker Compose installed on your machine. The project uses Docker to containerize the Node.js and Python servers.

## Prerequisites

- Docker
- Docker Compose

## Setup

### Environment Variables

Create a `.env` file in the root directory of the project with the following content:

```
HUGGINGFACE_API_KEY=<your_hugging_face_api_key>
API_KEY=<your_api_key>
PYTHON_SERVER=http://python_server:4000
REDIS_HOST=redis
REDIS_PORT=6379
```

Replace `<your_hugging_face_api_key>` and `<your_api_key>` with your actual API keys.

### Project Structure

```
.
├── node_server
│   ├── src
│   │   ├── common
│   │   │   ├── filters
│   │   │   │   ├── validation-exception.filter.spec.ts
│   │   │   │   └── validation-exception.filter.ts
│   │   │   ├── middleware
│   │   │   │   ├── api-key.middleware.spec.ts
│   │   │   │   └── api-key.middleware.ts
│   │   │   └── pipes
│   │   │       ├── param-validator.pipe.spec.ts
│   │   │       └── param-validator.pipe.ts
│   │   ├── llm
│   │   │   ├── test
│   │   │   │   ├── llm.controller.spec.ts
│   │   │   │   ├── llm.module.spec.ts
│   │   │   │   └── llm.service.spec.ts
│   │   │   ├── llm.controller.ts
│   │   │   ├── llm.dto.ts
│   │   │   ├── llm.module.ts
│   │   │   └── llm.service.ts
│   │   ├── app.module.spec.ts
│   │   ├── app.module.ts
│   │   ├── main.spec.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── python_server
│   ├── models
│   │   ├── llama3
│   │   └── mistral2
│   ├── app.py
│   ├── Dockerfile
│   ├── test_app.py
│   └── requirements.txt
├── redis
│   └── redis.conf
├── .env
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── run-dev.sh
├── run.sh
└── README.md
```

## API Endpoints

### Node Server Endpoints

#### Create Session

- **URL**: `/llm/sessions`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "model_name": "llama2"
  }
  ```
- **Response**:
  ```json
  {
    "sessionId": "unique-session-id"
  }
  ```

#### Create Conversation

- **URL**: `/llm/sessions/:sessionId/conversations`
- **Method**: `POST`
- **Response**:
  ```json
  {
    "conversationId": "unique-conversation-id"
  }
  ```

#### Query

- **URL**: `/llm/sessions/:sessionId/conversations/:conversationId/query`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "query": "your-query"
  }
  ```
- **Response**:
  ```json
  {
    "response": "model-response"
  }
  ```

#### Get Conversation History

- **URL**: `/llm/sessions/:sessionId/conversations/:conversationId`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "role": "user",
      "content": "your-query"
    },
    {
      "role": "bot",
      "content": "model-response"
    }
  ]
  ```

#### Switch Model

- **URL**: `/llm/sessions/:sessionId/switch-model`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "model_name": "new-model-name"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Model switched successfully"
  }
  ```

#### Get All Conversations

- **URL**: `/llm/sessions/:sessionId/conversations`
- **Method**: `GET`
- **Response**:
  ```json
  [
    "conversation-id-1",
    "conversation-id-2"
  ]
  ```

### Python Server Endpoints

#### Select Model

- **URL**: `/select_model`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "model": "llama2"
  }
  ```
- **Response**:
  ```json
  {
    "message": "llama2 model is ready to use."
  }
  ```

#### Query

- **URL**: `/query`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "query": "your-query",
    "model": "llama2",
    "max_length": 500
  }
  ```
- **Response**:
  ```json
  {
    "response": "model-response"
  }
  ```

## Development and Production Environments

### Development

To run the services in development mode with hot-reloading, use the following Docker Compose file:

```yaml
services:
  python_server:
    image: python_server_image:latest
    container_name: python_server
    ports:
      - "4000:4000"
    volumes:
      - ./python_server:/app
    environment:
      - FLASK_ENV=development
      - HUGGINGFACE_TOKEN=${HUGGINGFACE_TOKEN}
    env_file:
      - .env
    command: sh -c "pip install watchdog && watchmedo auto-restart --recursive --pattern=*.py -- python app.py"
    depends_on:
      - redis

  node_server:
    image: node_server_image:latest
    container_name: node_server
    ports:
      - "3003:3003"
    volumes:
      - ./node_server:/app
    environment:
      - NODE_ENV=development
      - PYTHON_SERVER=${PYTHON_SERVER}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    env_file:
      - .env
    command: yarn start:dev
    depends_on:
      - python_server
      - redis

  redis:
    image: "redis:alpine"
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]

volumes:
  redis_data:
```

### Production

To run the services in production mode, use the following Docker Compose file:

```yaml
services:
  python_server:
    image: python_server_image:latest
    container_name: python_server
    ports:
      - "4000:4000"
    volumes:
      - ./python_server:/app
    environment:
      - FLASK_ENV=production
      - HUGGINGFACE_TOKEN=${HUGGINGFACE_TOKEN}
    env_file:
      - .env
    depends_on:
      - redis

  node_server:
    image: node_server_image:latest
    container_name: node_server
    ports:
      - "3003:3003"
    volumes:
      - ./node_server:/app
    environment:
      - NODE_ENV=production
      - PYTHON_SERVER=${PYTHON_SERVER}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    env_file:
      - .env
    depends_on:
      - python_server
      - redis

  redis:
    image: "redis:alpine"
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]

volumes:
  redis_data:
```

### Shell Script for Building and Running

Create a script named `run.sh` with the following content:

```bash
#!/bin/bash

# Define image names and version
PYTHON_IMAGE_NAME=python_server_image
NODE_IMAGE_NAME=node_server_image
VERSION=prod

cd ./node_server/
yarn install
yarn build

cd ..

# Build the images with tags
docker build -t ${PYTHON_IMAGE_NAME}:latest -t ${PYTHON_IMAGE_NAME}:${VERSION} ./python_server
docker build -t ${NODE_IMAGE_NAME}:latest -t ${NODE_IMAGE_NAME}:${VERSION} ./node_server

# Use docker-compose to start the services in production mode
docker-compose -f docker-compose.prod.yml up --build -d
```

Create another script named `run-dev.sh` with the following content for development:

```bash
#!/bin/bash

# Define image names and version
PYTHON_IMAGE_NAME=python_server_image
NODE_IMAGE_NAME=node_server_image
VERSION=dev

cd ./node_server/
yarn install
yarn build

cd ..

# Build the images with tags
docker build -t ${PYTHON_IMAGE_NAME}:latest -t ${PYTHON_IMAGE_NAME}:${VERSION} ./python_server
docker build -t ${NODE_IMAGE_NAME}:latest -t ${NODE_IMAGE_NAME}:${VERSION} ./node_server

# Use docker-compose to start the services in development mode
docker-compose -f docker-compose.dev.yml up --build

```

Ensure both scripts have execute permissions:

```bash
chmod +x run.sh run-dev.sh
```

## Testing

### Running NestJS Tests

To run the tests for the NestJS application, follow these steps:

Run the tests using `jest`:
```sh
yarn test
```

### Running Flask Tests

To run the tests for the Flask application, follow these steps:

1. Ensure you are in the virtual environment:
   ```sh
   source venv/bin/activate
   ```

2. Run the tests using `unittest`:
   ```sh
   python -m unittest test_app.py
   ```

## Error Handling

The APIs provide appropriate error messages and HTTP status codes for various error conditions, such as invalid input, unauthorized access, and internal server errors.

## Validations

Request bodies are validated using class-validator decorators in DTOs to ensure the correctness of the input data. Custom validation pipes ensure that all required parameters are valid strings or UUIDs.

## Logging

Both the Node and Python servers use logging to provide detailed information about their operations, including API requests and responses, errors, and internal processing steps.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
