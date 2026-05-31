# Deployment Guide: GCP Cloud Run

This guide outlines the standard procedure for deploying the **SynGen (AI Pharma Review & Generic Drug Synthesis Portal)** to **Google Cloud Run** using our dedicated unified container build (`Dockerfile.cloudrun`).

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

---

## 2. Deploying with a Single Command

GCP's `gcloud run deploy` command handles the complete workflow:
- Uploads the workspace code to Google Cloud Build.
- Compiles the container securely using the `Dockerfile.cloudrun` recipe.
- Pushes the image to Artifact Registry.
- Provisions a serverless Cloud Run instance listening on the dynamically allocated `$PORT`.

Run the following command from the root of your project:

```bash
gcloud run deploy syngen-portal \
  --source . \
  --file Dockerfile.cloudrun \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_gemini_api_key_here"
```

> [!IMPORTANT]
> Replace `your_gemini_api_key_here` with your actual Gemini API Key. To update other optional keys (such as OpenAlex or openFDA), append them inside the `--set-env-vars` option separated by commas (e.g. `GEMINI_API_KEY=XXX,FDA_API_KEY=YYY`).

---

## 3. How the Unified Port Routing Operates

- **Unified Port Mapping**: Cloud Run dynamically spins up the container and sets the `$PORT` environment variable (usually `8080`). Our command runner receives this and starts Uvicorn on that exact port:
  ```dockerfile
  CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
  ```
- **Static Assets Serviced Natively**: FastAPI serves the frontend assets (HTML, CSS, JS) at the root url (`/`), while keeping the API endpoints active at `/api/...`.
- **Dynamic API Resolving**: In `frontend/app.js`, `API_BASE_URL` dynamically resolves to `/api` because the app is running on the main Cloud Run port instead of the local dev port (`3000`). All frontend fetch queries route securely to the backend endpoints under a single domain.

---

## 4. Post-Deployment Verification

Once the deployment completes, the `gcloud` CLI will print your public Cloud Run service URL:
```text
Service [syngen-portal] revision [syngen-portal-00001-xxx] has been deployed and is serving 100% of traffic.
Service URL: https://syngen-portal-xxxxxx-uc.a.run.app
```

Open this URL in your web browser. You will see the **SynGen** generic synthesis dashboard fully active, and the Dossier Co-pilot fully responsive to your chemical refinement instructions!
