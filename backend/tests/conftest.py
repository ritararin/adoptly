import os
import sys
import tempfile
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestRegressor

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

FEATURE_COLS = [
    "activityLevel", "careHoursNumeric", "hasChildrenUnder12", "hasOtherPets",
    "experienceLevel", "groomingTolerance", "housingSpace",
    "Type", "pet_age_months", "pet_size_code", "pet_fur_code",
    "Vaccinated", "Dewormed", "Sterilized", "Health", "Quantity", "Fee",
    "energy_level", "grooming", "child_friendly", "dog_friendly", "adaptability",
    "affection_level", "intelligence", "social_needs", "vocalisation",
    "hypoallergenic", "senior_friendly", "urban_friendly", "health_issues",
    "Avg total daily time hours", "Avg exercise minutes daily",
    "Avg grooming hours monthly",
]

def _build_stand_in_model():
    rng = np.random.default_rng(0)
    X = pd.DataFrame(
        rng.integers(1, 5, size=(100, len(FEATURE_COLS))).astype(float),
        columns=FEATURE_COLS
    )
    y = 20 * X["energy_level"] + 10 * X["child_friendly"] + rng.normal(0, 1, 100)
    model = RandomForestRegressor(n_estimators=5, max_depth=4, random_state=0).fit(X, y)
    
    tmp_dir = Path(tempfile.mkdtemp())
    m_path = tmp_dir / "standin_model.joblib"
    joblib.dump({
        "model": model,
        "feature_cols": FEATURE_COLS,
        "train_medians": X.median().to_dict(),
    }, m_path)

    os.environ["MODEL_PATH"] = str(m_path)
    os.environ["FIREBASE_PROJECT_ID"] = "test-adoptly-project"
    os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000,http://localhost:5173"

_build_stand_in_model()

@pytest.fixture
def client():
    import app as app_module
    app_module.app.config["TESTING"] = True
    app_module.load_artifacts()
    with app_module.app.test_client() as c:
        yield c
