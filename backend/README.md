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

AI engine sekarang mendukung dua mode:

1. `fish_quality_mobilenetv2` — model custom hasil training dari `backend/ml/train_fish_quality.py` jika file `backend/models/fish_quality_mobilenetv2.pt` tersedia.
2. `heuristic_fallback` — fallback ringan agar flow scan tetap berjalan saat dependency AI/model belum tersedia.

Pipeline training dan struktur dataset ada di `backend/ml/README.md`. Ringkasnya:

```bash
.venv/bin/python -m pip install -r backend/requirements-ai.txt
.venv/bin/python backend/ml/train_fish_quality.py \
  --data-dir backend/datasets/fish_quality \
  --output backend/models/fish_quality_mobilenetv2.pt \
  --epochs 8 \
  --batch-size 16 \
  --freeze-backbone
```

Dataset perlu diletakkan pada folder `backend/datasets/fish_quality/baik`, `sedang`, dan `buruk`. File model dan gambar dataset tidak ikut di-commit; hanya struktur folder dan script training yang disimpan di repo.

## Catatan Database

Backend punya migrasi ringan untuk menambahkan kolom baru pada tabel `fish_analysis_history` di database lokal lama. Untuk reset total saat development:

```bash
docker compose down -v
docker compose up -d db
```
