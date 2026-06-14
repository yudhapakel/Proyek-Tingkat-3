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
DEFAULT_SPECIES_MODEL_PATH = PROJECT_ROOT / "backend" / "models" / "fish_species_mobilenetv2.pt"
MODEL_PATH = Path(os.getenv("FISIGHT_AI_MODEL_PATH", DEFAULT_MODEL_PATH))
SPECIES_MODEL_PATH = Path(os.getenv("FISIGHT_SPECIES_MODEL_PATH", DEFAULT_SPECIES_MODEL_PATH))
DEFAULT_CLASS_NAMES = ["buruk", "sedang", "baik"]
LOW_CONFIDENCE_THRESHOLD = float(os.getenv("FISIGHT_LOW_CONFIDENCE_THRESHOLD", "0.65"))
NON_FISH_TOP1_REJECT_THRESHOLD = float(os.getenv("FISIGHT_NON_FISH_TOP1_REJECT_THRESHOLD", "0.45"))
NON_FISH_PROB_ALLOW_THRESHOLD = float(os.getenv("FISIGHT_NON_FISH_PROB_ALLOW_THRESHOLD", "0.05"))
LOW_CONFIDENCE_FISH_PROB_REJECT_THRESHOLD = float(os.getenv("FISIGHT_LOW_CONFIDENCE_FISH_PROB_REJECT_THRESHOLD", "0.08"))

_model = None
_preprocess = None
_class_names: list[str] = DEFAULT_CLASS_NAMES
_model_source = "heuristic"
_imagenet_model = None
_imagenet_preprocess = None
_imagenet_categories: list[str] = []
_species_model = None
_species_preprocess = None
_species_class_names: list[str] = []

FISH_IMAGENET_KEYWORDS = {
    "fish",
    "shark",
    "ray",
    "eel",
    "salmon",
    "tuna",
    "trout",
    "sturgeon",
    "gar",
    "puffer",
    "lionfish",
    "goldfish",
    "tench",
    "coho",
    "barracouta",
    "bass",
    "snapper",
    "grouper",
    "cod",
    "sardine",
    "mackerel",
    "anchovy",
    "flounder",
}


def _build_mobilenet_classifier(num_classes: int):
    if models is None:
        return None

    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = torch.nn.Linear(in_features, num_classes)
    return model




def _load_imagenet_model():
    """Load cached ImageNet MobileNetV2 for a lightweight fish/non-fish sanity check."""
    global _imagenet_model, _imagenet_preprocess, _imagenet_categories
    if torch is None or models is None:
        return None, None, []

    if _imagenet_model is None or _imagenet_preprocess is None:
        try:
            weights = models.MobileNet_V2_Weights.DEFAULT
            _imagenet_model = models.mobilenet_v2(weights=weights)
            _imagenet_model.eval()
            _imagenet_preprocess = weights.transforms()
            _imagenet_categories = list(weights.meta.get("categories", []))
        except Exception:
            return None, None, []

    return _imagenet_model, _imagenet_preprocess, _imagenet_categories


def _is_fish_label(label: str) -> bool:
    normalized = label.lower().replace("_", " ").replace("-", " ")
    return any(keyword in normalized for keyword in FISH_IMAGENET_KEYWORDS)


def _validate_fish_like_image(image: Image.Image, custom_confidence: float | None = None) -> dict[str, Any]:
    """Reject obvious non-fish uploads without blocking unclear real fish photos.

    The production-quality solution is a dedicated fish-vs-non-fish detector. For
    the MVP/demo, this guard uses a cached ImageNet MobileNetV2 only to reject
    obvious non-fish cases (car/logo/etc.). If the validator is unavailable or
    uncertain, it allows the image so the quality model can still run.
    """
    model, preprocess, categories = _load_imagenet_model()
    if model is None or preprocess is None or not categories:
        return {"is_valid_fish": True, "fish_validation_score": None, "fish_validation_labels": []}

    input_tensor = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        probabilities = torch.nn.functional.softmax(model(input_tensor)[0], dim=0)
        top_probabilities, top_indices = torch.topk(probabilities, 10)

    labels = [categories[int(index.item())] for index in top_indices]
    scores = [float(probability.item()) for probability in top_probabilities]
    fish_probability = sum(score for label, score in zip(labels, scores) if _is_fish_label(label))
    top_label = labels[0]
    top_score = scores[0]
    top_is_fish = _is_fish_label(top_label)

    obvious_non_fish = (
        not top_is_fish
        and top_score >= NON_FISH_TOP1_REJECT_THRESHOLD
        and fish_probability < NON_FISH_PROB_ALLOW_THRESHOLD
    )
    uncertain_non_fish = (
        custom_confidence is not None
        and custom_confidence < LOW_CONFIDENCE_THRESHOLD
        and fish_probability < LOW_CONFIDENCE_FISH_PROB_REJECT_THRESHOLD
        and not top_is_fish
    )

    if obvious_non_fish or uncertain_non_fish:
        return {
            "is_valid_fish": False,
            "fish_validation_score": round(fish_probability, 4),
            "fish_validation_labels": labels[:5],
            "validation_message": "Gambar tidak cukup terdeteksi sebagai ikan. Upload foto ikan yang jelas.",
        }

    return {
        "is_valid_fish": True,
        "fish_validation_score": round(fish_probability, 4),
        "fish_validation_labels": labels[:5],
    }



