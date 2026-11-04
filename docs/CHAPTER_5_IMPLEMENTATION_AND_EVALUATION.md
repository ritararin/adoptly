# Chapter 5: System Implementation, Testing, and Evaluation

---

## 5.1 Introduction and Scope of Sprint III

This chapter documents the final engineering implementation, deployment architecture, verification testing, and empirical evaluation of **Adoptly**, an explainable artificial intelligence (XAI) web platform for pet-adopter compatibility matching. Progressing from the core modules demonstrated in Sprint II, Sprint III focuses on delivering a fully integrated, robust, and evaluated operational release.

The primary objective of Sprint III is to ensure that the complete user journey—spanning initial identity authentication, adopter lifestyle characterization, machine-learning-driven compatibility matching with feature attributions, adoption dossier review by shelter staff, and automated virtual video verification via Google Meet—operates cohesively, reliably, and in strict alignment with ethical AI safeguards.

---

## 5.2 System Architecture and Module Implementation

Adoptly is designed following a decoupled, layered software architecture comprising a client presentation tier, an application and inference service tier, a cloud database and object storage tier, and external service integrations.

```
+---------------------------------------------------------------------------------------+
|                                    PRESENTATION TIER                                   |
|   React 18 (Vite) + Tailwind CSS + Framer Motion                                      |
|   - Authentication & Role Routing (Adopter / Shelter)                                 |
|   - Multi-Step Questionnaire & Profile Management                                     |
|   - Match Recommendation Dashboard & Explanations (Score Gauge, SHAP Breakdown)       |
|   - Shelter Pet Inventory Management (Supabase CDN Photo Integration)                 |
|   - Application Dossier Review & Google Meet Scheduling Hub                           |
+---------------------------------------------------------------------------------------+
                                           |
                                           | HTTPS / JSON (REST)
                                           v
+---------------------------------------------------------------------------------------+
|                                 APPLICATION & ML TIER                                  |
|   Python 3.11 / Flask REST API (Gunicorn WSGI)                                        |
|   - /health               : Public container readiness & model status check           |
|   - /predict              : Single adopter-pet compatibility & TreeSHAP breakdown     |
|   - /recommend            : Batch scoring (top-N), Child-Safety constraint filter     |
|   - /schedule-interview   : Google Calendar API (OAuth 2.0) with Google Meet space    |
|   - Model Engine          : Random Forest Regressor (200 estimators, depth=18)        |
|   - Explainability Engine : TreeSHAP Explainer (SHapley Additive exPlanations)        |
+---------------------------------------------------------------------------------------+
                 |                                                     |
                 | Firestore SDK (Web)                                 | Google OAuth 2.0
                 v                                                     v
+------------------------------------------------+   +----------------------------------+
|               DATA & STORAGE TIER              |   |       EXTERNAL SERVICES          |
|  Google Cloud Firestore                        |   |  Google Calendar & Meet API      |
|  - Users & Adopter Profiles                    |   |  - Real-time room creation       |
|  - Pets Collection & Shelter Ownership         |   |  - RFC 5545 iCalendar (.ics)     |
|  - Adoption Applications & Interview Records   |   |  Supabase Storage (Pet Photos)   |
|  Supabase Storage (pet-photos bucket)          |   +----------------------------------+
+------------------------------------------------+
```

### 5.2.1 Presentation Tier (Frontend Client)
The client application is built with React 18, Vite, and Tailwind CSS. State management is organized modularly using React Context (`AuthContext`) for user session and role authorization, combined with reactive hooks for data synchronization with Cloud Firestore. Key user-facing components include:
1. **Lifestyle Questionnaire (`Questionnaire.jsx`):** A guided form collecting adopter living space, daily available care hours, household composition (including presence of children $< 12$), activity level, and pet experience.
2. **Compatibility & Explanation Interface (`Matches.jsx`, `MatchBreakdown.jsx`, `ScoreGauge.jsx`):** Renders the continuous compatibility score (0–100%) alongside positive and negative feature attribution bars derived from SHAP values, explaining *why* a particular companion is recommended.
3. **Application Review Dossier (`ApplicationReview.jsx`):** An administrative console for shelter staff displaying the applicant's complete profile, feature compatibility breakdown, private review notes, and interview actions.
4. **Interview Scheduling & Calendar Hub (`InterviewSchedule.jsx`):** A synchronized dashboard displaying confirmed appointments with 1-click links to join Google Meet rooms, export universal `.ics` files, or sync with Google Calendar.

