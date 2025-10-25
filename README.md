```
/
├── src/
│   ├── app/
│   │   ├── (auth)/                # Grup Rute untuk Login/Register (Layout beda)
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # UI Halaman Login
│   │   │   └── register/
│   │   │       └── page.tsx       # UI Halaman Register
│   │   │
│   │   ├── (app)/                 # Grup Rute untuk Halaman Terproteksi
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # UI Halaman Dashboard
│   │   │   │
│   │   │   ├── leads/             # (Ini untuk nanti)
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── layout.tsx         # Layout utama (Navbar, Sidebar)
│   │   │
│   │   ├── api/                   # === Folder Backend API kita ===
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts   # Endpoint: POST /api/auth/login
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts   # Endpoint: POST /api/auth/logout
│   │   │   │   ├── me/
│   │   │   │   │   └── route.ts   # Endpoint: GET /api/auth/me
│   │   │   │   └── register/
│   │   │   │       └── route.ts   # Endpoint: POST /api/auth/register
│   │   │   │
│   │   │   └── leads/             # (Ini untuk nanti)
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx             # Root Layout (<html>, <body>)
│   │   ├── page.tsx               # === Homepage Publik (Landing Page) ===
│   │   └── globals.css
│   │
│   ├── components/                # Komponen UI (Button, Input, Card)
│   │   └── ...
│   │
│   ├── lib/                       # === Folder Alat Bantu / Helpers ===
│   │   ├── auth.ts                # (Fungsi signJwt, verifyJwt, hashPassword)
│   │   └── db.ts                  # (Koneksi PrismaClient)
│   │
│   └── middleware.ts              # === "Satpam" Keamanan JWT ===
│
├── prisma/                        # Folder Prisma
│   ├── migrations/                # (Hasil migrasi otomatis)
│   └── schema.prisma              # (Cetak biru database: model User)
│
├── public/                        # Aset statis (gambar, ikon)
│
├── .env                           # === File Rahasia (PENTING) ===
├── .gitignore
├── next.config.mjs
├── package.json
└── tsconfig.json
```
