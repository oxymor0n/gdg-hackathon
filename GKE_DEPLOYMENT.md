# Google Kubernetes Engine (GKE) Deployment Guide

This guide walks you through containerizing the **SynGen** portal and deploying it onto **Google Kubernetes Engine (GKE)**.

---

## 🏗 Container Architecture

The SynGen system is packaged into two separate, optimized Docker containers:
1. **`backend-service`**: Run via Python 3.11 slim, containing the FastAPI app, requirements, globally installed astral `uv`, and a pre-warmed DeepMind Science Skills execution cache.
2. **`frontend-service`**: Served via Nginx on Alpine, containing custom reverse-proxy configurations that serve HTML5 assets on `/` and proxy `/api` requests internally to the backend, completely bypassing CORS and multi-load-balancer costs.

---

## 🛠 Step 1: Local Docker Compilation & Testing

Before deploying to Google Cloud, verify that the containers compile and run correctly on your local machine using **Docker Compose**:

1. Ensure Docker and Docker Compose are installed.
2. Create or copy a local `.env` file containing your key (or let Docker Compose load it from your environment):
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```
3. Run the orchestration build:
   ```bash
   docker compose up --build
   ```
4. Access the web portal at `http://localhost` (port 80). Test a search (e.g., *Imatinib*) to confirm that Nginx reverse-proxies requests seamlessly to the backend container.
5. Stop the containers:
   ```bash
   docker compose down
   ```

---

## 🏷 Step 2: Build & Push Images to Google Cloud

To deploy on GKE, you must push your built images to **Google Container Registry (GCR)** or **Google Artifact Registry (GAR)**. This guide assumes GCR:

1. Configure your Google Cloud CLI project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
2. Enable GCR helper credentials:
   ```bash
   gcloud auth configure-docker
   ```
3. Build and tag the backend container:
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/backend-service:latest -f backend/Dockerfile .
   ```
4. Build and tag the frontend container:
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/frontend-service:latest -f frontend/Dockerfile .
   ```
5. Push both tagged images to your project registry:
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/backend-service:latest
   docker push gcr.io/YOUR_PROJECT_ID/frontend-service:latest
   ```

---

## 🔒 Step 3: Configure GKE Secrets & Manifests

GKE deployments use Kubernetes Secrets to securely deliver API credentials to the backend containers without exposing them in git repositories:

1. Connect to your GKE cluster via `kubectl`:
   ```bash
   gcloud container clusters get-credentials SYNGEN_CLUSTER_NAME --zone YOUR_ZONE --project YOUR_PROJECT_ID
   ```
2. Create the `syngen-secrets` secure mapping containing your Google AI Studio API key:
   ```bash
   kubectl create secret generic syngen-secrets \
     --from-literal=gemini-api-key="YOUR_GEMINI_API_KEY"
   ```
3. Open `kubernetes/backend-deployment.yaml` and `kubernetes/frontend-deployment.yaml` in the `kubernetes/` folder.
4. Replace all occurrences of `YOUR_PROJECT_ID` with your actual Google Cloud Project ID:
   ```yaml
   image: gcr.io/YOUR_PROJECT_ID/backend-service:latest
   ```

---

## 🚀 Step 4: Deploy onto GKE

Apply the manifests to spin up redundant pods and configure internal cluster routing:

1. Deploy both services to the GKE cluster:
   ```bash
   kubectl apply -f kubernetes/
   ```
2. Monitor deployment status to confirm both pods are in the `Running` state:
   ```bash
   kubectl get pods -l app=backend-service
   kubectl get pods -l app=frontend-service
   ```
3. Track the external public IP creation from Google Cloud Load Balancer:
   ```bash
   kubectl get services
   ```
4. Once the `EXTERNAL-IP` of `frontend-service` is populated (usually takes 1-2 minutes), copy it.
5. Open your web browser and navigate to the external IP (e.g., `http://34.120.45.67/`).
6. **Congratulations!** Your SynGen AI Literature Review & Generic Drug Synthesis Portal is fully running on GKE!