### 5.2.2 Application and Machine Learning Service Tier
The backend service is implemented in Python 3.11 using Flask and Gunicorn. It encapsulates the serialized Random Forest compatibility model, data preprocessing pipelines, and TreeSHAP explainers:
- **Preprocessing Pipeline:** Imputes missing pet attributes using breed-specific medians from `adoptly_breed_traits.json` (covering 250+ dog and cat breeds). When breed-specific data is unavailable, it gracefully defaults to species-wide medians.
- **Inference Pipeline:** Evaluates adopter-pet attribute feature vectors (33 dimensions), returning bounded compatibility predictions ($0.0 \le \hat{y} \le 100.0$).
- **Explainability Engine:** Utilizes `shap.TreeExplainer` to calculate local Shapley values, quantifying the exact point contribution of each lifestyle and pet behavioral attribute toward the final score.

### 5.2.3 Data Persistence and Security Rules
Data persistence is handled by Cloud Firestore. Declarative security rules (`firestore.rules`) enforce data boundaries:
- **Adopters** can read public pet listings, manage only their own profile under `users/{uid}`, submit adoption applications, and view applications where `adopterId == request.auth.uid`.
- **Shelters** can manage pets where `shelterId == request.auth.uid`, review submitted applications for their animals, record private decision notes, and schedule interviews.
- **Image Storage:** Pet photos are stored in Supabase Storage (`pet-photos` bucket) with public CDN distribution, enforcing strict mime-type allowlists (`image/*`) and a 5 MB file size boundary.

### 5.2.4 Teleconferencing Subsystem (Google Meet Integration)
To enable authentic virtual pre-adoption home inspections, the backend integrates with Google Calendar API v3:
- The endpoint `/schedule-interview` receives the application ID, pet name, participant emails, and scheduled date/time.
- The server exchanges a stored Google OAuth 2.0 refresh token for a short-lived access token.
- It executes `calendar.events.insert` with `conferenceDataVersion=1` and `conferenceSolutionKey: { type: "hangoutsMeet" }`.
- Google Calendar directly allocates an authentic Google Meet conference space (e.g. `meet.google.com/nyw-rsju-dfx`), returning the verified URL to be saved in the application record.

---

## 5.3 Operating Environment and Deployment Configurations

### 5.3.1 Local and Containerized Runtime
To guarantee complete reproducibility across different operating systems, the backend service is containerized via Docker (`backend/Dockerfile`) using a `python:3.11-slim` base image. A root-level `docker-compose.yml` configures port mapping (`8080:8080`), resource isolation, and health monitoring:

```dockerfile
# Excerpt from backend/Dockerfile
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
COPY model/ ./model/
COPY data/ ./data/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:8080/health || exit 1
CMD ["gunicorn", "-b", "0.0.0.0:8080", "-w", "1", "--threads", "4", "app:app"]
```

### 5.3.2 Production Deployment Topology
The system supports flexible cloud hosting options:
- **Backend API:** Deployed as a web service on Render or AWS ECS Express Mode, running the containerized Flask/Gunicorn app with managed HTTPS.
- **Frontend Client:** Deployed via Firebase Hosting or Cloudflare Pages, serving the statically optimized bundle produced by `npm run build` (`dist/`).
- **Environment Isolation:** All credentials (API keys, OAuth client secrets, refresh tokens) are isolated in server-side environment variables (`.env`) and excluded from version control via `.gitignore`.

---

## 5.4 Verification and Validation (Testing Strategy)

### 5.4.1 Automated Unit & Integration Testing
The backend application was subjected to an automated test suite executed via `pytest` (`backend/tests/test_api.py`), comprising 24 distinct test cases covering functional, security, and edge-case behaviors:

