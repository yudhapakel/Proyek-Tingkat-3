from backend.app.security import hash_password, verify_password, create_access_token

def test_hash_password_valid():
    password = "password123"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True

def test_hash_password_invalid():
    password = "password123"
    wrong_password = "salah123"
    hashed = hash_password(password)

    assert verify_password(wrong_password, hashed) is False

def test_create_access_token():
    token = create_access_token(subject="1", extra={"email": "tester@example.com"})

    assert isinstance(token, str)
    assert len(token) > 10
