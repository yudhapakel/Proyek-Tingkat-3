import torch
from torchvision import models, transforms
from PIL import Image
import io

# 1. Load Pre-trained Model (MobileNetV2)
# Baris ini bakal otomatis download bobot (weights) default sekitar 14MB
weights = models.MobileNet_V2_Weights.DEFAULT
model = models.mobilenet_v2(weights=weights)
model.eval() # PENTING: Set model ke mode evaluasi/prediksi, bukan mode belajar

# 2. Setup Transformasi Gambar
# AI itu butuh gambar dengan ukuran dan format matematis yang pas
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def analyze_fish_image(image_bytes: bytes):
    # Convert bytes dari FastAPI jadi gambar PIL
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Proses gambar jadi tensor (angka matematis)
    input_tensor = preprocess(image)
    input_batch = input_tensor.unsqueeze(0) # Tambahin dimensi batch buat PyTorch
    
    # Lempar ke Model AI!
    with torch.no_grad():
        output = model(input_batch)
    
    # Nanti, kalau model Fishight lu udah beres di-training,
    # logic hitung skor aslinya ditaruh di sini.
    # Untuk malam ini, kita balikin dummy data dulu biar API-nya jalan.
    return {
        "status": "Layak",
        "freshness_score": 85.5,
        "eye_score": 90.0,
        "gill_score": 88.0,
        "scale_score": 78.5,
        "recommendation": "Pipeline AI PyTorch nyala! Model berhasil ngebaca gambar."
    }