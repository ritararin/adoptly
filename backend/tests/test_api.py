import pytest
import app as app_module

ADOPTER = {
    "activityLevel": 3,
    "careHoursNumeric": 5,
    "hasChildrenUnder12": 0,
    "hasOtherPets": 0,
    "experienceLevel": 2,
    "groomingTolerance": 3,
    "housingSpace": 2,
}

AUTH_HEADERS = {"Authorization": "Bearer valid-test-token"}


def make_pet(pid="pet_1", energy=4, child=4, **extra):
    return {
        "id": pid,
        "name": f"TestPet_{pid}",
        "species": "Dog",
        "breed": "Golden Retriever",
        "energy_level": energy,
        "child_friendly": child,
        "grooming": 3,
        "dog_friendly": 4,
        "pet_size_code": 2,
        "Avg total daily time hours": 4,
        **extra
    }


@pytest.fixture(autouse=True)
def mock_firebase_token(monkeypatch):
    """Mock verify_firebase_token to accept 'valid-test-token'."""
    def fake_verify(token, request, audience=None):
        if token != "valid-test-token":
            raise ValueError("Token verification failed")
        return {
            "iss": f"https://securetoken.google.com/{audience or 'test-adoptly-project'}",
            "sub": "test-user-uid-12345",
        }
    monkeypatch.setattr(app_module.id_token, "verify_firebase_token", fake_verify)


# 1. Health check returns 200 and status ok
def test_health_is_public(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.get_json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True


# 2. Health check supports HEAD method
def test_health_head_method(client):
    r = client.head("/health")
    assert r.status_code == 200


# 3. Missing Authorization header returns 401
def test_predict_requires_token(client):
    r = client.post("/predict", json={"pet": make_pet(), "adopter": ADOPTER})
    assert r.status_code == 401
    assert "Authorization" in r.get_json()["error"]


# 4. Malformed Authorization header returns 401
def test_predict_rejects_malformed_header(client):
    r = client.post("/predict", headers={"Authorization": "Basic 12345"}, json={"pet": make_pet(), "adopter": ADOPTER})
    assert r.status_code == 401


# 5. Invalid token returns 401
def test_predict_rejects_bad_token(client):
    r = client.post("/predict", headers={"Authorization": "Bearer bad-token"}, json={"pet": make_pet(), "adopter": ADOPTER})
    assert r.status_code == 401


# 6. Token with unexpected issuer is rejected
def test_predict_rejects_wrong_issuer(client, monkeypatch):
    monkeypatch.setattr(
        app_module.id_token,
        "verify_firebase_token",
        lambda *args, **kwargs: {"iss": "https://malicious-issuer.com", "sub": "attacker"}
    )
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": make_pet(), "adopter": ADOPTER})
    assert r.status_code == 401


# 7. Missing FIREBASE_PROJECT_ID server configuration returns 500
def test_server_unconfigured_error(client, monkeypatch):
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "")
    monkeypatch.setattr(app_module, "FIREBASE_PROJECT_ID", "")
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": make_pet(), "adopter": ADOPTER})
    assert r.status_code == 500
    assert "FIREBASE_PROJECT_ID" in r.get_json()["error"]


# 8. Valid pet and adopter prediction returns 200
def test_predict_valid_pair_success(client):
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": make_pet(), "adopter": ADOPTER})
    assert r.status_code == 200
    data = r.get_json()
    assert "score" in data
    assert "compatibility_score" in data
    assert "recommended" in data


# 9. Scores are bounded within range
def test_predict_score_bounds(client):
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": make_pet(), "adopter": ADOPTER})
    data = r.get_json()
    assert 0.0 <= data["score"] <= 100.0
    assert 0.0 <= data["compatibility_score"] <= 1.0


# 10. Top factors contain required keys
def test_predict_top_factors_structure(client):
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": make_pet(), "adopter": ADOPTER})
    data = r.get_json()
    assert "top_factors" in data
    assert len(data["top_factors"]) > 0
    factor = data["top_factors"][0]
    for key in ("feature", "label", "value", "contribution", "effect"):
        assert key in factor


# 11. Factor effects are strictly 'raises' or 'lowers'
def test_factor_effects_valid(client):
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": make_pet(), "adopter": ADOPTER})
    for f in r.get_json()["top_factors"]:
        assert f["effect"] in ("raises", "lowers")


# 12. Child safety rule excludes pets rated 1 or 2 for families with young children
def test_child_safety_rule_excludes_unsafe(client):
    family = {**ADOPTER, "hasChildrenUnder12": 1}
    unsafe_pet = make_pet(child=1)
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": unsafe_pet, "adopter": family})
    data = r.get_json()
    assert data["recommended"] is False
    assert data["exclusion_reason"] is not None
    assert "children under 12" in data["exclusion_reason"]


# 13. Child safety rule allows pets rated 3+ for families
def test_child_safety_rule_allows_safe(client):
    family = {**ADOPTER, "hasChildrenUnder12": 1}
    safe_pet = make_pet(child=4)
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": safe_pet, "adopter": family})
    data = r.get_json()
    assert data["recommended"] is True
    assert data["exclusion_reason"] is None


