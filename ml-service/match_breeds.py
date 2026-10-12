import pandas as pd

# Load
pets = pd.read_csv("data/train.csv")
breeds_pf = pd.read_csv("data/breed_labels.csv")
your_breeds = pd.read_excel("data/pet_breeds.xlsx")

# Get breed names from each source
pf_dogs = set(breeds_pf[breeds_pf["Type"] == 1]["BreedName"].tolist())
pf_cats = set(breeds_pf[breeds_pf["Type"] == 2]["BreedName"].tolist())

your_dogs = set(your_breeds[your_breeds["species"] == "Dog"]["breed_name"].tolist())
your_cats = set(your_breeds[your_breeds["species"] == "Cat"]["breed_name"].tolist())

# Find matches
dog_matches = pf_dogs & your_dogs
cat_matches = pf_cats & your_cats

print(f"=== Dog breeds ===")
print(f"PetFinder has {len(pf_dogs)} dog breeds")
print(f"Your dataset has {len(your_dogs)} dog breeds")
print(f"Exact matches: {len(dog_matches)}")
print(f"\nUnmatched PetFinder dog breeds:")
for name in sorted(pf_dogs - your_dogs):
    print(f"  - {name}")

print(f"\n=== Cat breeds ===")
print(f"PetFinder has {len(pf_cats)} cat breeds")
print(f"Your dataset has {len(your_cats)} cat breeds")
print(f"Exact matches: {len(cat_matches)}")
print(f"\nUnmatched PetFinder cat breeds:")
for name in sorted(pf_cats - your_cats):
    print(f"  - {name}")