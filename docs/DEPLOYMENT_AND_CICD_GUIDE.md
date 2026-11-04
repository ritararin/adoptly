# Adoptly Continuous Deployment (CI/CD) & Live Hosting Guide

This guide details the automated deployment architecture for **Adoptly: Explainable Pet-Adopter Compatibility Matching**.

The system is configured so that **every time you push changes to GitHub (`git push`), the live application automatically rebuilds and redeploys without manual intervention.**

---

## 1. Architecture Overview

Adoptly is composed of two primary live cloud tiers and a cloud database:

```
                            ┌──────────────────────────────────────────┐
                            │               GitHub Repo                │
                            │   https://github.com/ritararin/adoptly   │
                            └────────────────────┬─────────────────────┘
                                                 │
                                git push (triggers webhooks)
                                                 │
            ┌────────────────────────────────────┴────────────────────────────────────┐
            ▼                                                                         ▼
┌───────────────────────────────┐                                     ┌───────────────────────────────┐
│        Frontend Tier          │                                     │         Backend Tier          │
│       Vercel / Firebase       │                                     │          Render Web           │
│   (React 18 + Vite + Tailwind)│                                     │   (Flask + Scikit-Learn +     │
│                               │                                     │    SHAP + Google Meet API)    │
│  - Auto-builds on git push    │                                     │  - Auto-builds on git push    │
│  - HTTPS enabled              │                                     │  - Gunicorn 4-worker service  │
│  - SPA rewrite rules enabled  │                                     │  - Continuous health checks   │
│  - Global CDN distribution    │                                     │  - Live Meet conference gen   │
└───────────────┬───────────────┘                                     └───────────────┬───────────────┘
                │                                                                     │
                │ calls VITE_API_URL (/predict, /recommend, /schedule-interview)      │
                └─────────────────────────────────┬───────────────────────────────────┘
                                                  │
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │       Cloud Services Tier       │
                                 │  - Firebase Auth & Firestore    │
                                 │  - Supabase Storage (Pet Media) │
                                 │  - Google Calendar API (Meet)   │
                                 └─────────────────────────────────┘
```

---

## 2. Automated Backend Deployment (Render)