def _load_species_model():
    global _species_model, _species_preprocess, _species_class_names
    if torch is None or models is None or transforms is None:
        return None, None
    if not SPECIES_MODEL_PATH.exists():
        return None, None

    if _species_model is None or _species_preprocess is None:
        checkpoint: dict[str, Any] = torch.load(SPECIES_MODEL_PATH, map_location="cpu")
        class_names = checkpoint.get("class_names", [])
        model = _build_mobilenet_classifier(len(class_names))
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()

        _species_model = model
        _species_class_names = list(class_names)
        _species_preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    return _species_model, _species_preprocess


def _format_species_name(label: str) -> str:
    normalized = label.strip().lower().replace("_", " ").replace("-", " ")
    names = {
        "mujair": "Ikan Mujair",
        "nila": "Ikan Mujair",
        "tilapia": "Ikan Mujair",
        "gurame": "Ikan Gurame",
        "gurami": "Ikan Gurame",
        "gourami": "Ikan Gurame",
        "tongkol": "Ikan Tongkol",
        "tuna": "Ikan Tongkol",
    }
    return names.get(normalized, f"Ikan {label.strip().title()}" if label else "Ikan")


def _predict_fish_species(image: Image.Image) -> dict[str, Any]:
    model, preprocess = _load_species_model()
    if model is None or preprocess is None or torch is None:
        return {"fish_type": "Ikan", "species_confidence_score": None, "species_model_used": None}

    input_tensor = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        output = model(input_tensor)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, predicted_idx = torch.max(probabilities, dim=0)

    raw_label = _species_class_names[int(predicted_idx.item())]
    return {
        "fish_type": _format_species_name(raw_label),
        "species_confidence_score": round(float(confidence.item()), 4),
        "species_model_used": "fish_species_mobilenetv2",
    }


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


def _normalize_status(label: str) -> str:
    normalized = label.strip().lower().replace("_", "-").replace(" ", "-")
    if normalized in {"baik", "fresh", "segar", "layak"}:
        return "Baik"
    if normalized in {"sedang", "medium", "cukup"}:
        return "Sedang"
    if normalized in {"buruk", "nonfresh", "non-fresh", "not-fresh", "tidak-segar", "busuk"}:
        return "Buruk"
    return label.strip().title() or "Tidak diketahui"


def _status_recommendation(status: str, *, low_confidence: bool = False) -> str:
    canonical_status = _normalize_status(status)
    if canonical_status == "Baik":
        return "Kualitas ikan tergolong baik. Ikan layak dipasarkan. Tetap simpan pada suhu dingin agar kualitas terjaga."
    if canonical_status == "Sedang":
        return "Kualitas ikan tergolong sedang. Ikan masih dapat diproses, tetapi perlu penanganan cepat dan penyimpanan dingin."
    return "Kualitas ikan rendah/buruk. Perlu pemeriksaan manual sebelum dipasarkan."


def _status_from_score(overall_score: float) -> str:
    # Keep backend status thresholds aligned with the frontend badges/gauge.
    if overall_score >= 70:
        return "Baik"
    if overall_score >= 40:
        return "Sedang"
    return "Buruk"


def _score_from_status(status: str, confidence: float, heuristic_score: float) -> float:
    """Convert classifier output into a stable 0-100 score for the existing API."""
    canonical_status = _normalize_status(status)
    base_scores = {
        "Buruk": 45.0,
        "Sedang": 67.5,
        "Baik": 85.0,
    }
    base = base_scores.get(canonical_status, heuristic_score)
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
    fish_validation = _validate_fish_like_image(image, custom_confidence=confidence_score)
    if not fish_validation.get("is_valid_fish", True):
        return fish_validation

    raw_status = _class_names[int(predicted_idx.item())]
    predicted_status = _normalize_status(raw_status)
    low_confidence = confidence_score < LOW_CONFIDENCE_THRESHOLD
    if low_confidence:
        # When the classifier is unsure, prefer the visual/heuristic score so the
        # overall label stays consistent with the detailed metrics shown in the UI.
        overall_score = heuristic_scores["overall_score"]
    else:
        overall_score = _score_from_status(predicted_status, confidence_score, heuristic_scores["overall_score"])
    status = _status_from_score(overall_score)

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
        "recommendation": _status_recommendation(status, low_confidence=low_confidence),
        "model_used": "fish_quality_mobilenetv2",
        **fish_validation,
        **detailed_scores,
    }


def analyze_fish_image(image_bytes: bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    heuristic_scores = _estimate_quality_scores(image)
    species_result = _predict_fish_species(image)

    model_result = _analyze_with_custom_model(image, heuristic_scores)
    if model_result is not None:
        if model_result.get("is_valid_fish", True):
            model_result.update(species_result)
        return model_result

    fish_validation = _validate_fish_like_image(image)
    if not fish_validation.get("is_valid_fish", True):
        return fish_validation

    overall_score = heuristic_scores["overall_score"]
    status = _status_from_score(overall_score)

    return {
        "fish_type": species_result.get("fish_type", "Ikan"),
        "status": status,
        "confidence_score": 0.75,
        "freshness_score": heuristic_scores["freshness_score"],
        "eye_score": heuristic_scores["eye_score"],
        "gill_score": heuristic_scores["gill_score"],
        "scale_score": heuristic_scores["scale_score"],
        "overall_score": overall_score,
        "recommendation": _status_recommendation(status),
        "model_used": "heuristic_fallback",
        **species_result,
        **fish_validation,
    }
