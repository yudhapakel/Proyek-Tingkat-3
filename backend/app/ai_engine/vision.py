import io

from PIL import Image

try:
    import torch
    from torchvision import models, transforms
except Exception:  # pragma: no cover - optional heavy AI dependency
    torch = None
    models = None
    transforms = None

_model = None
_preprocess = None


def _load_model():
    global _model, _preprocess
    if torch is None or models is None or transforms is None:
        return None, None
    if _model is None or _preprocess is None:
        weights = models.MobileNet_V2_Weights.DEFAULT
        _model = models.mobilenet_v2(weights=weights)
        _model.eval()
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
    """Simple heuristic sementara agar output MVP tidak random sepenuhnya."""
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


def _model_confidence(image: Image.Image) -> float:
    model, preprocess = _load_model()
    if model is None or preprocess is None or torch is None:
        return 0.75

    input_tensor = preprocess(image)
    input_batch = input_tensor.unsqueeze(0)

    with torch.no_grad():
        output = model(input_batch)
        return float(torch.nn.functional.softmax(output[0], dim=0).max().item())


def analyze_fish_image(image_bytes: bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    scores = _estimate_quality_scores(image)
    overall_score = scores["overall_score"]

    if overall_score >= 75:
        status = "Baik"
        recommendation = "Ikan layak dipasarkan. Tetap simpan pada suhu dingin agar kualitas terjaga."
    elif overall_score >= 60:
        status = "Sedang"
        recommendation = "Ikan masih dapat diproses, tetapi perlu penanganan cepat dan penyimpanan dingin."
    else:
        status = "Buruk"
        recommendation = "Kualitas ikan rendah. Perlu pemeriksaan manual sebelum dipasarkan."

    return {
        "fish_type": "Ikan",
        "status": status,
        "confidence_score": round(_model_confidence(image), 4),
        "freshness_score": scores["freshness_score"],
        "eye_score": scores["eye_score"],
        "gill_score": scores["gill_score"],
        "scale_score": scores["scale_score"],
        "overall_score": overall_score,
        "recommendation": recommendation,
    }
