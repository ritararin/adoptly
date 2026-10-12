import pandas as pd
import numpy as np
import joblib
from scipy.stats import spearmanr

print("Loading model and real test data...")
MODEL = joblib.load("model/random_forest_compatibility.pkl")
FEATURE_COLS = joblib.load("model/feature_cols_compatibility.pkl")

# Load the real PetFinder data (not the synthetic pairs)
df = pd.read_csv("data/training_data.csv")

# Filter to only rows with valid adoption outcomes
df = df.dropna(subset=["compatibility_proxy", "energy_level"])
print(f"Real test rows: {len(df)}")

# Build features for each real pet against the AVERAGE adopter
# This gives a "baseline compatibility" per pet
avg_adopter = {
    "activityLevel": 3, "careHoursNumeric": 2, "hasChildrenUnder12": 0,
    "hasOtherPets": 0, "experienceLevel": 1, "groomingTolerance": 3,
    "age": 38,
}

features_list = []
for _, row in df.iterrows():
    f = {
        "Age": float(row.get("Age", 1)),
        "MaturitySize": float(row.get("MaturitySize", 2)),
        "FurLength": float(row.get("FurLength", 2)),
        "Vaccinated": float(row.get("Vaccinated", 1)),
        "Dewormed": float(row.get("Dewormed", 1)),
        "Sterilized": float(row.get("Sterilized", 0)),
        "Health": float(row.get("Health", 1)),
        "Quantity": float(row.get("Quantity", 1)),
        "Fee": float(row.get("Fee", 0)),
        "activityLevel": avg_adopter["activityLevel"],
        "careHoursNumeric": avg_adopter["careHoursNumeric"],
        "hasChildrenUnder12": avg_adopter["hasChildrenUnder12"],
        "hasOtherPets": avg_adopter["hasOtherPets"],
        "experienceLevel": avg_adopter["experienceLevel"],
        "groomingTolerance": avg_adopter["groomingTolerance"],
        "age": avg_adopter["age"],
    }
    for col in FEATURE_COLS:
        if col not in f:
            val = row.get(col, 3.0)
            f[col] = float(val) if not pd.isna(val) else 3.0
    features_list.append(f)

X = pd.DataFrame(features_list)[FEATURE_COLS].fillna(3.0)
predicted = MODEL.predict(X)

# Compare against actual adoption outcome
actual = df["compatibility_proxy"].values

corr, p_value = spearmanr(predicted, actual)
print(f"\n=== REAL-WORLD VALIDATION ===")
print(f"Spearman correlation: {corr:.4f}")
print(f"P-value: {p_value:.4f}")
print(f"Interpretation: ", end="")
if abs(corr) < 0.1:
    print("No meaningful relationship between predicted compatibility and real adoption speed")
elif abs(corr) < 0.3:
    print("Weak relationship")
elif abs(corr) < 0.5:
    print("Moderate relationship")
else:
    print("Strong relationship")