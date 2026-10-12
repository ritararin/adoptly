import pandas as pd

# Load the PetFinder data
pets = pd.read_csv("data/train.csv")
print("=== PetFinder data ===")
print("Shape:", pets.shape)
print("Columns:", pets.columns.tolist())
print("\nFirst 3 rows:")
print(pets.head(3))

# Load breed labels
breeds = pd.read_csv("data/breed_labels.csv")
print("\n=== Breed labels ===")
print("Shape:", breeds.shape)
print(breeds.head(10))

# Load your breed dataset
your_breeds = pd.read_excel("data/pet_breeds.xlsx")
print("\n=== Your breed dataset ===")
print("Shape:", your_breeds.shape)
print("Species counts:", your_breeds["species"].value_counts().to_dict())
print("First 5 breed names:", your_breeds["breed_name"].head(5).tolist())

# Check target variable
print("\n=== AdoptionSpeed distribution ===")
print(pets["AdoptionSpeed"].value_counts().sort_index())