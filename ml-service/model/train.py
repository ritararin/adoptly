import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

print("=== Loading training data ===")
df = pd.read_csv("data/training_data.csv")
print(f"Rows: {len(df)}")
# Pet-level features from PetFinder.my (already numeric)
pet_features = [
    "Age", "MaturitySize", "FurLength", "Vaccinated",
    "Dewormed", "Sterilized", "Health", "Quantity", "Fee"
]

# Breed-level features 
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

feature_cols = pet_features + breed_features

feature_cols = pet_features + breed_features
print(f"Total features: {len(feature_cols)}")

X = df[feature_cols].copy()
y = df["compatibility_proxy"]

# Split: 70% train / 15% validation / 15% test
print("\n=== Splitting data ===")
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=42
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42
)
print(f"Train: {len(X_train)} | Validation: {len(X_val)} | Test: {len(X_test)}")

# Impute missing values using TRAINING medians ONLY
train_medians = X_train.median()
X_train = X_train.fillna(train_medians)
X_val = X_val.fillna(train_medians)
X_test = X_test.fillna(train_medians)

# Train Random Forest
print("\n=== Training Random Forest ===")
rf = RandomForestRegressor(
    n_estimators=100,
    max_depth=None,
    random_state=42,
    n_jobs=-1,
    verbose=1
)
rf.fit(X_train, y_train)
print("Training complete.")

# Validation metrics
y_val_pred = rf.predict(X_val)
val_rmse = np.sqrt(mean_squared_error(y_val, y_val_pred))
val_mae = mean_absolute_error(y_val, y_val_pred)
val_r2 = r2_score(y_val, y_val_pred)

print("\n=== VALIDATION METRICS ===")
print(f"RMSE: {val_rmse:.4f}")
print(f"MAE:  {val_mae:.4f}")
print(f"R²:   {val_r2:.4f}")

# Feature importance
importances = pd.DataFrame({
    "feature": feature_cols,
    "importance": rf.feature_importances_
}).sort_values("importance", ascending=False)

print("\n=== TOP 10 FEATURES ===")
print(importances.head(10).to_string(index=False))

# Final test metrics
y_test_pred = rf.predict(X_test)
test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
test_mae = mean_absolute_error(y_test, y_test_pred)
test_r2 = r2_score(y_test, y_test_pred)

print("\n=== TEST METRICS (final, run once) ===")
print(f"RMSE: {test_rmse:.4f}")
print(f"MAE:  {test_mae:.4f}")
print(f"R²:   {test_r2:.4f}")

# Save model and artifacts
print("\n=== Saving model ===")
joblib.dump(rf, "model/random_forest.pkl")
joblib.dump(feature_cols, "model/feature_cols.pkl")
joblib.dump(train_medians, "model/train_medians.pkl")
importances.to_csv("model/feature_importance.csv", index=False)

print("Saved:")
print("  model/random_forest.pkl")
print("  model/feature_cols.pkl")
print("  model/train_medians.pkl")
print("  model/feature_importance.csv")