import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import learning_curve

print("Loading data...")
df = pd.read_csv("data/compatibility_pairs.csv")

# Sample for speed — learning curve is expensive on 1M rows
df_sample = df.sample(n=100000, random_state=42)
print(f"Using sample of {len(df_sample):,} rows for the learning curve")

# Feature columns (must match train_compatibility.py exactly)
adopter_features = [
    "activityLevel", "careHoursNumeric", "hasChildrenUnder12",
    "hasOtherPets", "experienceLevel", "groomingTolerance",
    "age",
]
pet_features = [
    "Age", "MaturitySize", "FurLength", "Vaccinated",
    "Dewormed", "Sterilized", "Health", "Quantity", "Fee",
]
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

X = df_sample[feature_cols].fillna(df_sample[feature_cols].median())
y = df_sample["compatibility"]

print("Computing learning curve (this takes 3-5 minutes)...")
train_sizes, train_scores, val_scores = learning_curve(
    RandomForestRegressor(n_estimators=30, random_state=42, n_jobs=-1),
    X, y,
    cv=3,
    scoring="neg_root_mean_squared_error",
    train_sizes=np.linspace(0.1, 1.0, 6),
    n_jobs=-1
)

train_rmse = -train_scores.mean(axis=1)
val_rmse = -val_scores.mean(axis=1)

plt.figure(figsize=(8, 5))
plt.plot(train_sizes, train_rmse, "o-", label="Training RMSE", color="steelblue", linewidth=2)
plt.plot(train_sizes, val_rmse, "o-", label="Validation RMSE", color="darkred", linewidth=2)
plt.xlabel("Training set size")
plt.ylabel("RMSE")
plt.title("Learning Curve — Adoptly Compatibility Model")
plt.legend()
plt.grid(True, alpha=0.3)
plt.savefig("model/learning_curve_compatibility.png", dpi=150, bbox_inches="tight")
print("Saved: model/learning_curve_compatibility.png")

print("\nData points:")
for i, size in enumerate(train_sizes):
    print(f"  size={int(size):,} | train={train_rmse[i]:.4f} | val={val_rmse[i]:.4f}")