# Stage 1: Production image
FROM node:18 AS production

WORKDIR /app

COPY . .

EXPOSE 3003

CMD ["yarn", "start:prod"]

# Stage 2: Development image
FROM node:18 AS development

WORKDIR /app

COPY . .

EXPOSE 3003

CMD ["yarn", "start:dev"]
