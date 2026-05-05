# AIFish 🐟

Web app buat identifikasi jenis ikan pakai AI. Upload foto ikan, nanti sistem bakal ngasih tau itu ikan apa.

## Tech Stack

- React + TypeScript
- Vite
- React Router
- Lucide Icons
- CSS (vanilla, no framework)

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
├── assets/            # gambar, logo, dll
├── components/        # komponen reusable (AuthBackground, dll)
├── pages/             # halaman-halaman app
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ForgotPasswordPage.tsx
│   └── AuthPages.css
├── styles/
│   └── index.css      # global styles + design tokens
├── App.tsx            # routing
└── main.tsx           # entry point
```

## Fitur yang Udah Jadi

- [x] Login page
- [x] Register page
- [x] Forgot password page
- [x] Underwater background (seaweed + bubbles animation)
- [x] Responsive design
- [ ] Integrasi backend / Firebase
- [ ] Halaman utama (dashboard)
- [ ] Fish detection (upload + AI)
- [ ] Encyclopedia ikan
- [ ] Scan history

## Notes

- Design pakai tema underwater / ocean
- Glassmorphism card style
- Font: Inter + Outfit (Google Fonts)
- Warna utama: teal/cyan (#14b8a6, #06b6d4)
