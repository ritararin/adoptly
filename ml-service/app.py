from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import shap

app = Flask(__name__)

print("Loading model artifacts...")
MODEL = joblib.load("model/random_forest_compatibility.pkl")
FEATURE_COLS = joblib.load("model/feature_cols_compatibility.pkl")
TRAIN_MEDIANS = joblib.load("model/train_medians_compatibility.pkl")

print("Loading breed dataset...")
BREEDS = pd.read_excel("data/pet_breeds.xlsx").set_index("breed_name")

print("Building SHAP explainer...")
EXPLAINER = shap.TreeExplainer(MODEL)
print("Ready.")

# Mappings for Firestore string values
SIZE_MAP = {"Small": 1, "Medium": 2, "Large": 3, "Extra Large": 4}
HEALTH_MAP = {"Healthy": 1, "Minor Issues": 2, "Special Needs": 3, "Chronic Condition": 4}


def build_features(pet, adopter):
    features = {
        # ---- Pet-level ----
        "Age": float(pet.get("age", 1.0)),
        "MaturitySize": SIZE_MAP.get(pet.get("size", "Medium"), 2),
        "FurLength": 2,
        "Vaccinated": 1,
        "Dewormed": 1,
        "Sterilized": 0,
        "Health": HEALTH_MAP.get(pet.get("healthStatus", "Healthy"), 1),
        "Quantity": 1,
        "Fee": 0,
        # ---- Adopter-level ----
        "activityLevel": float(adopter.get("activityLevel", 3)),
        "careHoursNumeric": float(adopter.get("careHoursNumeric", 2)),
        "hasChildrenUnder12": 1 if adopter.get("hasChildrenUnder12") else 0,
        "hasOtherPets": 1 if adopter.get("hasOtherPets") else 0,
        "experienceLevel": float(adopter.get("experienceLevel", 1)),
        "groomingTolerance": float(adopter.get("groomingTolerance", 3)),
        "age": float(adopter.get("age", 35)),
    }

    breed_name = (pet.get("breed") or "").strip()
    if breed_name in BREEDS.index:
        b = BREEDS.loc[breed_name]
        for col in FEATURE_COLS:
            if col not in features:
                val = b.get(col, 3.0)
                features[col] = float(val) if not pd.isna(val) else 3.0
    else:
        for col in FEATURE_COLS:
            if col not in features:
                features[col] = float(TRAIN_MEDIANS.get(col, 3.0))

    return pd.DataFrame([features])[FEATURE_COLS].fillna(TRAIN_MEDIANS)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "rf_compatibility_v1.0"})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    pet = data.get("pet", {})
    adopter = data.get("adopter", {})

    X = build_features(pet, adopter)

    pred = float(MODEL.predict(X)[0])
    pred = max(0.0, min(1.0, pred))

    shap_vals = EXPLAINER.shap_values(X)[0]
    factors = sorted(
        [{"feature": FEATURE_COLS[i], "contribution": round(float(shap_vals[i]), 4)}
         for i in range(len(FEATURE_COLS))],
        key=lambda x: abs(x["contribution"]),
        reverse=True
    )

    return jsonify({
        "compatibility_score": round(pred, 4),
        "top_factors": factors[:5],
        "model_version": "rf_compatibility_v1.0"
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)