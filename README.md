# Adoptly: Explainable ML Pet Adoption Platform

Adoptly is a full-stack pet adoption platform that uses machine learning to recommend pets based on an adopter's lifestyle, living environment, and ability to meet a pet's needs. It combines Random Forest Regression with SHAP (SHapley Additive Explanations) to generate compatibility scores and explain the factors contributing to recommendations.

## Table of Contents

- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Git Workflow and Project Management](#git-workflow-and-project-management)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [License and Access Statement](#license-and-access-statement)

## Problem Statement

Traditional pet adoption platforms primarily function as listing services. Matching adopters with pets often depends on manual screening and subjective judgment, which may overlook important compatibility factors such as activity level, housing conditions, available care time, and previous pet experience.

Adoptly addresses this problem through a data-driven recommendation system that estimates compatibility between adopters and available pets. A Random Forest Regression model generates compatibility scores, while SHAP helps explain the factors contributing to each prediction. Shelter oversight workflows support responsible application review and adoption decisions.

The system provides decision support; its recommendations do not replace shelter assessment or guarantee successful adoptions.

## Objectives

1. Develop a platform where adopters can discover pets and shelters can manage pet listings.
2. Estimate adopter-pet compatibility using Random Forest Regression.
3. Explain recommendations using SHAP feature contributions.
4. Support adoption applications and shelter review workflows.
5. Support interview scheduling through Google Calendar and Google Meet integration.

## Key Features

- **User authentication:** Firebase Authentication for account registration and login.
- **Role-based workflows:** Separate functionality for adopters, shelters, and authorized administrators.
- **Pet management:** Create and manage pet listings and associated information.
- **Compatibility scoring:** Estimate compatibility using adopter and pet attributes.
- **Explainable recommendations:** Display contributing factors using SHAP.
- **Adoption applications:** Support application submission and shelter review.
- **Image storage:** Supabase Storage integration for pet images.
- **Interview scheduling:** Google Calendar integration intended to support interview scheduling and Google Meet link generation.

Feature availability depends on the implementation and configuration of the current version.

## System Architecture

Adoptly is organized as a monorepo containing the frontend, machine learning service, and backend functions.

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | React, Vite, Tailwind CSS, Framer Motion | User interface and client-side workflows |
| Authentication | Firebase Authentication | User registration and login |
| Database | Cloud Firestore | Application data storage |
| Backend | Firebase Cloud Functions, Node.js | Server-side workflows and integrations |
| Machine Learning | Python, Flask, scikit-learn | Compatibility prediction |
| Explainable AI | SHAP | Explanation of model predictions |
| Image Storage | Supabase Storage | Pet image storage |
| Scheduling | Google Calendar API | Calendar and meeting-related workflows |

### Machine Learning Workflow

1. Retrieve adopter and pet attributes.
2. Prepare the input features required by the trained model.
3. Use Random Forest Regression to estimate compatibility.
4. Use SHAP to calculate feature contributions.
5. Return the compatibility score and explanation to the calling application.
6. Display recommendations to the adopter.

The model produces an estimated compatibility score, not a guarantee of adoption success.

## Technology Stack

- React
- Vite
- Tailwind CSS
- Framer Motion
- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Functions
- Python
- Flask
- pandas
- NumPy
- scikit-learn
- SHAP
- Supabase Storage
- Google Calendar API
- Git and GitHub

Exact dependency versions are defined in the project's dependency files.

## Prerequisites

Install the following tools before setting up the project:

- Git
- Node.js and npm
- Python 3.11 or a version supported by the ML service dependencies
- Firebase CLI
- A Firebase project or a configured Firebase Emulator Suite
- A Supabase project if image storage is enabled
- Google Cloud credentials and an enabled Google Calendar API if scheduling integration is enabled

Verify your installations:

    git --version
    node --version
    npm --version
    python --version
    firebase --version

## Project Structure

The repository follows this general structure. Some paths may differ depending on the current branch.

    adoptly/
    ├── frontend/
    │   └── React and Vite application
    ├── functions/
    │   └── Firebase Cloud Functions
    ├── ml-service/
    │   ├── app.py
    │   ├── requirements.txt
    │   ├── model/
    │   └── data/
    ├── firebase.json
    ├── .gitignore
    └── README.md

The `model/` and `data/` directories contain the model artifacts and supporting data required by the ML service, where applicable.

Do not commit environment files, service-account keys, private credentials, or other sensitive information.

## Installation and Setup

### 1. Clone the Repository

    git clone https://github.com/ritararin/adoptly.git
    cd adoptly

If the repository is private, GitHub access permissions are required.

### 2. Set Up the Frontend

    cd frontend
    npm install

Create a `.env.local` file in the `frontend/` directory and configure the required environment variables.

### 3. Set Up the Machine Learning Service

From the repository root:

    cd ml-service
    python -m venv venv

Activate the virtual environment.

**Windows PowerShell:**

    .\venv\Scripts\Activate.ps1

**Windows Command Prompt:**

    venv\Scripts\activate.bat

**macOS/Linux:**

    source venv/bin/activate

Install the dependencies:

    pip install -r requirements.txt

Ensure that the trained model, feature definitions, preprocessing artifacts, and required data files are present in the expected locations.

### 4. Set Up Firebase Cloud Functions

From the repository root:

    cd functions
    npm install

If a build script is defined in `functions/package.json`, run:

    npm run build

### 5. Configure Firebase

From the repository root, authenticate with Firebase:

    firebase login

Select the appropriate Firebase project when using a real project:

    firebase use YOUR_FIREBASE_PROJECT_ID

Replace the placeholder with your actual Firebase project ID.

For local development, check `firebase.json` to confirm which emulator services are configured.

## Environment Configuration

Environment files contain project-specific configuration and credentials. Keep them local and exclude them from version control.

### Frontend Configuration

Create `frontend/.env.local`:

    # Firebase configuration
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id

    # Supabase Storage
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

    # Machine learning configuration
    VITE_USE_MOCK_ML=true
    VITE_ML_ENDPOINT=

Replace the example values with the credentials and settings for your environment.

**Machine learning mode:**

- `VITE_USE_MOCK_ML=true` selects the mock-scoring path if supported by the current implementation.
- `VITE_USE_MOCK_ML=false` disables the mock setting but does not automatically connect the frontend to the trained model.
- Configure `VITE_ML_ENDPOINT` or the appropriate backend function endpoint according to the integration implemented in the current branch.

Restart the Vite development server after modifying environment variables.

**Security note:** Vite variables prefixed with `VITE_` are exposed to client-side code. Never place service-account private keys or other server-side secrets in these variables.

### Firebase and Google Calendar Configuration

Configure Firebase project settings and any required integration secrets using the supported secret-management approach.

If local development requires a Google service-account JSON key, store it securely outside version control and follow the authentication method implemented by the backend.

**Windows PowerShell example:**

    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"

**macOS/Linux example:**

    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

Enable the Google Calendar API in the relevant Google Cloud project if calendar integration is being tested.

Do not commit service-account credentials, private keys, or production secrets.

### Machine Learning Configuration

The Flask service loads the model artifacts and supporting files specified by `ml-service/app.py`.

Confirm that the expected files exist and that the paths in the application match the repository structure. Missing model artifacts or incompatible dependencies may prevent the service from starting.

## Running the Application

Local development may require three separate terminals.

### Terminal 1: Start the ML Service

From the repository root:

    cd ml-service

Activate the virtual environment, then run:

    python app.py

The expected local address in the current configuration is:

    http://127.0.0.1:8080

Confirm the actual address and port from the terminal output.

### Terminal 2: Start Firebase Emulators

From the repository root:

    firebase emulators:start

The Emulator UI is commonly available at:

    http://127.0.0.1:4000

Use the address and ports reported by the emulator. Ensure that the frontend is configured to connect to the emulators during local development.

### Terminal 3: Start the Frontend

From the repository root:

    cd frontend
    npm run dev

Vite normally serves the application at:

    http://localhost:5173

Open the local address displayed in the terminal.

### Verify ML Integration

Running the frontend, backend functions, and ML service separately does not guarantee that they are integrated.

Confirm that:

- The frontend calls the intended endpoint.
- The request contains the fields expected by that endpoint.
- The backend forwards the request correctly.
- The response schema matches what the frontend expects.
- The model loads successfully and returns valid predictions.
- SHAP explanations are returned and displayed correctly.

## Testing

Testing should cover the ML API, user workflows, access control, storage, and integrations.

### 1. Test the ML Prediction Endpoint

If the Flask service exposes `POST /predict`, the following request illustrates how to test it using `curl`.

The field names and accepted values must match the current implementation.

    curl -X POST http://127.0.0.1:8080/predict \
      -H "Content-Type: application/json" \
      -d '{
        "pet": {
          "species": "Cat",
          "breed": "Persian",
          "age": 2,
          "size": "Small",
          "energyLevel": "Moderate",
          "healthStatus": "Healthy"
        },
        "adopter": {
          "activityLevel": 4,
          "careHoursNumeric": 3,
          "housingTypeEncoded": 2,
          "hasChildrenUnder12": false,
          "hasOtherPets": true,
          "experienceLevel": 2,
          "groomingTolerance": 3,
          "age": 35
        }
      }'

