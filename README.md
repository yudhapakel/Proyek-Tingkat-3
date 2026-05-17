# Fisight 🐟

Web app untuk identifikasi jenis dan kualitas ikan menggunakan AI. Upload foto ikan, sistem akan mengidentifikasi spesies dan menganalisis kualitas kesegaran secara otomatis.

## Tech Stack

- React + TypeScript
- Vite
- React Router
- Lucide Icons
- CSS (vanilla, no framework)
- html2canvas (download hasil)

## Cara Jalanin

```bash
# install dependencies
npm install

# jalanin dev server
npm run dev
```

Buka `http://localhost:5173` di browser.

## Struktur Folder

```
src/
├── assets/                # gambar, logo, ikan samples
│   ├── fish-eye-logo.png
│   ├── fresh-fish.png
│   ├── underwater-hero-bg.png
│   ├── ikan-tuna.png
│   ├── ikan-hiu.png
│   └── ikan-salmon.png
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx     # navigasi adaptif (dark/light theme)
│   │   ├── Navbar.css
│   │   ├── Footer.tsx
│   │   └── Footer.css
│   ├── AuthBackground.tsx # underwater animated background
│   └── AuthBackground.css
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── DashboardPage.tsx  # landing page / beranda
│   ├── DashboardPage.css
│   ├── ScanPage.tsx       # upload, scan AI, hasil analisis
│   ├── ScanPage.css
│   ├── RiwayatPage.tsx    # riwayat scan
│   ├── RiwayatPage.css
│   └── AuthPages.css
├── styles/
│   └── index.css          # global styles + design tokens
├── App.tsx                # routing
└── main.tsx               # entry point
```

## Halaman & Routing

| Route | Halaman | Deskripsi |
|-------|---------|-----------|
| `/dashboard` | Beranda | Landing page dengan hero, fitur, CTA |
| `/scan` | Scan Ikan | Upload foto, validasi, scan AI, hasil analisis |
| `/riwayat` | Riwayat | Daftar riwayat scan dengan search & filter |
| `/login` | Login | Halaman login |
| `/register` | Register | Halaman registrasi |
| `/forgot-password` | Lupa Password | Reset password |

## Fitur

### ✅ Sudah Jadi

- [x] **Autentikasi** — Login, register, forgot password dengan underwater animated background
- [x] **Dashboard** — Landing page dengan hero section, fitur highlights, CTA
- [x] **Navbar Adaptif** — Otomatis dark/light theme sesuai section background
- [x] **Scan Ikan (Upload)**
  - Upload max 4 foto (drag & drop / klik)
  - Preview grid dengan tombol hapus
  - Support JPG, PNG, WEBP
- [x] **Validasi Kesamaan Ikan**
  - AI validasi apakah foto yang diupload ikan yang sama
  - ⚠️ Warning jika sedikit berbeda (user bisa tetap scan)
  - ❌ Reject jika sangat berbeda (harus ganti foto)
- [x] **Loading State Scan**
  - Full-screen overlay dengan spinner + ikon ikan
  - Thumbnail preview dengan scan-line animation
  - Step indicator (Upload → Analisis → Hasil)
  - Progress bar dengan shimmer effect
- [x] **Hasil Analisis**
  - Identifikasi nama/jenis ikan (AI)
  - Skor kualitas keseluruhan (circular gauge)
  - 4 detail kategori: Kesegaran Umum, Kondisi Mata, Sisik, Insang
  - Setiap kategori: skor, status (Baik/Sedang/Buruk), progress bar, deskripsi
- [x] **Unduh Hasil** — Download hasil sebagai gambar PNG (Canvas API)
- [x] **Bagikan** — Web Share API (mobile) / copy clipboard (desktop)
- [x] **Riwayat Scan**
  - Search berdasarkan nama ikan
  - Filter: Semua / Baik / Sedang / Buruk
  - Card grid dengan gambar, skor, status
  - Klik card → lihat detail hasil analisis
- [x] **Responsive Design** — Semua halaman responsive mobile/desktop

### 🔲 Belum (Backend)

- [ ] Integrasi backend AI (identifikasi spesies + analisis kualitas)
- [ ] Validasi kesamaan ikan via AI (image similarity)
- [ ] Simpan riwayat scan ke database
- [ ] Autentikasi backend (login/register)
- [ ] Halaman artikel / encyclopedia ikan
- [ ] Halaman profil user

## Integrasi Backend

Frontend sudah siap terima response API. Format yang diharapkan:

### POST `/api/scan` — Scan Ikan

**Request:** `multipart/form-data` dengan field `images` (1-4 file gambar)

**Response:**
```json
{
  "fishName": "Ikan Tuna",
  "overallScore": 89,
  "quality": "Kualitas Baik",
  "summary": "Ikan Tuna memiliki kualitas baik secara keseluruhan",
  "details": [
    { "label": "Kesegaran Umum", "score": 89, "status": "Baik", "desc": "..." },
    { "label": "Kondisi Mata", "score": 90, "status": "Baik", "desc": "..." },
    { "label": "Kondisi Sisik", "score": 68, "status": "Sedang", "desc": "..." },
    { "label": "Kondisi Insang", "score": 93, "status": "Baik", "desc": "..." }
  ]
}
```

### POST `/api/validate` — Validasi Kesamaan Ikan

**Request:** `multipart/form-data` dengan field `images`

**Response:**
```json
{
  "valid": true,
  "warning": false,
  "message": "Semua foto merupakan ikan yang sama"
}
```

## Notes

- Design pakai tema underwater / deep sea
- Glassmorphism card style
- Font: Inter + Outfit (Google Fonts)
- Warna utama: Teal (#14b8a6), Cyan (#22d3ee), Deep Sea (#0c1222)
- Navbar adaptif menggunakan `data-nav-theme` attribute per section
- Semua data saat ini mock — ganti `generateMockResult()` dan `setTimeout` dengan API call
