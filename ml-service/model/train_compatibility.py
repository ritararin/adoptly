import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

print("=== Loading compatibility pairs ===")
df = pd.read_csv("data/compatibility_pairs.csv")
print(f"Rows: {len(df):,}")

# ---- Adopter features ----
adopter_features = [
    "activityLevel", "careHoursNumeric", "hasChildrenUnder12",
    "hasOtherPets", "experienceLevel", "groomingTolerance",
    "age",
]

# ---- Pet-level features ----
pet_features = [
    "Age", "MaturitySize", "FurLength", "Vaccinated",
    "Dewormed", "Sterilized", "Health", "Quantity", "Fee",
]

# ---- Breed-level features ----
breed_features = [
    "energy_level", "grooming", "shedding_level",
    "child_friendly", "stranger_friendly", "dog_friendly",
    "adaptability", "affection_level", "intelligence",
    "social_needs", "vocalisation", "hypoallergenic",
    "senior_friendly", "urban_friendly", "health_issues",
    "child_friendly_norm", "stranger_friendly_norm",
    "dog_friendly_norm", "energy_level_norm",
    "affection_level_norm", "intelligence_norm",
    "adaptability_norm", "senior_friendly_norm",
    "urban_friendly_norm",
    "heat_tolerance", "cold_tolerance",
    "humidity_tolerance", "all_weather_adaptability",
    "Avg monthly_food_cost_inr",
    "Avg exercise_minutes_daily",
    "Avg total_monthly_cost_inr",
]

feature_cols = adopter_features + pet_features + breed_features
print(f"Total features: {len(feature_cols)}")

X = df[feature_cols].copy()
y = df["compatibility"]

print("\n=== Splitting data (70/15/15) ===")
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=42
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42
)
print(f"Train: {len(X_train):,} | Val: {len(X_val):,} | Test: {len(X_test):,}")

train_medians = X_train.median()
X_train = X_train.fillna(train_medians)
X_val = X_val.fillna(train_medians)
X_test = X_test.fillna(train_medians)

print("\n=== Training Random Forest ===")
rf = RandomForestRegressor(
    n_estimators=100,
    max_depth=None,
    random_state=42,
    n_jobs=-1
)
rf.fit(X_train, y_train)
print("Training complete.")

y_val_pred = rf.predict(X_val)
val_rmse = np.sqrt(mean_squared_error(y_val, y_val_pred))
val_mae = mean_absolute_error(y_val, y_val_pred)
val_r2 = r2_score(y_val, y_val_pred)

print("\n=== VALIDATION METRICS ===")
print(f"RMSE: {val_rmse:.4f}")
print(f"MAE:  {val_mae:.4f}")
print(f"R²:   {val_r2:.4f}")

importances = pd.DataFrame({
    "feature": feature_cols,
    "importance": rf.feature_importances_
}).sort_values("importance", ascending=False)

print("\n=== TOP 15 FEATURES ===")
print(importances.head(15).to_string(index=False))

y_test_pred = rf.predict(X_test)
test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
test_mae = mean_absolute_error(y_test, y_test_pred)
test_r2 = r2_score(y_test, y_test_pred)

print("\n=== TEST METRICS (final, run once) ===")
print(f"RMSE: {test_rmse:.4f}")
print(f"MAE:  {test_mae:.4f}")
print(f"R²:   {test_r2:.4f}")

print("\n=== Saving ===")
joblib.dump(rf, "model/random_forest_compatibility.pkl")
joblib.dump(feature_cols, "model/feature_cols_compatibility.pkl")
joblib.dump(train_medians, "model/train_medians_compatibility.pkl")
importances.to_csv("model/feature_importance_compatibility.csv", index=False)

print("Saved:")
print("  model/random_forest_compatibility.pkl")
print("  model/feature_cols_compatibility.pkl")
print("  model/train_medians_compatibility.pkl")
print("  model/feature_importance_compatibility.csv")