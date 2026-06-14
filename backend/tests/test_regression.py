import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app, get_db
from backend.app.models import Base

# Setup in-memory SQLite with StaticPool so all connections share the same database
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(name="client")
def client_fixture():
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_regression_e2e_flow(client):
    # 1. Register a new user
    reg_payload = {
        "name": "Yudha Regression",
        "email": "regression@example.com",
        "password": "securepassword123",
    }
    reg_res = client.post("/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Login
    login_payload = {
        "email": "regression@example.com",
        "password": "securepassword123",
    }
    login_res = client.post("/auth/login", json=login_payload)
    assert login_res.status_code == 200

    # 3. Get profile details (/users/me)
    profile_res = client.get("/users/me", headers=headers)
    assert profile_res.status_code == 200
    assert profile_res.json()["email"] == "regression@example.com"

    # 4. Upload a dummy image to /scan
    # Create a simple red JPEG image in-memory using PIL
    img = Image.new("RGB", (100, 100), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_bytes = img_byte_arr.getvalue()

    files = {"file": ("ikan_tongkol.jpg", img_bytes, "image/jpeg")}
    scan_res = client.post("/scan", files=files, headers=headers)

    # Check if scan succeeded or got validation response
    assert scan_res.status_code in (201, 400)

    if scan_res.status_code == 201:
        scan_data = scan_res.json()
        assert "overall_score" in scan_data
        analysis_id = scan_data["id"]

        # 5. Check analysis history
        history_res = client.get("/analysis/history", headers=headers)
        assert history_res.status_code == 200
        history_data = history_res.json()
        assert len(history_data) > 0
        assert history_data[0]["id"] == analysis_id

        # 6. Delete history
        delete_res = client.delete(f"/analysis/{analysis_id}", headers=headers)
        assert delete_res.status_code == 204

        # Verify history is empty
        history_res_after = client.get("/analysis/history", headers=headers)
        assert history_res_after.status_code == 200
        assert len(history_res_after.json()) == 0
