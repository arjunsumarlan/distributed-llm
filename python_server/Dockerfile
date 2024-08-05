# Stage 1: Build the application
FROM python:3.9-slim AS build

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

# Stage 2: Production image
FROM python:3.9-slim AS production

WORKDIR /app

COPY --from=build /app /app

EXPOSE 4000

CMD ["python", "app.py"]

# Stage 3: Development image
FROM python:3.9-slim AS development

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN pip install watchdog

COPY . .

EXPOSE 4000

CMD ["watchmedo", "auto-restart", "--recursive", "--pattern=*.py", "--", "python", "app.py"]
