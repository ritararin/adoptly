# Adoptly: Requirements & Objectives Traceability Matrix

**Project:** Adoptly — Explainable Pet-Adopter Compatibility Matching  
**Sprint:** Sprint III (Project Completion, Deployment & Final Evaluation)  
**Academic Institution:** Strathmore University  

---

## 1. Project Objectives Traceability

| Objective ID | Objective Description | Implemented Subsystems & Modules | Verification / Evaluation Method | Outcome & Evidence | Status |
|---|---|---|---|---|---|
| **OBJ-01** | **Design and curate an adopter-pet compatibility dataset** combining animal behavioral traits and adopter lifestyle factors. | `backend/data/adoptly_breed_traits.json`, `ml-service/build_compatibility_pairs.py` | Statistical validation, median imputation, schema validation. | 40,000 training pairs & 10,000 held-out evaluation pairs covering 33 features. | **MET** |
| **OBJ-02** | **Develop and train an interpretable machine learning regression model** to predict adopter-pet compatibility. | `backend/model/adoptly_compatibility_model.joblib`, `backend/app.py` | Scikit-learn offline evaluation, held-out validation ($R^2$, MAE, RMSE). | $R^2 = 0.9497$, $\text{MAE} = 1.3041$, $\text{RMSE} = 2.4357$ points on held-out test set. | **MET** |
| **OBJ-03** | **Incorporate Explainable AI (XAI)** to identify feature contributions and provide transparent rationales for recommendations. | TreeSHAP (`shap.TreeExplainer`), `frontend/src/components/MatchBreakdown.jsx`, `frontend/src/lib/petSummary.js` | SHAP additivity checks, feature attribution consistency tests, unit tests. | Dynamic breakdown of positive/negative contributing factors displayed per pet. | **MET** |
| **OBJ-04** | **Implement an ethical guardrail & safety override system** to prevent high compatibility recommendations for child-unsafe pet pairings. | `backend/app.py` (`CHILD_UNSAFE_MAX = 2`), `frontend/src/pages/Matches.jsx` | Automated safety override tests in `backend/evaluate_model.py` and `test_api.py`. | 100% exclusion rate achieved across 100 synthetic test cases of households with children $<12$. | **MET** |
| **OBJ-05** | **Deploy an end-to-end full-stack web application** with role-based workflows for adopters, shelters, and virtual interview verification. | React frontend (`frontend/src/`), Flask API (`backend/app.py`), Cloud Firestore, Google Meet API. | End-to-end integration testing, pytest suite (24/24 passed), Vite production build. | Fully functioning web application supporting account creation, pet listings, questionnaire, applications, and live Google Meet. | **MET** |

---

## 2. Functional Requirements Traceability (FR-01 to FR-08)

| Req ID | Requirement Description | Implementation Component(s) | Verification & Test Method | Result & Supporting Evidence |
|---|---|---|---|---|
| **FR-01** | **User Authentication & Role Assignment**<br>Adopter and Shelter roles with secure session management. | `frontend/src/context/AuthContext.jsx`<br>`frontend/src/pages/Login.jsx`<br>`frontend/src/pages/Register.jsx` | Unit test & manual auth test; Firebase auth token verification via `id_token.verify_firebase_token`. | Successfully signs in via email/password or Google OAuth; automatically assigns role based on verified email domain list. |
| **FR-02** | **Adopter Lifestyle Questionnaire & Persistence**<br>Multi-step questionnaire capturing housing, activity, household members, care time, and experience. | `frontend/src/pages/Questionnaire.jsx`<br>`frontend/src/lib/api.js` (`setAdopterProfile`)<br>Firestore `users/{uid}/adopterProfiles/main` | Client-side schema validation, Firestore read/write verification, mock input tests. | Adopter profile persists across sessions in Cloud Firestore and auto-populates lifestyle cards in review dossiers. |
| **FR-03** | **Shelter Pet Listings Management**<br>Shelters can create, update, delete, and manage availability of pet profiles. | `frontend/src/pages/ShelterListings.jsx`<br>`frontend/src/lib/api.js` (`createPet`, `updatePet`, `deletePet`)<br>`frontend/src/lib/api.js` (`uploadPetPhoto` via Supabase) | Image size/type validation ($< 5\text{MB}$), Supabase storage upload test, CRUD integration test. | Pet records persist in Firestore `pets` collection with Supabase public CDN image URLs; status updates reflect immediately. |
| **FR-04** | **Public Pet Catalog & Preference Exploration**<br>Adopters can browse, search, and filter available pets with species-aware explanations. | `frontend/src/pages/Matches.jsx`<br>`frontend/src/pages/PetDetail.jsx`<br>`frontend/src/components/PetCard.jsx` | Filtering toggle tests (Dogs Only vs Explore All), responsive grid verification. | Filter correctly displays preferred species while surfacing an alert banner if another animal has higher compatibility. |
| **FR-05** | **Automated Compatibility Scoring Engine**<br>Batch and individual scoring of pets against adopter profile via ML inference. | `backend/app.py` (`/predict`, `/recommend`)<br>`frontend/src/recommendationApi.js`<br>`backend/model/adoptly_compatibility_model.joblib` | 24 automated unit tests in `backend/tests/test_api.py`; batch scoring verification. | Returns continuous compatibility score (0-100) within 77.8 ms (p50 batch of 20 pets). |
| **FR-06** | **Explainable AI (TreeSHAP) & Safety Filter**<br>Feature contribution explanations (positive/negative impacts) and hard safety exclusion. | `backend/app.py` (`compute_explanation`)<br>`frontend/src/components/MatchBreakdown.jsx`<br>`frontend/src/components/ScoreGauge.jsx` | Mathematical additivity test: $\sum \phi_i + \phi_0 = f(x)$; 100/100 child-safety exclusion test. | Top factors display clear human-readable labels ("Raises score +3.4", "Lowers score -2.1") and child-safety banner. |
| **FR-07** | **Adoption Application Submission & Dossier Review**<br>Adopters can submit applications; shelters review compatibility dossier with private review notes. | `frontend/src/pages/PetDetail.jsx`<br>`frontend/src/pages/ApplicationReview.jsx`<br>`frontend/src/pages/MyApplications.jsx` | Application state machine transitions: `Pending Review` $\to$ `Interview Scheduled` $\to$ `Adoption Completed` / `Failed Adoption`. | Complete application dossier renders score gauge, feature contributions, and applicant lifestyle metadata. |
| **FR-08** | **Live Virtual Interview Scheduling & Multi-Calendar Sync**<br>Automated Google Meet room generation and multi-calendar invite synchronization. | `backend/app.py` (`/schedule-interview`)<br>`frontend/src/lib/api.js` (`scheduleGoogleMeet`)<br>`frontend/src/lib/calendar.js`<br>`frontend/src/pages/InterviewSchedule.jsx` | Google Calendar API test with OAuth refresh token; `.ics` RFC 5545 validation; 1-click Google Calendar URL validation. | Creates valid Google Meet room (`meet.google.com/nyw-rsju-dfx`), generates downloadable `.ics` file, and updates Firestore. |

