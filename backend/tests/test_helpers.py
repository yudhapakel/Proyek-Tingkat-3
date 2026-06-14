import pytest
from fastapi import HTTPException, UploadFile
from io import BytesIO

from backend.app.main import _infer_fish_type, _validate_image


def test_infer_fish_type():
    assert _infer_fish_type("gurame_goreng.jpg") == "Ikan Gurame"
    assert _infer_fish_type("mujair_bakar.png") == "Ikan Mujaer"
    assert _infer_fish_type("tongkol_sarden.webp") == "Ikan Tongkol"
    assert _infer_fish_type("random_fish.jpg") == "Ikan"
    assert _infer_fish_type(None) == "Ikan"


def test_validate_image_valid():
    mock_file = UploadFile(
        file=BytesIO(b"dummy"),
        filename="test.jpg",
        headers={"content-type": "image/jpeg"},
    )
    _validate_image(mock_file)


def test_validate_image_invalid():
    mock_file = UploadFile(
        file=BytesIO(b"dummy"),
        filename="test.pdf",
        headers={"content-type": "application/pdf"},
    )
    with pytest.raises(HTTPException) as exc_info:
        _validate_image(mock_file)
    assert exc_info.value.status_code == 400
    assert "Format gambar tidak didukung" in exc_info.value.detail
