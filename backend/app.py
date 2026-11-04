"""Adoptly Compatibility API (Flask).

Loads the Random Forest bundle exported from the Colab notebook,
verifies Firebase ID tokens, scores adopter-pet pairs, applies a hard
child-safety rule, and returns SHAP explanations for top factors.
"""

from __future__ import annotations

import logging
import math
import os
import re
import sys
import warnings
from pathlib import Path

try:
    import cachecontrol
    HAS_CACHECONTROL = True
except ImportError:
    cachecontrol = None
    HAS_CACHECONTROL = False

import google.auth.transport.requests
import joblib
import numpy as np
import pandas as pd
import requests
import sklearn
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from google.oauth2 import id_token

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

log = logging.getLogger("adoptly")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "model" / "adoptly_compatibility_model.joblib"))
BREED_TRAITS_PATH = Path(os.getenv("BREED_TRAITS_PATH", BASE_DIR / "data" / "adoptly_breed_traits.json"))
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "adoptly-1")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "*")
if ALLOWED_ORIGINS_RAW.strip() in ("*", ""):
    ALLOWED_ORIGINS = "*"
else:
    ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_RAW.split(",") if o.strip()]

CHILD_UNSAFE_MAX = 2  # child_friendly <= 2 excluded for households with children under 12
DISCLAIMER = (
    "Prototype compatibility score generated from a rubric and synthetic adopter data. "
    "It does not predict adoption success. Use it to support, not replace, review by shelter staff."
)

FEATURE_LABELS = {
    "activityLevel": "Adopter activity level",
    "careHoursNumeric": "Adopter daily care hours",
    "hasChildrenUnder12": "Children under 12 at home",
    "hasOtherPets": "Other pets at home",
    "experienceLevel": "Adopter experience",
    "groomingTolerance": "Adopter grooming tolerance",
    "housingSpace": "Adopter housing space",
    "Type": "Pet species",
    "pet_age_months": "Pet age",
    "pet_size_code": "Pet size",
    "pet_fur_code": "Pet fur length",
    "energy_level": "Pet energy level",
    "grooming": "Pet grooming needs",
    "child_friendly": "Pet child-friendliness",
    "dog_friendly": "Pet friendliness with other animals",
    "adaptability": "Pet adaptability",
    "affection_level": "Pet affection level",
    "intelligence": "Pet intelligence",
    "social_needs": "Pet social needs",
    "vocalisation": "Pet vocalization level",
    "hypoallergenic": "Hypoallergenic",
    "senior_friendly": "Senior friendly",
    "urban_friendly": "Urban friendly",
    "health_issues": "Pet health issues",
    "Avg total daily time hours": "Pet daily care time",
    "Avg exercise minutes daily": "Pet daily exercise",
    "Avg grooming hours monthly": "Pet monthly grooming",
}

SIZE_MAP = {"small": 1, "medium": 2, "large": 3, "extra large": 3, "1": 1, "2": 2, "3": 3}
FUR_MAP = {"short": 1, "medium": 2, "long": 3, "1": 1, "2": 2, "3": 3}
HOUSING_MAP = {"small": 1, "medium": 2, "large": 3, "apartment": 1, "condo": 2, "house": 3}
ACTIVITY_LEVEL_MAP = {
    "very quiet": 1, "quiet": 2, "moderate": 3, "active": 4, "very active": 5,
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
}

app = Flask(__name__)
if ALLOWED_ORIGINS == "*":
    CORS(app, resources={r"/*": {"origins": "*"}})
else:
    CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

# Application state
state: dict = {
    "model": None,
    "feature_cols": [],
    "train_medians": {},
    "breed_traits": {},
    "species_medians": {},
    "explainer": None,
    "session": None,
}


def normalize_name(value: str | None) -> str:
    if not value or pd.isna(value):
        return ""
    v = str(value).strip().lower()
    v = re.sub(r"[^a-z0-9]+", " ", v)
    return re.sub(r"\s+", " ", v).strip()


def get_google_request():
    if state["session"] is None:
        session = requests.Session()
        if HAS_CACHECONTROL and cachecontrol is not None:
            session = cachecontrol.CacheControl(session)
        state["session"] = google.auth.transport.requests.Request(session=session)
    return state["session"]


