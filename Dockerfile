# ==========================================================================
# Unified Single-Container Dockerfile for GCP Cloud Run Deployment
# Runs Nginx as the primary ingress server and FastAPI in the background
# ==========================================================================

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install system dependencies (including nginx)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Install uv globally for high-speed dependency execution
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Set the working directory
WORKDIR /app

# Copy backend requirements and install them
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend source code
COPY backend/ /app/backend/

# Copy frontend static assets (Nginx will serve these)
COPY frontend/ /app/frontend/

# Copy existing Nginx configuration (which we will dynamically adapt on startup)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the science-skills repository
COPY science-skills/ /app/science-skills/

# Pre-warm uv virtual env for the skills to avoid runtime cold-start delays
WORKDIR /app/science-skills
RUN uv venv && uv run --help

# Return to main working directory
WORKDIR /app

# Expose port 8080
EXPOSE 8080

# Create a dynamic entrypoint script that:
# 1. Substitutes the Cloud Run PORT into Nginx config (replaces 'listen 80;' with 'listen $PORT;')
# 2. Redirects Nginx API reverse proxy locally (replaces 'backend-service:8000' with '127.0.0.1:8000')
# 3. Boots FastAPI on local loopback on port 8000
# 4. Boots Nginx in the foreground to handle ingress
RUN echo '#!/bin/sh\n\
sed -i "s/listen 80;/listen ${PORT:-8080};/g" /etc/nginx/conf.d/default.conf\n\
sed -i "s/proxy_pass http:\\/\\/backend-service:8000\\/api;/proxy_pass http:\\/\\/127.0.0.1:8000\\/api;/g" /etc/nginx/conf.d/default.conf\n\
sed -i "s/root \\/usr\\/share\\/nginx\\/html;/root \\/app\\/frontend;/g" /etc/nginx/conf.d/default.conf\n\
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 &\n\
exec nginx -g "daemon off;"\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Start the application
ENTRYPOINT ["/app/entrypoint.sh"]