A successful response should follow the schema defined by the Flask service. If the endpoint returns a compatibility score and SHAP factors, verify that the score is valid and that the explanation is present.

An HTTP success response does not establish the model's predictive accuracy.

### 2. Manual Functional Testing

| Test | Action | Expected Result |
|---|---|---|
| Registration | Create a user account | Account is created or a clear validation error is displayed |
| Login | Sign in with valid credentials | User is authenticated |
| Role permissions | Attempt an action restricted to another role | Unauthorized action is denied |
| Pet listings | Create or view a pet listing | Listing data is displayed and stored correctly |
| Questionnaire | Submit adopter lifestyle information | Validated profile data is processed |
| Recommendations | Request compatible pets | The configured scoring or prediction path returns results |
| Explanations | View a recommendation explanation | Available contributing factors are displayed |
| Applications | Submit an adoption application | Application is recorded |
| Shelter review | Review an application with an authorized account | The permitted review action is completed |
| Image validation | Upload an unsupported file type | Upload is rejected with a clear message |
| Image storage | Upload an allowed pet image | Image is stored and retrievable by an authorized user |
| Scheduling | Test interview scheduling | Scheduling works when required credentials and APIs are configured |

### 3. Record Test Results

Maintain a test record containing:

- Test case ID and objective
- Preconditions and test data
- Steps performed
- Expected result
- Actual result
- Pass/fail status
- Evidence, such as screenshots, logs, or automated test output
- Related GitHub Issue, where applicable