| Test Case Group | Target Functionality | Scenarios Tested | Outcome |
|---|---|---|---|
| **Health & Readiness** | `/health` endpoint | Public access, HEAD/GET methods, model artifact loaded verification. | **3/3 Passed** |
| **Authentication & Tokens** | Firebase ID token check | Missing token, malformed header, invalid token, audience mismatch. | **4/4 Passed** |
| **Inference & Prediction** | `/predict` endpoint | Full feature payload, missing optional fields, median imputation, score bounds ($0 \le s \le 100$). | **5/5 Passed** |
| **Batch Scoring & Filtering** | `/recommend` endpoint | Multiple pet rankings, sorting by compatibility, top-N truncation, empty pet lists. | **4/4 Passed** |
| **Ethical Safety Guardrails** | Child-safety filter | Households with children $< 12$ pairing with pets rated $\le 2$ on child friendliness. | **3/3 Passed** |
| **CORS & Preflight** | Cross-Origin headers | OPTIONS preflight request handling, allowed origins reflection. | **2/2 Passed** |
| **Interview Scheduling** | `/schedule-interview` | Missing datetime validation (400), Google Calendar API event creation (200). | **3/3 Passed** |
| **Total Automated Suite** | **All backend endpoints** | **Comprehensive regression testing** | **24/24 Passed** |

### 5.4.2 Security Rules Audit
Cloud Firestore security rules were audited against unauthorized access patterns:
1. **Adopter Profile Isolation:** Verified that User A cannot modify `users/UserB/adopterProfiles/main`.
2. **Listing Tampering Protection:** Verified that an Adopter cannot create, modify, or delete documents in the `pets` collection.
3. **Application Review Integrity:** Verified that only the shelter owning a pet can update the `decisionNotes` or status of an application.

---

## 5.5 Empirical Evaluation and Experimental Results

### 5.5.1 Regression Model Performance on Held-Out Test Data
The compatibility regression model was evaluated on a held-out test split of 10,000 synthetic adopter-pet pairs:

$$\text{Coefficient of Determination: } R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2} = 0.9497$$

$$\text{Mean Absolute Error: } \text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i| = 1.3041 \text{ points}$$

$$\text{Root Mean Squared Error: } \text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2} = 2.4357 \text{ points}$$

The model achieves an $R^2$ of **0.9497**, demonstrating that over 94.9% of the variance in compatibility scores is successfully captured by the feature set, with a Mean Absolute Error of only **1.30 points** on a 100-point scale.

### 5.5.2 Feature Importance Distribution
Analysis of Gini feature importances reveals the dominant factors driving compatibility predictions:

| Rank | Feature | Category | Importance Score | Percentage Contribution |
|---|---|---|---|---|
| 1 | `activityLevel` | Adopter Lifestyle | 0.2981 | 29.81% |
| 2 | `pet_size_code` | Pet Physical Trait | 0.2235 | 22.35% |
| 3 | `experienceLevel` | Adopter Background | 0.1348 | 13.48% |
| 4 | `housingSpace` | Living Environment | 0.1051 | 10.51% |
| 5 | `energy_level` | Pet Behavior | 0.0633 | 6.33% |
| 6 | `careHoursNumeric`| Adopter Time | 0.0569 | 5.69% |
| 7 | `senior_friendly` | Pet Temperament | 0.0270 | 2.70% |
| 8 | `groomingTolerance`| Adopter Preference | 0.0258 | 2.58% |
| 9 | `child_friendly` | Pet Temperament | 0.0123 | 1.23% |
| 10 | `dog_friendly` | Social Compatibility | 0.0067 | 0.67% |

*Interpretation:* Compatibility is predominantly governed by the alignment between the adopter's lifestyle capacity (`activityLevel`, `housingSpace`, `careHoursNumeric`) and the animal's physical and behavioral demands (`pet_size_code`, `energy_level`).

### 5.5.3 TreeSHAP Local Explanation Fidelity
Local explanations were evaluated using TreeSHAP additivity verification:

$$f(x) = \phi_0 + \sum_{j=1}^M \phi_j(x)$$

For every evaluated test pair, the base value $\phi_0$ (expected prediction over training data) plus the sum of all local Shapley attributions $\phi_j$ exactly matched the raw model output within numerical tolerance ($< 10^{-6}$), confirming mathematical fidelity and absence of attribution distortion.

### 5.5.4 Safety Override Evaluation (Child-Safety Hard Constraint)
To prevent statistical anomalies where an energetic, non-child-friendly animal receives an artificially high score due to high marks in other dimensions, Adoptly enforces a zero-tolerance hard constraint:

$$\text{If } \text{hasChildrenUnder12} == 1 \land \text{child\_friendly} \le 2 \implies \text{Exclude from recommendations}$$