# 14. Child safety rule does not exclude pet if adopter has no young children
def test_child_safety_rule_not_triggered_without_children(client):
    no_children_adopter = {**ADOPTER, "hasChildrenUnder12": 0}
    low_child_pet = make_pet(child=1)
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": low_child_pet, "adopter": no_children_adopter})
    data = r.get_json()
    assert data["recommended"] is True


# 15. Flag added when child friendliness is unassessed for family with children
def test_unassessed_child_friendliness_flag(client):
    family = {**ADOPTER, "hasChildrenUnder12": 1}
    unassessed_pet = {"id": "p_unassessed", "species": "Dog", "energy_level": 3}
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": unassessed_pet, "adopter": family})
    data = r.get_json()
    assert "child_friendliness_not_assessed" in data["flags"]


# 16. Flag added when energy level is unassessed
def test_unassessed_energy_level_flag(client):
    pet_no_energy = {"id": "p_no_energy", "species": "Cat", "child_friendly": 4}
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": pet_no_energy, "adopter": ADOPTER})
    data = r.get_json()
    assert "energy_level_not_assessed" in data["flags"]


# 17. Disclaimer text is present in response
def test_disclaimer_present(client):
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": make_pet(), "adopter": ADOPTER})
    data = r.get_json()
    assert "disclaimer" in data
    assert "Prototype compatibility score" in data["disclaimer"]


# 18. Known breed retrieves breed traits
def test_breed_traits_lookup_integration(client):
    pet_with_breed = {"id": "p_gr", "breed": "Golden Retriever", "species": "Dog"}
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": pet_with_breed, "adopter": ADOPTER})
    assert r.status_code == 200
    data = r.get_json()
    assert data["score"] > 0


# 19. Unknown breed uses species/training median fallback gracefully
def test_unknown_breed_fallback(client):
    pet_unknown = {"id": "p_mystery", "breed": "Nonexistent Fantastical Hound", "species": "Dog"}
    r = client.post("/predict", headers=AUTH_HEADERS, json={"pet": pet_unknown, "adopter": ADOPTER})
    assert r.status_code == 200
    data = r.get_json()
    assert data["score"] > 0


# 20. CORS headers present on prediction response
def test_cors_headers_on_response(client):
    r = client.post(
        "/predict",
        headers={**AUTH_HEADERS, "Origin": "http://localhost:3000"},
        json={"pet": make_pet(), "adopter": ADOPTER}
    )
    assert r.status_code == 200
    assert r.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"


# 21. OPTIONS preflight request handled with 200
def test_cors_options_preflight(client):
    r = client.options(
        "/predict",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization,Content-Type"
        }
    )
    assert r.status_code == 200
    assert r.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


# 22. Batch recommendation endpoint returns ranked recommendations and not_recommended
def test_batch_recommend_endpoint(client):
    family = {**ADOPTER, "hasChildrenUnder12": 1}
    pets = [
        make_pet("p1", energy=4, child=4),
        make_pet("p2", energy=2, child=1),  # unsafe
        make_pet("p3", energy=3, child=5),
    ]
    r = client.post("/recommend", headers=AUTH_HEADERS, json={"adopter": family, "pets": pets, "top_n": 5})
    assert r.status_code == 200
    data = r.get_json()
    assert "recommendations" in data
    assert "not_recommended" in data
    assert len(data["recommendations"]) == 2
    assert len(data["not_recommended"]) == 1
    assert data["not_recommended"][0]["id"] == "p2"


# 23. Schedule interview endpoint validates required dateTime
def test_schedule_interview_missing_datetime(client):
    r = client.post(
        "/schedule-interview",
        headers=AUTH_HEADERS,
        json={"applicationId": "app_1", "petName": "Buddy"}
    )
    assert r.status_code == 400
    assert "dateTime is required" in r.get_json()["error"]


# 24. Schedule interview endpoint creates authentic Google Meet link
def test_schedule_interview_success(client, monkeypatch):
    def fake_create_meeting(summary, description, date_time_iso, attendees):
        return {
            "meetLink": "https://meet.google.com/nyw-rsju-dfx",
            "eventId": "cal_evt_123",
            "calendarLink": "https://calendar.google.com/event?eid=123",
        }
    monkeypatch.setattr(app_module, "create_google_meet_meeting", fake_create_meeting)

    r = client.post(
        "/schedule-interview",
        headers=AUTH_HEADERS,
        json={
            "applicationId": "app_100",
            "petName": "Max",
            "adopterEmail": "adopter@example.com",
            "shelterEmail": "shelter@example.com",
            "dateTime": "2026-11-01T14:00:00Z",
        }
    )
    assert r.status_code == 200
    data = r.get_json()
    assert data["success"] is True
    assert data["meetLink"] == "https://meet.google.com/nyw-rsju-dfx"
    assert data["eventId"] == "cal_evt_123"