Only report tests as passed after they have been executed.

## Git Workflow and Project Management

### Branching Strategy

The following strategy can be used to organize development:

| Branch | Purpose |
|---|---|
| `main` | Stable, reviewed code |
| `sprint-2-development` | Sprint II development and integration, if maintained |
| `feat/<short-description>` | Feature development |
| `fix/<short-description>` | Bug fixes |
| `docs/<short-description>` | Documentation changes |

Create branches for specific tasks, keep changes focused, and merge reviewed work into the intended target branch.

Example:

    git switch main
    git pull origin main
    git switch -c feat/recommendation-explanations

After implementing and testing the change:

    git add .
    git commit -m "feat: add recommendation explanations"
    git push -u origin feat/recommendation-explanations

When pull requests are used, include a description of the change, the related issue, the tests performed, and any known limitations.

### Meaningful Commits

Use clear commit messages that describe the work actually completed. Conventional Commit prefixes help organize the history.

| Prefix | Purpose |
|---|---|
| `feat:` | Introduce a feature |
| `fix:` | Correct a defect |
| `docs:` | Update documentation |
| `test:` | Add or improve tests |
| `refactor:` | Restructure code without intentionally changing behavior |
| `chore:` | Maintain dependencies or development configuration |

Examples:

    feat: add SHAP compatibility explanations
    fix: validate unsupported pet image uploads
    test: cover compatibility prediction endpoint
    docs: document Firebase emulator setup
    chore: update Python dependencies

Use commit messages that accurately reflect the associated changes.

### Issues and Task Tracking

Use GitHub Issues or another traceable task record to document features, bugs, testing tasks, and improvements.

Each task should include:

- A clear title and description
- Acceptance criteria or reproduction steps
- Appropriate labels
- A milestone or project-board status, if used
- Links to relevant commits and pull requests

Reference actual issue numbers in commits and pull requests when available.

### Releases and Version Tags

Use Git tags to identify stable milestones after implementation and testing.

Example:

    git tag -a v1.0.0 -m "Adoptly v1.0.0"
    git push origin v1.0.0

Create release tags only for milestones that have actually been completed. Document ongoing work as development rather than presenting it as a completed release.

## Troubleshooting

### Vite Is Not Recognized

From the `frontend/` directory, run:

    npm install
    npm run dev

Check that Vite is declared in the project's dependencies or development dependencies.

### Flask Cannot Load the Model

Confirm that the model artifacts, feature definitions, preprocessing files, and required data files exist in the configured locations. Activate the correct virtual environment and install the dependencies from `requirements.txt`.

### Firebase Requests Fail

Check the Firebase configuration, selected project, emulator status, security rules, and frontend emulator settings.

### CORS Errors Occur

Verify the Flask or Cloud Functions CORS configuration and confirm that the frontend is calling the correct endpoint. Avoid allowing all origins in production without an appropriate security assessment.

### Recommendations Do Not Appear

Check the selected ML mode, endpoint URL, request schema, response schema, and browser/network logs. If mock scoring is enabled, the displayed results may not come from the trained model.

### Google Calendar or Meet Integration Fails

Confirm that the API is enabled, credentials are configured securely, the executing identity has the necessary permissions, and the implementation uses the appropriate authentication method.

## Limitations

- Compatibility scores depend on the training data, feature preparation, and scoring methodology.
- Synthetic adopter profiles or rubric-generated labels, if used, do not independently demonstrate real-world adoption success.
- SHAP explains how model features contribute to a prediction; it does not prove that a recommendation is correct.
- Cloud integrations require appropriate configuration, credentials, and permissions.
- The system supports shelter decision-making rather than replacing responsible assessment.

## License and Access Statement

Adoptly was developed as an academic project for the Bachelor of Science in Informatics and Computer Science programme at Strathmore University, Nairobi, Kenya.

**License:** The intended license is the MIT License. To apply it, include a root-level `LICENSE` file containing the MIT License text and the appropriate copyright holder and year. The MIT License does not restrict use to educational or non-commercial purposes.

**Access and security:** Repository access depends on its GitHub visibility and access permissions. API keys, service-account files, private credentials, and production secrets must not be committed. Anyone running the application locally must provide the required credentials and configuration for the services they intend to use.
