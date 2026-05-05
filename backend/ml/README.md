# Fisight AI Training Pipeline

Folder ini berisi pipeline awal untuk melatih model klasifikasi kualitas ikan.

## Target Model

Model saat ini memakai transfer learning `MobileNetV2` untuk klasifikasi 3 kelas:

- `baik`
- `sedang`
- `buruk`

Backend `/scan` akan otomatis memakai model hasil training jika file berikut tersedia:

```text
backend/models/fish_quality_mobilenetv2.pt
```

Jika model belum ada atau dependency AI belum terpasang, backend tetap memakai `heuristic_fallback` agar flow aplikasi tidak rusak.

## Struktur Dataset

Masukkan gambar berlabel ke folder berikut:

```text
backend/datasets/fish_quality/
  baik/
    ikan_001.jpg
    ikan_002.jpg
  sedang/
    ikan_101.jpg
  buruk/
    ikan_201.jpg
```

Format gambar yang disarankan: JPG, JPEG, PNG, atau WebP.

## Rekomendasi Jumlah Data

Untuk proof-of-concept kelas/proyek:

- minimal: 20-30 gambar per kelas
- lebih baik: 100+ gambar per kelas
- ideal: data diambil dari kondisi nyata distribusi ikan yang mirip dengan use case Fisight

Dataset kecil tetap bisa dipakai untuk demo pipeline, tapi akurasinya belum bisa dianggap kuat.

## Install Dependency AI

Dari root repo:

```bash
.venv/bin/python -m pip install -r backend/requirements-ai.txt
```

Jika storage/laptop berat, install ini hanya saat mau training/inference model.

## Training

```bash
.venv/bin/python backend/ml/train_fish_quality.py \
  --data-dir backend/datasets/fish_quality \
  --output backend/models/fish_quality_mobilenetv2.pt \
  --epochs 8 \
  --batch-size 16 \
  --freeze-backbone
```

Output training:

```text
backend/models/fish_quality_mobilenetv2.pt
backend/models/fish_quality_mobilenetv2.json
```

## Inference di Backend

Setelah model `.pt` tersedia, jalankan backend seperti biasa:

```bash
.venv/bin/uvicorn backend.app.main:app --reload
```

Endpoint `/scan` akan:

1. menerima upload gambar,
2. mencoba load model custom,
3. menjalankan inference kualitas ikan,
4. menyimpan hasil ke database history.

Untuk memakai path model lain:

```bash
FISIGHT_AI_MODEL_PATH=/path/to/model.pt .venv/bin/uvicorn backend.app.main:app --reload
```

## Catatan Penting

Model ini adalah fondasi awal. Agar klaim “AI beneran” lebih kuat, tim perlu menyiapkan dataset berlabel dan melaporkan metrik training/validasi dari file JSON metadata.
