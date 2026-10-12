import pandas as pd
import numpy as np

print("Loading data...")
pets = pd.read_csv("data/training_data.csv")
adopters = pd.read_csv("data/synthetic_adopters.csv")

print(f"Pets: {len(pets)}")
print(f"Adopters: {len(adopters)}")

np.random.seed(42)
sampled_adopters = adopters.sample(n=500, random_state=42).reset_index(drop=True)
sampled_pets = pets.sample(n=2000, random_state=42).reset_index(drop=True)

print(f"Sampled adopters: {len(sampled_adopters)}")
print(f"Sampled pets: {len(sampled_pets)}")

pairs = sampled_adopters.merge(sampled_pets, how="cross")
print(f"Total adopter-pet pairs: {len(pairs):,}")

def safe_float(val, default):
    return float(val) if not pd.isna(val) else default

def compute_compatibility(row):
    pet_energy = safe_float(row.get("energy_level"), 3.0)
    energy_match = 1 - abs(row["activityLevel"] - pet_energy) / 4

    if row["housing_type"] in ["Studio", "Apartment"]:
        urban = safe_float(row.get("urban_friendly"), 3.0)
        space_match = urban / 5
    else:
        space_match = 1.0

    exercise = safe_float(row.get("Avg exercise_minutes_daily"), 45)
    if exercise < 30:      required_care = 1
    elif exercise < 60:    required_care = 2
    elif exercise < 90:    required_care = 3
    else:                  required_care = 4
    care_match = 1 - abs(row["careHoursNumeric"] - required_care) / 3

    if row["hasChildrenUnder12"] == 1:
        child_f = safe_float(row.get("child_friendly"), 3.0)
        child_match = child_f / 5
    else:
        child_match = 1.0

    pet_grooming = safe_float(row.get("grooming"), 3.0)
    grooming_match = 1 - abs(row["groomingTolerance"] - pet_grooming) / 4

    if row["experienceLevel"] == 1:
        trainability = safe_float(row.get("intelligence"), 3.0)
        exp_match = trainability / 5
    else:
        exp_match = 1.0

    recommended = row.get("recommended_climate_types", "")
    if pd.isna(recommended):
        climate_match = 0.7
    elif row["climateRegion"] in str(recommended):
        climate_match = 1.0
    else:
        climate_match = 0.4

    score = (
        0.25 * energy_match +
        0.20 * space_match +
        0.15 * care_match +
        0.15 * child_match +
        0.10 * grooming_match +
        0.10 * exp_match +
        0.05 * climate_match
    )
    return round(float(score), 4)

print("Computing compatibility scores... (this takes 2-5 minutes)")
pairs["compatibility"] = pairs.apply(compute_compatibility, axis=1)

print("\n=== SCORE DISTRIBUTION ===")
print(pairs["compatibility"].describe())
print("\nHistogram:")
print(pd.cut(pairs["compatibility"], bins=10).value_counts().sort_index())

pairs.to_csv("data/compatibility_pairs.csv", index=False)
print(f"\nSaved {len(pairs):,} pairs to data/compatibility_pairs.csv")
