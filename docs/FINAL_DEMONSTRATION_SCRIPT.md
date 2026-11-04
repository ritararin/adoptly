# Adoptly: Final Sprint III Viva & Demonstration Script

**Project Title:** Adoptly — Explainable Pet-Adopter Compatibility Matching  
**Audience:** Project Supervisor, Assessment Panel & Examiners  
**Duration:** 10 – 12 Minutes (Walkthrough + Q&A)  
**Academic Institution:** Strathmore University  

---

## 1. Presentation Structure Overview

| Segment | Allocated Time | Core Focus |
|---|---|---|
| **1. Problem & Architecture** | 2 Minutes | The pet-adopter mismatch problem, black-box limitations, and Adoptly's 4-tier architecture. |
| **2. Adopter Journey** | 3 Minutes | Lifestyle questionnaire, compatibility matching, and TreeSHAP explainability in action. |
| **3. Shelter Review & Google Meet** | 3 Minutes | Application dossier inspection, private notes, 1-click live Google Meet scheduling, and calendar sync. |
| **4. Ethical Guardrails & Edge Cases** | 2 Minutes | Zero-tolerance child-safety hard rule and species preference override banner. |
| **5. Empirical Evaluation & Q&A** | 2 Minutes | $R^2 = 0.9497$, latency benchmarks, limitations, and defense questions. |

---

## 2. Test Personas & Demonstration Accounts

| Persona | Role | Credentials | Demonstration Purpose |
|---|---|---|---|
| **Sarah (Adopter)** | Prospective Pet Adopter | Any personal email (e.g. `sarah.adopter@gmail.com`) | Demonstrates questionnaire completion, viewing ML match scores, exploring SHAP factor explanations, and applying. |
| **Rita (Shelter Manager)** | Shelter Operations Coordinator | `ritararin@gmail.com` *(or any `@testshelter.com` email)* | Demonstrates pet listing creation, application dossier review, automated Google Meet scheduling, and adoption finalization. |

---

## 3. Step-by-Step Live Demonstration Walkthrough

### Part 1: Problem Context & High-Level Architecture (2 Mins)
- **Speaker Script:**
  > *"Good morning, members of the evaluation panel. Millions of companion animals enter shelters each year, and a significant percentage of failed adoptions stem from behavioral and lifestyle mismatches that were preventable at the point of adoption.*
  >
  > *Traditional platforms rely on static keyword searches, while conventional machine learning recommenders operate as black boxes, telling an adopter that a pet is an '85% match' without explaining why. Adoptly solves this by combining Random Forest regression with local TreeSHAP explanations, zero-tolerance child safety overrides, and automated virtual verification via Google Meet."*
- **Action:** Show high-level system diagram from Chapter 5.

---

### Part 2: The Adopter Experience & Explainable AI (3 Mins)
1. **Sign In & Guided Questionnaire:**
   - Navigate to `http://localhost:5173/login`.
   - Log in as the Adopter persona.
   - Navigate to **Lifestyle Questionnaire** (`/questionnaire`).
   - Fill in representative attributes:
     - *Housing:* Apartment (Medium Living Space)
     - *Activity Level:* Moderate (Rating 3/5)
     - *Daily Available Care Time:* 4 Hours
     - *Experience Level:* Intermediate (Previous pet owner)
     - *Household:* Adults only (No children under 12)
   - Click **"Save Profile & Discover Matches"**.
2. **Compatibility Dashboard & Local Explanations:**
   - Navigate to **Recommended Matches** (`/matches`).
   - Point out the Top Recommended Pet Card:
     - Notice the continuous compatibility gauge (e.g. `88% Highly Compatible`).
     - Point out the summary badge: *"Balanced companion matching your apartment space and 4h daily care capacity."*
   - Click on the pet to open **Pet Detail & Feature Breakdown** (`/pets/:id`).
   - **Highlight the Feature Compatibility Breakdown (TreeSHAP):**
     - Show the bidirectional factor bars:
       - 🟢 **Raises score (+5.2):** *"Moderate activity level aligns with pet's moderate energy."*
       - 🟢 **Raises score (+3.8):** *"4h daily care matches the pet's social requirements."*
       - 🔴 **Lowers score (-2.1):** *"High shedding requires regular grooming."*
   - **Speaker Script:**
     > *"Notice that the adopter is not merely presented with an arbitrary percentage. Every score is fully decomposed into positive and negative contributing factors computed via TreeSHAP. This transparency empowers the adopter to make an honest, self-reflective decision before applying."*
3. **Application Submission:**
   - Click **"Apply to Adopt [Pet Name]"**.
   - Confirm application submission. The status immediately updates to `Pending Review`.

---

### Part 3: The Shelter Review Dossier & Automated Google Meet Scheduling (3 Mins)
1. **Switch to Shelter Coordinator Role:**
   - Sign in as `ritararin@gmail.com` (Shelter Coordinator).
   - Navigate to **Applications** (`/shelter-applications`).