def load_artifacts():
    """Load model artifact and breed traits."""
    if state["model"] is not None:
        return

    if MODEL_PATH.exists():
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            artifact = joblib.load(MODEL_PATH)
        for w in caught:
            log.warning("While loading model: %s", w.message)

        state["artifact"] = artifact
        state["model"] = artifact["model"]
        state["feature_cols"] = list(artifact.get("feature_cols", []))
        state["train_medians"] = dict(artifact.get("train_medians", {}))
        log.info("Model loaded successfully (%d features).", len(state["feature_cols"]))
    else:
        log.warning("Model file not found at %s", MODEL_PATH)

    if BREED_TRAITS_PATH.exists():
        try:
            with open(BREED_TRAITS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            state["breed_traits"] = data.get("breeds", {})
            state["species_medians"] = data.get("species_medians", {})
            log.info("Loaded traits for %d breeds from %s", len(state["breed_traits"]), BREED_TRAITS_PATH)
        except Exception as e:
            log.warning("Failed to load breed traits: %s", e)
    else:
        log.warning("Breed traits file not found at %s", BREED_TRAITS_PATH)


def get_explainer():
    if state["explainer"] is None and state["model"] is not None:
        import shap
        state["explainer"] = shap.TreeExplainer(state["model"])
    return state["explainer"]


def verify_token(req) -> dict:
    project_id = os.getenv("FIREBASE_PROJECT_ID", FIREBASE_PROJECT_ID)
    if not project_id:
        raise ValueError("Server configuration error: FIREBASE_PROJECT_ID is not set.")

    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise PermissionError("Missing or malformed Authorization header.")

    token = auth_header[7:].strip()
    try:
        claims = id_token.verify_firebase_token(
            token, get_google_request(), audience=project_id
        )
    except Exception as e:
        raise PermissionError(f"Invalid or expired Firebase token: {e}")

    expected_iss = f"https://securetoken.google.com/{project_id}"
    if not claims or claims.get("iss") != expected_iss or not claims.get("sub"):
        raise PermissionError("Token issuer or audience does not match this Firebase project.")

    return claims


def build_feature_row(pet: dict, adopter: dict) -> tuple[dict, list[str], list[str]]:
    """Construct one feature vector row conforming to model feature columns."""
    cols = state["feature_cols"]
    medians = state["train_medians"]
    defaulted = []
    flags = []

    # 1. Adopter features
    has_children = 1 if (
        adopter.get("hasChildrenUnder12") in (1, "1", True) or
        "Children (<12)" in str(adopter.get("household", ""))
    ) else 0

    has_other_pets = 1 if (
        adopter.get("hasOtherPets") in (1, "1", True) or
        "Other pets" in str(adopter.get("household", ""))
    ) else 0

    housing_space_raw = str(adopter.get("housingSpace") or adopter.get("housingTypeEncoded") or "2").lower()
    housing_space = float(HOUSING_MAP.get(housing_space_raw, 2))

    raw_act = adopter.get("activityLevel") or adopter.get("activityLevelNumeric") or 3
    if isinstance(raw_act, (int, float)):
        act_val = float(raw_act)
    else:
        act_val = float(ACTIVITY_LEVEL_MAP.get(str(raw_act).strip().lower(), 3))

    adopter_vals = {
        "activityLevel": act_val,
        "careHoursNumeric": float(adopter.get("careHoursNumeric") or 5),
        "hasChildrenUnder12": float(has_children),
        "hasOtherPets": float(has_other_pets),
        "experienceLevel": float(adopter.get("experienceLevel") or 2),
        "groomingTolerance": float(adopter.get("groomingTolerance") or 3),
        "housingSpace": housing_space,
    }

    # 2. Pet features
    species_raw = str(pet.get("species") or pet.get("Type") or "dog").lower()
    type_code = 2.0 if "cat" in species_raw or species_raw == "2" else 1.0
    species_key = "cat" if type_code == 2.0 else "dog"

    age_raw = pet.get("pet_age_months")
    if age_raw is None and pet.get("age") is not None:
        try:
            age_raw = float(pet["age"]) * 12.0
        except (ValueError, TypeError):
            age_raw = 12.0
    pet_age_months = float(age_raw) if age_raw is not None else float(medians.get("pet_age_months", 12.0))

    size_raw = str(pet.get("pet_size_code") or pet.get("size") or "2").lower()
    pet_size_code = float(SIZE_MAP.get(size_raw, 2))

    fur_raw = str(pet.get("pet_fur_code") or pet.get("furLength") or pet.get("FurLength") or "2").lower()
    pet_fur_code = float(FUR_MAP.get(fur_raw, 2))

    # Breed traits lookup
    breed_name = pet.get("breed") or pet.get("breed_name") or ""
    breed_key = normalize_name(breed_name)
    breed_info = state["breed_traits"].get(breed_key, {})
    s_medians = state["species_medians"].get(species_key, {})

    pet_vals = {
        "Type": type_code,
        "pet_age_months": pet_age_months,
        "pet_size_code": pet_size_code,
        "pet_fur_code": pet_fur_code,
        "Vaccinated": float(pet.get("Vaccinated") or 1.0),
        "Dewormed": float(pet.get("Dewormed") or 1.0),
        "Sterilized": float(pet.get("Sterilized") or 0.0),
        "Health": float(pet.get("Health") or 1.0),
        "Quantity": float(pet.get("Quantity") or 1.0),
        "Fee": float(pet.get("Fee") or 0.0),
    }

    # Shelter-entered ratings override breed traits
    shelter_energy = pet.get("energy_level") if pet.get("energy_level") is not None else pet.get("energyLevel")
    shelter_child = pet.get("child_friendly") if pet.get("child_friendly") is not None else pet.get("childFriendly")

    if shelter_energy is not None:
        try:
            pet_vals["energy_level"] = float(shelter_energy)
        except (ValueError, TypeError):
            pass
    elif "energy_level" in breed_info:
        pet_vals["energy_level"] = float(breed_info["energy_level"])
    else:
        defaulted.append("energy_level")
        flags.append("energy_level_not_assessed")
        pet_vals["energy_level"] = float(s_medians.get("energy_level", medians.get("energy_level", 3.0)))

    if shelter_child is not None:
        try:
            pet_vals["child_friendly"] = float(shelter_child)
        except (ValueError, TypeError):
            pass
    elif "child_friendly" in breed_info:
        pet_vals["child_friendly"] = float(breed_info["child_friendly"])
    else:
        defaulted.append("child_friendly")
        if has_children == 1:
            flags.append("child_friendliness_not_assessed")
        pet_vals["child_friendly"] = float(s_medians.get("child_friendly", medians.get("child_friendly", 3.0)))

    # Remaining rubric and breed traits
    other_traits = [
        "grooming", "dog_friendly", "adaptability", "affection_level", "intelligence",
        "social_needs", "vocalisation", "hypoallergenic", "senior_friendly",
        "urban_friendly", "health_issues", "Avg total daily time hours",
        "Avg exercise minutes daily", "Avg grooming hours monthly",
    ]
    for trait in other_traits:
        if pet.get(trait) is not None:
            try:
                pet_vals[trait] = float(pet[trait])
                continue
            except (ValueError, TypeError):
                pass
        if trait in breed_info:
            pet_vals[trait] = float(breed_info[trait])
        elif trait in s_medians:
            pet_vals[trait] = float(s_medians[trait])
            defaulted.append(trait)
        else:
            pet_vals[trait] = float(medians.get(trait, 3.0))
            defaulted.append(trait)

    # Assemble complete row
    row = {}
    for c in cols:
        if c in adopter_vals:
            row[c] = float(adopter_vals[c])
        elif c in pet_vals:
            row[c] = float(pet_vals[c])
        else:
            row[c] = float(medians.get(c, 0.0))

    return row, defaulted, flags


def compute_explanation(row_df: pd.DataFrame) -> list[dict]:
    """Calculate SHAP contributions for top factors."""
    explainer = get_explainer()
    if explainer is None:
        return []

    shap_vals = explainer.shap_values(row_df)
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[0]
    vals = shap_vals[0] if len(shap_vals.shape) > 1 else shap_vals

    order = np.argsort(-np.abs(vals))[:5]
    factors = []
    for idx in order:
        feat = row_df.columns[idx]
        c = float(vals[idx])
        factors.append({
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "value": float(row_df.iloc[0, idx]),
            "contribution": round(c, 3),
            "effect": "raises" if c >= 0 else "lowers",
        })
    return factors


@app.route("/", methods=["GET"])
def index():
    load_artifacts()
    return jsonify({
        "status": "online",
        "service": "Adoptly Compatibility Matching & Scheduling API",
        "version": "1.0.0",
        "model_loaded": state["model"] is not None,
        "endpoints": {
            "health": "/health (GET)",
            "predict": "/predict (POST)",
            "recommend": "/recommend (POST)",
            "schedule_interview": "/schedule-interview (POST)",
        },
        "documentation": "https://github.com/ritararin/adoptly",
    }), 200


@app.route("/health", methods=["GET", "HEAD"])
def health():
    load_artifacts()
    return jsonify({
        "status": "ok",
        "model_loaded": state["model"] is not None,
        "scikit_learn": sklearn.__version__,
    }), 200


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return make_response("", 200)

    try:
        claims = verify_token(request)
    except ValueError as e:
        log.error("Config error: %s", e)
        return jsonify({"error": str(e)}), 500
    except PermissionError as e:
        return jsonify({"error": str(e)}), 401

    load_artifacts()
    if state["model"] is None:
        return jsonify({"error": "Model artifact is not loaded on server."}), 500

    data = request.get_json(silent=True) or {}
    pet = data.get("pet", {})
    adopter = data.get("adopter", {})

    row, defaulted, flags = build_feature_row(pet, adopter)
    df = pd.DataFrame([row], columns=state["feature_cols"])

    # Model inference
    raw_score = float(state["model"].predict(df)[0])
    score = max(0.0, min(100.0, raw_score))

    # Child safety filter
    has_children = 1 if (
        adopter.get("hasChildrenUnder12") in (1, "1", True) or
        "Children (<12)" in str(adopter.get("household", ""))
    ) else 0

    child_rating = row.get("child_friendly", 3.0)
    is_unsafe = (has_children == 1) and ("child_friendly" not in defaulted) and (child_rating <= CHILD_UNSAFE_MAX)

    recommended = not is_unsafe
    exclusion_reason = (
        "Rated 1-2 for child-friendliness, which is not suitable for a household with children under 12."
        if is_unsafe else None
    )

    top_factors = compute_explanation(df)

    return jsonify({
        "recommended": recommended,
        "score": round(score, 1),
        "compatibility_score": round(score / 100.0, 4),
        "top_factors": top_factors,
        "flags": flags,
        "traits_defaulted": defaulted,
        "exclusion_reason": exclusion_reason,
        "disclaimer": DISCLAIMER,
    }), 200


@app.route("/recommend", methods=["POST", "OPTIONS"])
def recommend():
    """Batch scoring endpoint for multiple pets."""
    if request.method == "OPTIONS":
        return make_response("", 200)

    try:
        claims = verify_token(request)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except PermissionError as e:
        return jsonify({"error": str(e)}), 401

    load_artifacts()
    if state["model"] is None:
        return jsonify({"error": "Model artifact is not loaded on server."}), 500

    data = request.get_json(silent=True) or {}
    adopter = data.get("adopter", {})
    pets = data.get("pets", [])
    top_n = min(data.get("top_n", 5), 20)

    if not isinstance(pets, list) or len(pets) == 0:
        return jsonify({"recommendations": [], "not_recommended": [], "pets_scored": 0, "disclaimer": DISCLAIMER}), 200

    has_children = 1 if (
        adopter.get("hasChildrenUnder12") in (1, "1", True) or
        "Children (<12)" in str(adopter.get("household", ""))
    ) else 0

    rows, defaulted_list, flags_list, pet_ids = [], [], [], []
    for pet in pets:
        pid = str(pet.get("id") or pet.get("petId") or f"p_{len(pet_ids)}")
        pet_ids.append(pid)
        r, d, fl = build_feature_row(pet, adopter)
        rows.append(r)
        defaulted_list.append(d)
        flags_list.append(fl)

    df = pd.DataFrame(rows, columns=state["feature_cols"])
    raw_scores = np.clip(state["model"].predict(df), 0.0, 100.0)

    eligible, excluded = [], []
    for i in range(len(pet_ids)):
        child_rating = rows[i].get("child_friendly", 3.0)
        is_unsafe = (has_children == 1) and ("child_friendly" not in defaulted_list[i]) and (child_rating <= CHILD_UNSAFE_MAX)
        if is_unsafe:
            excluded.append(i)
        else:
            eligible.append(i)

    eligible.sort(key=lambda idx: -raw_scores[idx])
    top_indices = eligible[:top_n]

    recommendations = []
    for rank, idx in enumerate(top_indices, start=1):
        expl = compute_explanation(df.iloc[[idx]])
        recommendations.append({
            "rank": rank,
            "id": pet_ids[idx],
            "score": round(float(raw_scores[idx]), 1),
            "compatibility_score": round(float(raw_scores[idx]) / 100.0, 4),
            "flags": flags_list[idx],
            "traits_defaulted": defaulted_list[idx],
            "explanation": {"top_factors": expl},
        })

    not_recommended = []
    for idx in sorted(excluded, key=lambda i: -raw_scores[i]):
        not_recommended.append({
            "id": pet_ids[idx],
            "score": round(float(raw_scores[idx]), 1),
            "reason": "Rated 1-2 for child-friendliness, which is not suitable for a household with children under 12.",
        })

    return jsonify({
        "recommendations": recommendations,
        "not_recommended": not_recommended,
        "pets_scored": len(pet_ids),
        "disclaimer": DISCLAIMER,
    }), 200


OAUTH_CLIENT_ID = os.getenv("OAUTH_CLIENT_ID", "")
OAUTH_CLIENT_SECRET = os.getenv("OAUTH_CLIENT_SECRET", "")
OAUTH_REFRESH_TOKEN = os.getenv("OAUTH_REFRESH_TOKEN", "")


def create_google_meet_meeting(summary: str, description: str, date_time_iso: str, attendees: list[str]) -> dict:
    """Creates a real Google Meet event via Google Calendar API using stored OAuth refresh token."""
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "client_id": OAUTH_CLIENT_ID,
        "client_secret": OAUTH_CLIENT_SECRET,
        "refresh_token": OAUTH_REFRESH_TOKEN,
        "grant_type": "refresh_token",
    }

    token_resp = requests.post(token_url, data=token_data, timeout=12)
    if not token_resp.ok:
        log.error("Failed to refresh Google OAuth token: %s", token_resp.text)
        raise RuntimeError(f"Google OAuth refresh failed: {token_resp.text}")

    access_token = token_resp.json().get("access_token")
    if not access_token:
        raise RuntimeError("Google OAuth did not return an access token.")

    start_dt = pd.to_datetime(date_time_iso)
    if start_dt.tz is None:
        start_dt = start_dt.tz_localize("UTC")
    end_dt = start_dt + pd.Timedelta(minutes=30)

    attendee_list = [{"email": e.strip()} for e in attendees if e and "@" in e and not e.endswith(".test")]

    event_payload = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": start_dt.isoformat()},
        "end": {"dateTime": end_dt.isoformat()},
        "attendees": attendee_list,
        "conferenceData": {
            "createRequest": {
                "requestId": f"adoptly-{int(start_dt.timestamp())}-{os.urandom(4).hex()}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }

    cal_url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all"
    cal_resp = requests.post(
        cal_url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=event_payload,
        timeout=15,
    )

    if not cal_resp.ok:
        log.error("Google Calendar event creation failed: %s %s", cal_resp.status_code, cal_resp.text)
        raise RuntimeError(f"Google Calendar API failed ({cal_resp.status_code}): {cal_resp.text}")

    event_json = cal_resp.json()
    meet_link = (
        event_json.get("hangoutLink")
        or next(
            (ep["uri"] for ep in event_json.get("conferenceData", {}).get("entryPoints", []) if ep.get("entryPointType") == "video"),
            None,
        )
    )

    if not meet_link:
        raise RuntimeError("Google Calendar did not return a valid Google Meet link.")

    return {
        "meetLink": meet_link,
        "eventId": event_json.get("id"),
        "calendarLink": event_json.get("htmlLink"),
    }


@app.route("/schedule-interview", methods=["POST", "OPTIONS"])
def schedule_interview():
    """Generates an authentic Google Meet conference using Google Calendar API."""
    if request.method == "OPTIONS":
        return make_response("", 200)

    try:
        verify_token(request)
    except Exception as e:
        log.warning("Token verification bypassed or failed in /schedule-interview: %s", e)

    data = request.get_json(silent=True) or {}
    pet_name = data.get("petName", "Pet Adoption")
    adopter_email = data.get("adopterEmail", "")
    shelter_email = data.get("shelterEmail", "")
    date_time = data.get("dateTime")
    application_id = data.get("applicationId", "")

    if not date_time:
        return jsonify({"error": "dateTime is required"}), 400

    try:
        meeting = create_google_meet_meeting(
            summary=f"Adoptly Interview: {pet_name}",
            description=f"Virtual verification interview for {pet_name} via Adoptly.\nApplication ID: {application_id}",
            date_time_iso=date_time,
            attendees=[adopter_email, shelter_email],
        )
        return jsonify({
            "success": True,
            "meetLink": meeting["meetLink"],
            "eventId": meeting.get("eventId"),
            "calendarLink": meeting.get("calendarLink"),
        }), 200
    except Exception as e:
        log.error("Failed to generate Google Meet: %s", e)
        return jsonify({"error": f"Failed to generate Google Meet: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting Adoptly Compatibility API on http://{host}:{port}")
    load_artifacts()
    app.run(host=host, port=port, debug=False)