The backend ML service is defined using **Infrastructure-as-Code** in [`render.yaml`](file:///c:/Users/ritar/PROJECT/adoptly/render.yaml) and [`backend/render.yaml`](file:///c:/Users/ritar/PROJECT/adoptly/backend/render.yaml).

### How It Automatically Updates on Git Push:
Render connects to your GitHub repository using webhooks. When you push new code to your branch (`main` or `sprint-2-development`), Render:
1. Detects the commit automatically.
2. Triggers an automatic zero-downtime build.
3. Installs dependencies (`pip install -r requirements.txt`).
4. Verifies the service with the `/health` endpoint probe.
5. Swaps traffic over to the newly deployed version.

### 1-Click Initial Setup on Render:
1. Sign in to [Render.com](https://render.com) with your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select your repository: `ritararin/adoptly`.
4. Configure the settings (or use the Blueprint from `render.yaml`):
   - **Name:** `adoptly-api`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn -b 0.0.0.0:$PORT -w 1 --threads 4 app:app`
   - **Auto-Deploy:** Select **Yes** (Default)
5. Under **Environment Variables**, add:
   | Key | Value | Purpose |
   |---|---|---|
   | `FIREBASE_PROJECT_ID` | `adoptly-1` | Token verification |
   | `ALLOWED_ORIGINS` | `*` | Allows calls from Vercel & local dev |
   | `PYTHON_VERSION` | `3.11.9` | Matches training runtime |
   | `OAUTH_CLIENT_ID` | `your-google-oauth-client-id` | Google Calendar Meet creation |
   | `OAUTH_CLIENT_SECRET` | `your-google-oauth-client-secret` | Google Calendar Meet creation |
   | `OAUTH_REFRESH_TOKEN` | `your-google-oauth-refresh-token` | Permanent offline OAuth token |
6. Click **Create Web Service**.
7. Note down your Render backend URL (e.g. `https://adoptly-api.onrender.com`).

---

## 3. Automated Frontend Deployment (Vercel)

The frontend is configured with [`vercel.json`](file:///c:/Users/ritar/PROJECT/adoptly/vercel.json) and [`frontend/vercel.json`](file:///c:/Users/ritar/PROJECT/adoptly/frontend/vercel.json) for Vite Single Page Application routing.

### How It Automatically Updates on Git Push:
Vercel connects to GitHub at the repository level. Every time you run `git push`:
1. Vercel receives the webhook notification.
2. Runs `npm --prefix frontend run build` (~35-40 seconds).
3. Deploys the static assets to Vercel's global edge network.
4. Updates the production URL automatically.

### 1-Click Initial Setup on Vercel:
1. Sign in to [Vercel.com](https://vercel.com) with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select `ritararin/adoptly`.
4. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and select `frontend` (or leave as root, both work because of root `vercel.json`).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, paste the following keys from your `.env.local`:
   | Key | Value | Purpose |
   |---|---|---|
   | `VITE_API_URL` | `https://adoptly-api.onrender.com` | Deployed Render ML service URL |
   | `VITE_FIREBASE_API_KEY` | *(your Firebase Web API Key)* | Client Auth |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `adoptly-1.firebaseapp.com` | Client Auth domain |
   | `VITE_FIREBASE_PROJECT_ID` | `adoptly-1` | Firestore & Functions project |
   | `VITE_FIREBASE_STORAGE_BUCKET`| `adoptly-1.firebasestorage.app` | Firebase Storage |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `745134776715` | Cloud Messaging |
   | `VITE_FIREBASE_APP_ID` | `1:745134776715:web:04fb5f4481076f18fe3987` | Firebase Web Client ID |
   | `VITE_SUPABASE_URL` | `https://mwtvftmddgkgxepbaxup.supabase.co` | Pet photo CDN |
   | `VITE_SUPABASE_ANON_KEY` | *(your Supabase anon key)* | Photo uploads |
   | `VITE_USE_MOCK_ML` | `false` | Always use real trained ML model |
   | `VITE_SHELTER_DOMAINS` | `testshelter.com,your-shelter@gmail.com` | Shelter role auto-detection |
6. Click **Deploy**.
7. In ~40 seconds, your site is live with HTTPS (e.g. `https://adoptly.vercel.app`).

---

## 4. Alternative: Firebase Hosting Deployment

If you prefer deploying the frontend directly to Firebase Hosting (`adoptly-1.web.app`):
[`firebase.json`](file:///c:/Users/ritar/PROJECT/adoptly/firebase.json) is configured with:
```json
"hosting": {
  "public": "frontend/dist",
  "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
  "rewrites": [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

You can deploy anytime locally by running:
```powershell
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```
Or connect GitHub Actions to Firebase Hosting using `firebase init hosting:github`.

---

## 5. Automated CI/CD Testing Pipeline

Every commit pushed to GitHub triggers the automated GitHub Actions pipeline defined in [`.github/workflows/ci-cd.yml`](file:///c:/Users/ritar/PROJECT/adoptly/.github/workflows/ci-cd.yml):

- **Job 1 (`test-backend`):** Spins up a clean Linux environment, installs Python 3.11, and executes all 24 automated unit tests (`pytest backend/tests/`).
- **Job 2 (`build-frontend`):** Sets up Node.js 20 and executes `npm run build` to verify there are 0 build or lint errors before deployment.

---

## 6. Daily Workflow: How to Make Changes and Deploy

Whenever you make any change to code, styling, or documentation:

1. **Commit your changes:**
   ```powershell
   git add .
   git commit -m "feat: description of your change"
   ```

2. **Push to GitHub:**
   ```powershell
   git push origin main
   ```
   *(or `git push origin sprint-2-development`)*

3. **That's it!**
   - GitHub Actions validates your tests automatically.
   - Render detects the push and redeploys the backend API.
   - Vercel detects the push and redeploys the frontend UI.
   - Both live URLs are updated within 60 to 90 seconds.

