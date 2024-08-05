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
