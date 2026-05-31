# Deployment Guide: GCP Cloud Run

This guide outlines the standard procedure for deploying the **SynGen (AI Pharma Review & Generic Drug Synthesis Portal)** to **Google Cloud Run** using our dedicated unified container build (`Dockerfile` at the root).

Deploying as a single unified container is the **absolute best practice** for this tech stack on Cloud Run. It eliminates cross-origin resource sharing (CORS) complications, reduces cold start overheads, avoids private VPC peering, and operates on a single serverless public URL.

---

## 1. Prerequisites

Before deploying, ensure you have:
1. **Google Cloud SDK** (`gcloud` CLI) installed locally.
2. Active GCP Project with billing enabled.
3. Enabled APIs: Cloud Build, Cloud Run, and Artifact Registry.
   ```bash
   gcloud services enable run.googleapis.com build.googleapis.com artifactregistry.googleapis.com
   ```
4. A valid **Gemini API Key** (required by the backend process solver).
5. A **`.gcloudignore`** file in the root of the project. Since `science-skills/` is ignored in your `.gitignore` to keep it out of git history, the `.gcloudignore` file tells `gcloud` to override this block and securely upload `science-skills/` to Cloud Build while still omitting large folders like `.venv/`. *(I have already created this file in your root workspace).*

---

## 2. Deploying with a Single Command

GCP's `gcloud run deploy` command handles the complete workflow:
- Uploads the workspace code to Google Cloud Build.
- Compiles the container securely using the root `Dockerfile` recipe (automatically detected by `gcloud`).
- Pushes the image to Artifact Registry.
- Provisions a serverless Cloud Run instance listening on the dynamically allocated `$PORT`.

Run the following command from the root of your project:

```bash
gcloud run deploy syngen-portal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_gemini_api_key_here"
```

> [!IMPORTANT]
> Replace `your_gemini_api_key_here` with your actual Gemini API Key. To update other optional keys (such as OpenAlex or openFDA), append them inside the `--set-env-vars` option separated by commas (e.g. `GEMINI_API_KEY=XXX,FDA_API_KEY=YYY`).

---

## 3. How the Unified Port Routing Operates

- **Unified Ingress (Nginx first)**: The container boots using a dynamic startup shell script (`entrypoint.sh`). It reads the GCP Cloud Run `$PORT` environment variable (typically `8080`) and dynamically modifies the `listen` directive inside your standard `nginx.conf` file to bind to that exact port.
- **Internal Loopback Reverse Proxy**: The startup script automatically starts the FastAPI uvicorn backend on port `8000` listening on local loopback (`127.0.0.1:8000`). It then rewires Nginx's proxy pass directive in `default.conf` from `http://backend-service:8000` to `http://127.0.0.1:8000`.
- **Static Assets Serviced directly by Nginx**: Public requests on the root URL (`/`) are routed directly to Nginx, which serves the compiled frontend assets statically, ensuring optimal load times. 
- **Dynamic API Resolving**: API calls targeting `/api/...` are captured by Nginx and reverse-proxied locally to the backend running inside the same container. No code changes are required in either the frontend or backend!

---

## 4. Post-Deployment Verification

Once the deployment completes, the `gcloud` CLI will print your public Cloud Run service URL:
```text
Service [syngen-portal] revision [syngen-portal-00001-xxx] has been deployed and is serving 100% of traffic.
Service URL: https://syngen-portal-xxxxxx-uc.a.run.app
```

Open this URL in your web browser. You will see the **SynGen** generic synthesis dashboard fully active, and the Dossier Co-pilot fully responsive to your chemical refinement instructions!
