import pandas as pd
import numpy as np

print("Loading data...")

# Load everything
pets = pd.read_csv("data/train.csv")
breeds_pf = pd.read_csv("data/breed_labels.csv")
your_breeds = pd.read_excel("data/pet_breeds.xlsx")
mapping = pd.read_csv("data/breed_mapping.csv")

print(f"PetFinder: {len(pets)} rows")
print(f"Your breeds: {len(your_breeds)} rows")
print(f"Manual mappings: {len(mapping)} rows")

# Step 1: Map Breed1 ID → breed name
pets = pets.merge(
    breeds_pf[["BreedID", "BreedName", "Type"]],
    left_on="Breed1", right_on="BreedID", how="left"
).rename(columns={"BreedName": "pf_breed_name", "Type": "species_type"})

print(f"After Breed1 mapping: {pets['pf_breed_name'].notna().sum()} rows have breed names")

# Step 2: Apply manual mapping (fills gaps)
pets = pets.merge(
    mapping,
    left_on="pf_breed_name", right_on="petfinder_name", how="left"
)
pets["breed_final"] = pets["dataset_name"].fillna(pets["pf_breed_name"])

# Step 3: Merge breed attributes from your Excel
merged = pets.merge(
    your_breeds,
    left_on="breed_final", right_on="breed_name",
    how="left", suffixes=("_pet", "_breed")
)

# Step 4: Create the target variable
# AdoptionSpeed 0 (same-day adoption) → 1.0 compatibility
# AdoptionSpeed 4 (no adoption after 100+ days) → 0.0 compatibility
merged["compatibility_proxy"] = 1 - (merged["AdoptionSpeed"] / 4)

# Step 5: Keep only rows that got breed attributes
final = merged.dropna(subset=["energy_level"]).copy()

print(f"\n=== RESULTS ===")
print(f"Total PetFinder rows: {len(pets)}")
print(f"Rows with matched breed attributes: {len(final)} ({100*len(final)/len(pets):.1f}%)")
print(f"Rows dropped (no breed match): {len(pets) - len(final)}")

# Save
final.to_csv("data/training_data.csv", index=False)
print(f"\nSaved to data/training_data.csv")