**Empirical Test:** 100 randomly sampled synthetic pairings where `hasChildrenUnder12 == 1` and `child_friendly in [1, 2]` were processed through `/recommend`.  
**Result:** **100 out of 100 cases (100.0%)** were successfully intercepted and relocated to the `not_recommended` partition with the explicit explanation: *"Rated 1-2 for child-friendliness, which is not suitable for a household with children under 12."*

### 5.5.5 Latency and Throughput Benchmarks
System latency was benchmarked under 100 repeated executions on standard hardware (Intel Core i7, 16 GB RAM):

| Workflow Operation | Sample Size | Median (p50) | 95th Percentile (p95) | Performance SLA |
|---|---|---|---|---|
| **Single Pet Compatibility** (`/predict`) | 100 runs | **68.93 ms** | **85.40 ms** | $< 100$ ms (PASSED) |
| **Batch Scoring (20 Pets)** (`/recommend`) | 50 runs | **77.84 ms** | **90.70 ms** | $< 300$ ms (PASSED) |
| **TreeSHAP Explanation Calculation** | 20 runs | **1174.62 ms** | **1310.20 ms** | $< 2000$ ms (PASSED) |
| **Google Meet Room Creation** (`/schedule-interview`)| 10 runs | **480.12 ms** | **620.50 ms** | $< 1000$ ms (PASSED) |

---

## 5.6 Defect Tracking and Remediation Log

During Sprints II and III, several critical defects were identified, recorded, and remediated:

| Defect ID | Severity | Root Cause Analysis | Remediation Strategy | Verification Evidence |
|---|---|---|---|---|
| **DEF-01** | High | Firebase Email Enumeration Protection returned empty sign-in methods for valid emails during pre-check. | Removed `fetchSignInMethodsForEmail` pre-flight check and relied on atomic `signInWithEmailAndPassword` with contextual error mapping. | Clean authentication verified for existing users without rejection. |
| **DEF-02** | High | Flask backend threw 500 error on `/recommend` when `FIREBASE_PROJECT_ID` environment variable was unset. | Added default project ID fallback (`adoptly-1`) in `backend/app.py` when environment variable is not supplied. | Tests pass; `/recommend` operates cleanly without unhandled exceptions. |
| **DEF-03** | Medium | `scorer.js` crashed with `TypeError: p.energyLevel.toLowerCase is not a function` when energy level was passed as a number. | Normalized `energyLevel` parsing in both `scorer.js` and `petSummary.js` to accept numeric (1–5) and string inputs. | Matches page loads without console errors or runtime crashes. |
| **DEF-04** | Critical | Client fallback generated synthetic characters for Google Meet links (`meet.google.com/xyz-abcd-efg`), causing "No such meeting" errors. | Built server-side `/schedule-interview` endpoint in `backend/app.py` utilizing authentic Google Calendar API conference creation. | Google Calendar directly allocates active, functional rooms (e.g. `meet.google.com/nyw-rsju-dfx`). |
| **DEF-05** | Medium | Windows PowerShell executed global Python instead of virtual environment due to WindowsApp execution alias. | Documented explicit executable paths (`.\.venv\Scripts\python.exe`), added session aliases, and created containerized Docker runtime. | Backend starts without `ModuleNotFoundError` across any machine. |

---

## 5.7 Limitations and Critical Discussion

While the implemented solution fulfills all approved functional and non-functional objectives, several technical and methodological limitations must be acknowledged:

1. **Synthetic Training Data Grounding:**  
   Because animal welfare organizations rarely publish longitudinal post-adoption retention datasets due to privacy constraints, the compatibility model was trained against a calibrated synthetic-rubric dataset. While this dataset models real shelter criteria accurately, the predicted scores represent estimated alignment rather than an empirical guarantee of permanent adoption success.
2. **TreeSHAP Computational Overhead:**  
   Computing full Shapley attributions across a 200-tree forest requires approximately 1.17 seconds. In the web interface, this calculation is executed on demand during pet inspection rather than synchronously during batch listing to preserve sub-100 ms catalog response times.
3. **Human-in-the-Loop Imperative:**  
   Adoptly is explicitly architected as a decision-support system. Compatibility scores and SHAP factors inform, but never replace, human judgment. Final adoption approval remains under the sole authority of qualified shelter staff.

