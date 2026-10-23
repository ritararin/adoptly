ADOPTLY FRONTEND (React + Vite + Tailwind + Firebase)

SETUP
1. npm install
2. Copy .env.example to .env and fill in your Firebase web-app config.
3. In the Firebase console enable Authentication (Email/Password) and Firestore.
4. Paste firestore.rules into Firestore rules (tighten before deployment).
5. npm run dev

ROLES (FR-01)
Role is set at registration from the email domain: domains in VITE_SHELTER_DOMAINS become Shelter Staff,
emails in VITE_ADMIN_EMAILS become Admin, everyone else is an Adopter. Note: client-side role assignment is
for the prototype; for production assign roles in a Cloud Function / custom claims.

TRY IT
Register a shelter account (use a domain from VITE_SHELTER_DOMAINS) -> add a few pets.
Register an adopter -> complete the profile -> see ranked matches, breakdown, apply.
Log in as shelter -> Review Tasks -> schedule interview / reject / confirm adoption.

CONNECTING THE ML SERVICE
VITE_USE_MOCK_ML=true scores in the browser with src/lib/scorer.js (rubric-based, same shape as real output).
To switch to your Random Forest + TreeSHAP service: set VITE_USE_MOCK_ML=false and VITE_ML_ENDPOINT to your
Cloud Function. It receives { adopterId, profile, petIds } and must return an array of
{ petId, score (0-1), contributions: [{ feature, label, impact, detail }], summary }.
PetDetail.jsx currently scores a single pet with scorer.js; swap that call for your endpoint too (marked TODO).

STRUCTURE
src/lib        firebase init, Firestore API layer, mock scorer, option lists
src/context    AuthContext (register/login/role)
src/components Layout, ScoreGauge, MatchBreakdown (SHAP bars), PetCard, Choice, StatusBadge
src/pages      Login, Register, Questionnaire, Matches, PetDetail, MyApplications,
               ShelterListings, ShelterApplications, ApplicationReview, Admin