---

## 3. Non-Functional Requirements Traceability (NFR-01 to NFR-06)

| NFR ID | Requirement Category | Specification | Implementation Strategy | Verified Outcome |
|---|---|---|---|---|
| **NFR-01** | **Performance & Latency** | Single pet inference $< 100$ ms; batch inference (20 pets) $< 300$ ms. | In-memory model caching, pre-computed breed medians, vectorised NumPy array generation. | Single inference: **68.9 ms** (p50); Batch inference: **77.8 ms** (p50). Target exceeded. |
| **NFR-02** | **Security & Access Control** | Principle of least privilege; shelters cannot edit another shelter's pets; users cannot view other applications. | Cloud Firestore declarative security rules (`firestore.rules`), Firebase ID token validation (`verify_token`). | Verified by automated pytest suite and security rules audit. |
| **NFR-03** | **Responsiveness & Usability** | Usable on desktop (1080p) and mobile (375px) without horizontal scroll; intuitive navigation. | Tailwind CSS utility breakpoints (`sm:`, `md:`, `lg:`), Framer Motion layout transitions. | Successfully verified across desktop and mobile viewports with responsive navigation and touch targets. |
| **NFR-04** | **System Reliability & Recovery** | Server failure or network downtime must not produce unrecoverable or corrupted states. | Graceful try/catch fallbacks; client-side rubric fallback (`scorer.js`) if ML backend is offline; retry prompts. | System displays informative advisory banners without crashing when the ML backend is unavailable. |
| **NFR-05** | **Privacy & Credentials Protection** | No sensitive credentials, private keys, or OAuth refresh tokens in frontend bundles or Git. | Server-side credential isolation in `.env`, Git exclusion in `.gitignore`, Google OAuth token exchange handled solely in backend. | Verified: 0 secrets in frontend code; all secrets loaded via environment variables on the backend. |
| **NFR-06** | **Explainability & Ethical AI Transparency** | Model predictions must never be presented as absolute truth or automated decision-makers. | Prominent disclaimers, TreeSHAP impact labels, human-in-the-loop review mandate. | Evaluated in UI: every score displays disclaimer and explicit feature contributions. |

---

## 4. Honest Scope & Architectural Trade-Off Disclosures

1. **Decoupling from Cloud Functions Blaze Tier:**
   - *Intended Design in Sprint I:* Host Google Meet scheduling exclusively on Firebase Cloud Functions.
   - *Adjustment in Sprint III:* Google Cloud disables outbound internet access for Cloud Functions on the free Spark tier, preventing Google OAuth token exchange without a paid credit card billing account.
   - *Resolution & Architectural Choice:* The Google Calendar/Meet OAuth integration was routed to the Python Flask backend (`backend/app.py`), which runs independently (locally or on Render/AWS) with full outbound HTTPS capabilities. This allows the system to remain 100% reproducible for assessors without requiring a paid billing plan.
2. **Synthetic Adopter Training Distribution:**
   - *Limitation:* Real-world adoption longitudinal outcome datasets (e.g. 5-year post-adoption retention rates) are not publicly available due to privacy regulations and fragmented shelter records.
   - *Mitigation:* The compatibility model was trained against a rigorous synthetic-rubric dataset constructed from documented shelter evaluation rubrics and verified breed behavioral standards (`adoptly_breed_traits.json`). Disclaimers are prominently displayed across the application to clarify that scores represent heuristic alignment rather than guaranteed adoption success.

