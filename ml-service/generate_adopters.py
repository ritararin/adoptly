import pandas as pd
import numpy as np
from uuid import uuid4

np.random.seed(42)
N_ADOPTERS = 5000

occupation = np.random.choice(
    ["Student", "Office", "Remote", "Retired", "Freelancer"],
    size=N_ADOPTERS, p=[0.15, 0.35, 0.20, 0.10, 0.20]
)
housing = np.random.choice(
    ["Studio", "Apartment", "House_no_yard", "House_with_yard"],
    size=N_ADOPTERS, p=[0.15, 0.40, 0.25, 0.20]
)

activity = np.zeros(N_ADOPTERS, dtype=int)
for i, occ in enumerate(occupation):
    if occ == "Retired":
        activity[i] = np.random.choice([1, 2, 3], p=[0.4, 0.4, 0.2])
    elif occ == "Student":
        activity[i] = np.random.choice([2, 3, 4, 5], p=[0.2, 0.3, 0.3, 0.2])
    elif occ == "Remote":
        activity[i] = np.random.choice([2, 3, 4, 5], p=[0.15, 0.35, 0.35, 0.15])
    elif occ == "Office":
        activity[i] = np.random.choice([1, 2, 3, 4], p=[0.15, 0.35, 0.35, 0.15])
    else:
        activity[i] = np.random.choice([2, 3, 4], p=[0.3, 0.4, 0.3])

care_hours = np.zeros(N_ADOPTERS, dtype=int)
for i, occ in enumerate(occupation):
    if occ == "Retired":
        care_hours[i] = np.random.choice([2, 3, 4], p=[0.3, 0.4, 0.3])
    elif occ == "Office":
        care_hours[i] = np.random.choice([1, 2, 3], p=[0.4, 0.4, 0.2])
    elif occ == "Remote":
        care_hours[i] = np.random.choice([2, 3, 4], p=[0.3, 0.4, 0.3])
    elif occ == "Student":
        care_hours[i] = np.random.choice([1, 2, 3], p=[0.2, 0.5, 0.3])
    else:
        care_hours[i] = np.random.choice([2, 3, 4], p=[0.3, 0.4, 0.3])

has_children = np.random.choice([0, 1], size=N_ADOPTERS, p=[0.65, 0.35])
has_other_pets = np.random.choice([0, 1], size=N_ADOPTERS, p=[0.60, 0.40])
experience = np.random.choice([1, 2, 3], size=N_ADOPTERS, p=[0.40, 0.35, 0.25])
grooming_tol = np.random.choice([1, 2, 3, 4, 5], size=N_ADOPTERS, p=[0.15, 0.25, 0.30, 0.20, 0.10])
climate = np.random.choice(
    ["Temperate", "Tropical", "Cold", "Arid"],
    size=N_ADOPTERS, p=[0.35, 0.30, 0.20, 0.15]
)

adopters = pd.DataFrame({
    "adopter_id": [str(uuid4()) for _ in range(N_ADOPTERS)],
    "age": np.clip(np.random.normal(38, 12, N_ADOPTERS), 18, 75).astype(int),
    "occupation_type": occupation,
    "housing_type": housing,
    "activityLevel": activity,
    "careHoursNumeric": care_hours,
    "hasChildrenUnder12": has_children,
    "hasOtherPets": has_other_pets,
    "experienceLevel": experience,
    "groomingTolerance": grooming_tol,
    "climateRegion": climate,
})

adopters.to_csv("data/synthetic_adopters.csv", index=False)
print(f"Generated {len(adopters)} synthetic adopters")
print(adopters.head())
print("\nActivity level distribution:")
print(adopters["activityLevel"].value_counts().sort_index())
print("\nHousing distribution:")
print(adopters["housing_type"].value_counts())