2. **Inspect Application Dossier:**
   - Open Sarah's newly submitted application (`/applications/:id/review`).
   - **Point out the unified dossier:**
     - Compatibility gauge side-by-side with Sarah's self-reported lifestyle attributes.
     - SHAP factor breakdown visible to shelter staff.
     - Private internal notes area for staff comments.
3. **1-Click Live Google Meet Scheduling:**
   - In the **Schedule Virtual Verification** panel, select a Date (e.g. tomorrow) and Time (e.g. 10:00 AM).
   - Click **"Approve & Schedule Interview"**.
   - **Show the outcome:**
     - The backend instantly calls Google Calendar API v3 with `conferenceSolutionKey: { type: "hangoutsMeet" }`.
     - An authentic Google Meet room is provisioned (e.g. `meet.google.com/nyw-rsju-dfx`).
     - The UI transitions to `Interview Scheduled`.
     - Click **"Join Google Meet"** to demonstrate that it opens a real, active Google Meet room (no "No such meeting" error).
     - Demonstrate the **"Export .ics"** button (downloads standard iCalendar file) and **"Google Cal"** button (pre-populates Google Calendar event with attendee guest invites).

---

### Part 4: Ethical Guardrails & Edge-Case Demonstration (2 Mins)
1. **Zero-Tolerance Child Safety Hard Override:**
   - Re-open the Questionnaire as an Adopter and check **"Children (<12)"** under Household Composition.
   - Save the profile and return to the Match Dashboard.
   - Point out that any pet with `child_friendly <= 2` is unconditionally excluded from the recommendations pool and placed in the **"Not Recommended for Young Children"** section with an explicit warning banner:
     > *"Excluded: Rated 1-2 for child-friendliness, which is not suitable for a household with children under 12."*
   - **Speaker Script:**
     > *"This demonstrates our ethical AI policy. Machine learning models should never have unconstrained authority over child safety. Even if a pet scores high on size or activity match, the deterministic safety rule strictly overrides the model to prevent dangerous placements."*
2. **Species Preference Filtering with Cross-Species Explanation:**
   - Select the **"🐕 Dogs Only"** filter button on the matches dashboard.
   - Show how the platform filters for dogs while displaying an informative banner if a cat has a higher compatibility percentage:
     > *"Exploration Insight: Whiskers (Cat) has a 94% match based on your quiet living space, but is filtered because your preference is set to Dogs."*

---

### Part 5: Empirical Evaluation Highlights & Conclusion (2 Mins)
- Summarize key quantitative evaluation outcomes:
  - **$R^2$ Score:** `0.9497` on held-out test data (exceeding the $0.90$ target).
  - **Mean Absolute Error:** `1.30` points on a 100-point scale.
  - **Single Inference Latency:** `68.9 ms` (p50); Batch of 20 pets: `77.8 ms` (p50).
  - **Automated Tests:** `24/24` automated pytest tests passing.
  - **Production Build:** Clean React/Vite production build verified.

---

## 4. Anticipated Viva Defense Questions & Answers

### Q1: Why use Random Forest Regression instead of Deep Learning or Collaborative Filtering?
> **Answer:** *"Collaborative filtering suffers from severe cold-start problems in shelter environments because each shelter pet is a unique individual rather than a standardized product, and adopter interactions are sparse. Deep neural networks act as opaque black boxes and require millions of training samples. Random Forest regression natively handles mixed tabular data (categorical and numeric features), resists overfitting through ensemble bagging, and integrates seamlessly with TreeSHAP for exact polynomial-time Shapley value computation."*

### Q2: Why compute SHAP values instead of using global feature importances?
> **Answer:** *"Global feature importances only tell you which attributes the model prioritizes across the entire population. They cannot explain an individual prediction. An adopter doesn't care that 'activity level' is important globally; they need to know whether their specific rating of 3/5 raised or lowered the score for Buddy the Golden Retriever. TreeSHAP provides instance-level local attributions satisfying mathematical additivity."*

### Q3: Why decouple the Google Meet integration to the Flask backend instead of Firebase Cloud Functions?
> **Answer:** *"On the free Firebase Spark tier, Google Cloud restricts outbound internet calls from Cloud Functions, blocking the Google OAuth 2.0 token refresh exchange without a paid Blaze credit card account. By routing meeting creation through our Flask backend (`/schedule-interview`), the system remains 100% functional, secure, and reproducible on any computer or free cloud tier (such as Render) without imposing financial or licensing barriers on assessors."*

### Q4: What happens if the machine learning backend goes offline?
> **Answer:** *"Adoptly implements graceful degradation. If the Flask API is unreachable, the frontend intercepts the failure and falls back to a deterministic client-side rubric (`scorer.js`). The user continues to receive functional compatibility estimates and advisory banners without application crashes."*

