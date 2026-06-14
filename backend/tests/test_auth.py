import pytest
from fastapi.testclient import TestClient
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


def test_register_user_success(client):
    payload = {
        "name": "Yudha Test",
        "email": "yudhatest@example.com",
        "password": "securepassword123",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "yudhatest@example.com"
    assert data["user"]["name"] == "Yudha Test"


def test_register_duplicate_email(client):
    payload = {
        "name": "Yudha Test",
        "email": "yudhadup@example.com",
        "password": "securepassword123",
    }
    response1 = client.post("/auth/register", json=payload)
    assert response1.status_code == 201

    response2 = client.post("/auth/register", json=payload)
    assert response2.status_code == 400
    assert response2.json()["detail"] == "Email sudah terdaftar"


def test_login_success(client):
    payload_register = {
        "name": "Yudha Login",
        "email": "yudhalogin@example.com",
        "password": "password123",
    }
    client.post("/auth/register", json=payload_register)

    payload_login = {
        "email": "yudhalogin@example.com",
        "password": "password123",
    }
    response = client.post("/auth/login", json=payload_login)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "yudhalogin@example.com"


def test_login_invalid_password(client):
    payload_register = {
        "name": "Yudha Login",
        "email": "yudhawrong@example.com",
        "password": "password123",
    }
    client.post("/auth/register", json=payload_register)

    payload_login = {
        "email": "yudhawrong@example.com",
        "password": "wrongpassword",
    }
    response = client.post("/auth/login", json=payload_login)
    assert response.status_code == 401
    assert response.json()["detail"] == "Email atau password salah"
