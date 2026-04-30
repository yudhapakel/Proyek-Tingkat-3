# Fisight Backend

Backend API untuk Sistem Identifikasi Kualitas Ikan untuk Distributor Perikanan.

## Stack

- FastAPI
- SQLAlchemy
- MySQL via Docker Compose
- AI engine Python/Pillow dengan optional PyTorch/Torchvision

## Setup Local

```bash
cd backend
cp .env.example .env
cd ..
docker compose up -d db
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
# optional untuk eksperimen model AI yang lebih berat:
# pip install -r backend/requirements-ai.txt
uvicorn backend.app.main:app --reload
```

API docs tersedia di:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/health

## Endpoint MVP

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`

### Analisis Ikan

- `POST /scan` — upload gambar ikan, jalankan AI engine, simpan hasil analisis
- `GET /analysis/history` — riwayat analisis user login
- `GET /analysis/{analysis_id}` — detail analisis
- `DELETE /analysis/{analysis_id}` — hapus riwayat analisis

## Catatan AI MVP

AI engine saat ini memakai heuristic kualitas gambar agar flow backend/frontend bisa jalan dulu. Jika dependency `torch` dan `torchvision` tersedia, backend dapat memakai MobileNetV2 sebagai validasi pipeline inference. Model khusus kualitas ikan bisa diganti di `backend/app/ai_engine/vision.py`.

## Catatan Database

Backend punya migrasi ringan untuk menambahkan kolom baru pada tabel `fish_analysis_history` di database lokal lama. Untuk reset total saat development:

```bash
docker compose down -v
docker compose up -d db
```
