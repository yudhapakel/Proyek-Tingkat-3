import io
import os
from pathlib import Path
from typing import Any

from PIL import Image

try:
    import torch
    from torchvision import models, transforms
except Exception:  # pragma: no cover - optional heavy AI dependency
    torch = None
    models = None
    transforms = None

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MODEL_PATH = PROJECT_ROOT / "backend" / "models" / "fish_quality_mobilenetv2.pt"
MODEL_PATH = Path(os.getenv("FISIGHT_AI_MODEL_PATH", DEFAULT_MODEL_PATH))
DEFAULT_CLASS_NAMES = ["Buruk", "Sedang", "Baik"]

_model = None
_preprocess = None
_class_names: list[str] = DEFAULT_CLASS_NAMES
_model_source = "heuristic"


def _build_mobilenet_classifier(num_classes: int):
    if models is None:
        return None

    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, num_classes)
    return model


def _load_custom_model():
    global _model, _preprocess, _class_names, _model_source
    if torch is None or models is None or transforms is None:
        return None, None
    if not MODEL_PATH.exists():
        return None, None

    if _model is None or _preprocess is None or _model_source != "custom":
        checkpoint: dict[str, Any] = torch.load(MODEL_PATH, map_location="cpu")
        class_names = checkpoint.get("class_names", DEFAULT_CLASS_NAMES)
        model = _build_mobilenet_classifier(len(class_names))
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()

        _model = model
        _class_names = list(class_names)
        _model_source = "custom"
        _preprocess = transforms.Compose(
            [
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )
    return _model, _preprocess


def _estimate_quality_scores(image: Image.Image) -> dict[str, float]:
    """Fallback heuristic so scan flow still works before a trained model exists."""
    rgb = image.convert("RGB").resize((128, 128))
    pixels = list(rgb.getdata())
    total = len(pixels)

    avg_r = sum(pixel[0] for pixel in pixels) / total
    avg_g = sum(pixel[1] for pixel in pixels) / total
    avg_b = sum(pixel[2] for pixel in pixels) / total
    brightness = (avg_r + avg_g + avg_b) / 3
    color_balance = 100 - min(abs(avg_r - avg_g) + abs(avg_g - avg_b), 100)

    freshness_score = max(45, min(95, brightness / 255 * 55 + color_balance * 0.4))
    eye_score = max(40, min(95, freshness_score + 4))
    gill_score = max(40, min(95, freshness_score + (avg_r - avg_b) / 20))
    scale_score = max(40, min(95, color_balance))
    overall_score = (freshness_score + eye_score + gill_score + scale_score) / 4

    return {
        "freshness_score": round(freshness_score, 2),
        "eye_score": round(eye_score, 2),
        "gill_score": round(gill_score, 2),
        "scale_score": round(scale_score, 2),
        "overall_score": round(overall_score, 2),
    }


def _status_recommendation(status: str) -> str:
    if status == "Baik":
        return "Ikan layak dipasarkan. Tetap simpan pada suhu dingin agar kualitas terjaga."
    if status == "Sedang":
        return "Ikan masih dapat diproses, tetapi perlu penanganan cepat dan penyimpanan dingin."
    return "Kualitas ikan rendah. Perlu pemeriksaan manual sebelum dipasarkan."


def _status_from_score(overall_score: float) -> str:
    if overall_score >= 75:
        return "Baik"
    if overall_score >= 60:
        return "Sedang"
    return "Buruk"


def _score_from_status(status: str, confidence: float, heuristic_score: float) -> float:
    """Convert classifier output into a stable 0-100 score for the existing API."""
    base_scores = {
        "Buruk": 45.0,
        "Sedang": 67.5,
        "Baik": 85.0,
    }
    base = base_scores.get(status, heuristic_score)
    # Blend class anchor with heuristic visual score so output remains meaningful for UI metrics.
    blended = (base * 0.72) + (heuristic_score * 0.28)
    confidence_adjustment = (confidence - 0.5) * 8
    return round(max(0, min(100, blended + confidence_adjustment)), 2)


def _analyze_with_custom_model(image: Image.Image, heuristic_scores: dict[str, float]) -> dict[str, Any] | None:
    model, preprocess = _load_custom_model()
    if model is None or preprocess is None or torch is None:
        return None

    input_tensor = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        output = model(input_tensor)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, predicted_idx = torch.max(probabilities, dim=0)

    confidence_score = float(confidence.item())
    status = _class_names[int(predicted_idx.item())]
    overall_score = _score_from_status(status, confidence_score, heuristic_scores["overall_score"])

    # Keep detailed metric fields available for the current frontend. The trained classifier
    # predicts overall quality class; detailed sub-scores are estimated from image statistics.
    detailed_scores = {
        "freshness_score": round((heuristic_scores["freshness_score"] * 0.55) + (overall_score * 0.45), 2),
        "eye_score": round((heuristic_scores["eye_score"] * 0.55) + (overall_score * 0.45), 2),
        "gill_score": round((heuristic_scores["gill_score"] * 0.55) + (overall_score * 0.45), 2),
        "scale_score": round((heuristic_scores["scale_score"] * 0.55) + (overall_score * 0.45), 2),
    }

    return {
        "fish_type": "Ikan",
        "status": status,
        "confidence_score": round(confidence_score, 4),
        "overall_score": overall_score,
        "recommendation": _status_recommendation(status),
        "model_used": "fish_quality_mobilenetv2",
        **detailed_scores,
    }


def analyze_fish_image(image_bytes: bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    heuristic_scores = _estimate_quality_scores(image)

    model_result = _analyze_with_custom_model(image, heuristic_scores)
    if model_result is not None:
        return model_result

    overall_score = heuristic_scores["overall_score"]
    status = _status_from_score(overall_score)

    return {
        "fish_type": "Ikan",
        "status": status,
        "confidence_score": 0.75,
        "freshness_score": heuristic_scores["freshness_score"],
        "eye_score": heuristic_scores["eye_score"],
        "gill_score": heuristic_scores["gill_score"],
        "scale_score": heuristic_scores["scale_score"],
        "overall_score": overall_score,
        "recommendation": _status_recommendation(status),
        "model_used": "heuristic_fallback",
    }
