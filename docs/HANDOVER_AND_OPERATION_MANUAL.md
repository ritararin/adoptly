# Adoptly: Handover & System Operation Manual

**Sprint:** Sprint III (Project Completion, Deployment & Final Evaluation)  
**Project:** Adoptly — Explainable Pet-Adopter Compatibility Matching  
**Author:** Strathmore University Project Team  

---

## 1. System Requirements & Prerequisites

Ensure the host machine meets the following minimum environment requirements:
- **Operating System:** Windows 10/11, macOS (12+), or Linux (Ubuntu 20.04+)
- **Python:** Version 3.11.x (installed and available on PATH)
- **Node.js:** Version 18.x or 20.x LTS
- **Package Managers:** `npm` (v9+) and `pip` (v23+)
- **Container Runtime (Optional):** Docker and Docker Compose (v2+)
- **Internet Access:** Required for Firebase Authentication, Cloud Firestore, Supabase Storage, and Google Meet API calls.

---

## 2. Repository Structure

```text
adoptly/
├── backend/
│   ├── app.py                     # Main Flask REST API & Google Meet endpoint
│   ├── evaluate_model.py          # Empirical model evaluation & benchmark suite
│   ├── requirements.txt           # Pinned Python backend dependencies
│   ├── Dockerfile                 # Production container specification
│   ├── .env.example               # Backend environment template
│   ├── data/                      # Breed behavioral traits knowledge base
│   ├── model/                     # Serialized Random Forest model artifact
│   └── tests/                     # Automated pytest suite (24 unit/integration tests)
├── frontend/
│   ├── src/                       # React 18 application source code
│   │   ├── components/            # ScoreGauge, MatchBreakdown, StatusBadge, etc.
│   │   ├── context/               # AuthContext for role & session management
│   │   ├── lib/                   # API clients, Firebase, calendar utils, scorer
│   │   └── pages/                 # Matches, Questionnaire, ApplicationReview, etc.
│   ├── package.json               # Frontend dependencies & build scripts
│   ├── .env.example               # Frontend environment template
│   └── vite.config.js             # Vite development & build configuration
├── docs/                          # Academic documentation & Sprint III deliverables
│   ├── CHAPTER_5_IMPLEMENTATION_AND_EVALUATION.md
│   ├── CHAPTER_6_CONCLUSIONS_AND_RECOMMENDATIONS.md
│   ├── TRACEABILITY_MATRIX.md
│   ├── MODEL_EVALUATION_REPORT.md
│   ├── HANDOVER_AND_OPERATION_MANUAL.md
│   └── FINAL_DEMONSTRATION_SCRIPT.md
├── docker-compose.yml             # Orchestration for containerized execution
├── firebase.json                  # Firebase configuration
└── README.md                      # High-level project README
```

---

## 3. Quick Start: Local Native Execution

### Step 1: Clone Repository
```bash
git clone https://github.com/ritararin/adoptly.git
cd adoptly
```

### Step 2: Configure Environment Variables

**Backend (`backend/.env`):**
Create `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=8080
HOST=0.0.0.0
FIREBASE_PROJECT_ID=adoptly-1
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000
MODEL_PATH=model/adoptly_compatibility_model.joblib
BREED_TRAITS_PATH=data/adoptly_breed_traits.json
```

**Frontend (`frontend/.env.local`):**
Create `frontend/.env.local` (or copy from `frontend/.env.example`):
```env
VITE_FIREBASE_API_KEY=AIzaSyBvmM92RnP1MdpNDeHPd-8qmzGxVOB69xA
VITE_FIREBASE_AUTH_DOMAIN=adoptly-1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=adoptly-1
VITE_FIREBASE_STORAGE_BUCKET=adoptly-1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1081156100570
VITE_FIREBASE_APP_ID=1:1081156100570:web:02553b6fe56cb10ecc60e3
VITE_USE_FIREBASE_EMULATORS=false
VITE_SHELTER_DOMAINS=testshelter.com,ritararin@gmail.com
VITE_API_URL=http://127.0.0.1:8080
VITE_ML_ENDPOINT=http://127.0.0.1:8080/predict
VITE_USE_MOCK_ML=false
```

### Step 3: Run the Python Backend
In a terminal window:
```bash
cd backend

# On Windows:
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python app.py

# On macOS/Linux:
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
*The server will start on `http://0.0.0.0:8080`. Verify by opening `http://127.0.0.1:8080/health` in your browser.*

### Step 4: Run the React Frontend
In a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Vite will display the local URL (typically `http://localhost:5173`). Open it in your web browser.*

---

## 4. Alternative: Running via Docker Compose

To start the backend in a containerized environment:
```bash
# From project root
docker compose up --build -d
```
Verify the container health status:
```bash
docker ps
curl http://localhost:8080/health
```

---

## 5. Verification Commands for Assessors

### Run Backend Unit & Integration Tests (24 Test Cases)
```bash
cd backend
pytest tests/ -v
```
*Expected Result: `================== 24 passed in ~8s ==================`*

### Run Empirical Model Evaluation & Latency Benchmarks
```bash
cd backend
python evaluate_model.py
```
*Expected Result: Evaluates $R^2$ ($0.9497$), MAE ($1.3041$), child-safety compliance ($100\%$), and updates `docs/MODEL_EVALUATION_REPORT.md`.*

### Verify Frontend Production Build
```bash
cd frontend
npm run build
```
*Expected Result: `✓ built in ~45s` with output in `dist/` and zero compilation errors.*

---

## 6. Demonstration Accounts for Assessment

| User Role | Email / Credentials | Access Permissions & Notes |
|---|---|---|
| **Shelter Staff** | `ritararin@gmail.com` *(or any email ending in `@testshelter.com`)* | Full access to Shelter Portal: Create/Edit Pets, Review Applications, Access Private Dossiers, Schedule Google Meet Interviews, Confirm Adoptions. |
| **Adopter** | Any valid personal email (e.g. `adopter@example.com` or Google Sign-In) | Access to Adopter Journey: Lifestyle Questionnaire, Recommended Matches, SHAP Factor Breakdown, Submit Applications, Join Google Meet. |

---

## 7. Troubleshooting Guide

| Issue / Symptom | Possible Cause | Resolution |
|---|---|---|
| `ModuleNotFoundError: No module named 'google'` | Windows PowerShell executing global Python instead of `.venv` Python. | Run `.\.venv\Scripts\python.exe app.py` or run `python -m pip install -r requirements.txt`. |
| `500 Internal Server Error` on `/recommend` | `FIREBASE_PROJECT_ID` missing. | Handled automatically with fallback to `adoptly-1`. Ensure `backend/app.py` is up to date. |
| Google Meet displays "No such meeting" | Using synthetic random string from old fallback. | Ensure backend is running so `/schedule-interview` creates an authentic room via Google Calendar API. |
| Port 8080 already in use | Another background process running on port 8080. | Change port in `.env` (e.g. `PORT=8081`) and update `VITE_API_URL=http://127.0.0.1:8081` in `frontend/.env.local`. |

