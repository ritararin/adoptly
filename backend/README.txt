ADOPTLY COMPATIBILITY API (FLASK)
==================================
A lightweight Flask service that serves compatibility predictions between
shelter pets and potential adopters based on an exported Random Forest model.

Features:
- Firebase ID token verification (stateless, verifies audience and issuer).
- Hard child-safety filter for households with children under 12.
- SHAP feature contributions for top factors (effect: 'raises' or 'lowers').
- Breed traits lookup from adoptly_breed_traits.json with species medians fallback.
- Support for single prediction (/predict) and batch ranking (/recommend).

LOCAL SETUP & EXECUTION
-----------------------
1. Activate virtual environment:
   python -m venv .venv
   .venv\Scripts\activate          (Windows)
   source .venv/bin/activate       (Mac/Linux)

2. Install dependencies:
   pip install -r requirements-dev.txt

3. Run tests (22 test suite):
   python -m pytest -q

4. Start local development server:
   set FIREBASE_PROJECT_ID=adoptly-1
   set ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   python app.py

5. Test health endpoint:
   curl http://127.0.0.1:8080/health
   Response: {"status":"ok","model_loaded":true,"scikit_learn":"1.6.1"}
