<div align="center">

# 🏫 eSantri — Sistem Informasi Manajemen Pesantren
### PP Sulaimaniyah · Pusdatin Digital Platform

**Platform manajemen data santri, akademik, dan operasional pesantren berbasis web yang terintegrasi.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white&style=flat-square)](https://nestjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white&style=flat-square)](https://www.postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)](https://tailwindcss.com)

</div>

---

## 📋 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Struktur Proyek](#-struktur-proyek)
- [Panduan Instalasi](#-panduan-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Level Akses Pengguna](#-level-akses-pengguna)
- [Modul Aplikasi](#-modul-aplikasi)

---

## 🎯 Tentang Aplikasi

**eSantri** adalah Sistem Informasi Manajemen Pesantren (SIMP) yang dikembangkan oleh Pusdatin PP Sulaimaniyah. Sistem ini dirancang untuk mendigitalisasi seluruh proses pengelolaan data santri, administrasi akademik, kepegawaian, absensi, dan pelaporan secara terpusat — mulai dari level cabang, wilayah, hingga pusat.

### Tujuan
- Mengganti pengelolaan data manual (Excel/kertas) dengan sistem digital terintegrasi
- Menyediakan monitoring data santri secara *real-time* dari cabang ke pusat
- Mempercepat proses administrasi akademik dan operasional harian pesantren
- Menjamin akurasi, keamanan, dan ketersediaan data (uptime 99.9%)

---

## ✨ Fitur Utama

### 🔓 Akses Publik (Tanpa Login)
| Fitur | Deskripsi |
|-------|-----------|
| **Landing Page** | Halaman informasi publik eSantri PP Sulaimaniyah |
| **Daftar Ulang Santri** | Portal verifikasi NIK dan pengisian data daftar ulang oleh santri/wali |
| **Kalender Akademik** | Jadwal kegiatan akademik yang dapat diakses publik |
| **Pengumuman** | Pengumuman resmi dari manajemen pesantren |
| **FAQ** | Pertanyaan yang sering diajukan seputar sistem |

### 📊 Dashboard & Analitik
| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Eksekutif** | Ringkasan statistik santri, kehadiran, dan kondisi pesantren |
| **Ketersediaan Guru per Mapel** | Analisis ketersediaan pengajar untuk perencanaan akademik |

### 👤 Manajemen Santri
| Fitur | Deskripsi |
|-------|-----------|
| **Data Siswa** | CRUD lengkap data biodata santri (NIK, asal daerah, domisili, status) |
| **Pool Siswa** | Manajemen arsip santri non-aktif / pool data |
| **Riwayat Perubahan Data** | Audit trail seluruh perubahan data santri |
| **Permintaan Tarik Data** | Alur konfirmasi mutasi dan penarikan data antar cabang |

### 🏫 Manajemen Kelembagaan
| Fitur | Deskripsi |
|-------|-----------|
| **Data Wilayah** | Pengelolaan hierarki wilayah pesantren |
| **Data Cabang** | Detail profil, fasilitas, dan santri per cabang |
| **Profil Cabang** | Halaman profil lengkap cabang |

### 🎓 Akademik (Formal)
| Fitur | Deskripsi |
|-------|-----------|
| **Manajemen Kelas (Rombel)** | Pembentukan rombongan belajar per jenjang dan semester |
| **Manajemen Mata Pelajaran** | Kelola kurikulum, mapel, dan jam pelajaran |
| **Lembaga Muadalah** | Pengelolaan data pendidikan formal muadalah |
| **Data Siswa Muadalah** | Pendataan santri dalam jalur muadalah |
| **Penugasan Guru** | Penetapan guru per mata pelajaran dan rombel |
| **Input Rapor** | Penginputan nilai dan penerbitan rapor santri |
| **Kenaikan Kelas** | Proses kenaikan kelas massal dengan validasi |
| **Pengaturan Akademik** | Konfigurasi tahun ajaran, semester, dan kalender |

### 👨‍🏫 Manajemen Ustadz / Guru
| Fitur | Deskripsi |
|-------|-----------|
| **Data Guru** | Biodata lengkap ustadz/guru per cabang |
| **Pool Guru** | Manajemen arsip ustadz non-aktif |
| **Penugasan Mengajar** | Pemetaan pengajar ke rombel dan mapel |

### 🕐 Absensi
| Fitur | Deskripsi |
|-------|-----------|
| **Absensi Siswa** | Pencatatan kehadiran harian santri per kelas |
| **Kelola Program Absensi** | Konfigurasi skema dan program absensi |
| **Rekapitulasi Absensi** | Laporan kehadiran bulanan/semester |

### 🏗️ Sarana & Prasarana
| Fitur | Deskripsi |
|-------|-----------|
| **Manajemen Fasilitas** | Pendataan fasilitas fisik pesantren |
| **Manajemen Ruang** | Kelola daftar ruangan dan kapasitasnya |

### 📢 Layanan & Bantuan
| Fitur | Deskripsi |
|-------|-----------|
| **Pengumuman** | Kelola dan publikasi pengumuman |
| **Kalender Akademik** | Kelola jadwal kegiatan akademik pesantren |
| **FAQ** | Kelola konten pertanyaan yang sering diajukan |

### ⚙️ Pengaturan Sistem (Admin GLOBAL)
| Fitur | Deskripsi |
|-------|-----------|
| **Manajemen User** | Kelola akun pengguna, hak akses, dan level |
| **Sinkronisasi Data** | Sinkronisasi data antar sistem |
| **Keaktifan Mapel** | Konfigurasi mata pelajaran aktif per periode |
| **Profil Pengguna** | Edit profil dan ganti password |

---

## 🏛️ Arsitektur Sistem

```
┌─────────────────────────────────────────────┐
│              CLIENT (Browser)                │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │   sekolah-app (React + Vite + TS)   │   │
│  │   Port: 3000                         │   │
│  └──────────────┬───────────────────────┘   │
└─────────────────│───────────────────────────┘
                  │ /api/v1/* (Vite Proxy)
                  ▼
┌─────────────────────────────────────────────┐
│         backend-api (NestJS + TS)            │
│         Port: 8080                           │
│                                             │
│  ┌──────────────┐   ┌─────────────────────┐ │
│  │  Controllers │   │  Prisma ORM         │ │
│  │  Services    │──▶│  (Data Layer)       │ │
│  │  Guards/JWT  │   └──────────┬──────────┘ │
│  └──────────────┘              │             │
└───────────────────────────────│─────────────┘
                                ▼
┌─────────────────────────────────────────────┐
│         PostgreSQL Database                  │
│         (edaimi schema)                      │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Teknologi yang Digunakan

### Frontend (`sekolah-app`)
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | 19 | UI Framework |
| TypeScript | 5.8 | Static Typing |
| Vite | 6 | Build Tool & Dev Server |
| TailwindCSS | 4 | Styling |
| React Router | 7 | Client-side Routing |
| TanStack Query | 5 | Server State Management |
| Axios | 1.18 | HTTP Client |
| React Hook Form | 7 | Form Management |
| Lucide React | 0.546 | Icon Library |
| PapaParse | 5.5 | CSV Import/Export |
| SheetJS (xlsx) | 0.18 | Excel Export |
| i18next | 26 | Internasionalisasi |
| Express | 5 | SSR / Static File Server |

### Backend (`backend-api`)
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| NestJS | 11 | Backend Framework |
| TypeScript | 5 | Static Typing |
| Prisma | 7 | ORM & Database Client |
| PostgreSQL | - | Database |
| JWT (jsonwebtoken) | 9 | Autentikasi |
| Bcrypt | 6 | Enkripsi Password |
| Helmet | 8 | Security Headers |
| Swagger | 11 | API Documentation |
| class-validator | 0.15 | DTO Validation |

---

## 📁 Struktur Proyek

```
pusdatin-app/
├── sekolah-app/               # Frontend React App
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/        # Halaman publik (landing, daftar ulang)
│   │   │   ├── auth/          # Autentikasi (login)
│   │   │   ├── dashboard/     # Dashboard & analitik
│   │   │   ├── core/          # Data utama (santri, guru, cabang, wilayah)
│   │   │   ├── formal/        # Akademik formal (kelas, mapel, rapor)
│   │   │   ├── absensi/       # Modul absensi
│   │   │   ├── sarpras/       # Sarana & prasarana
│   │   │   ├── laporan/       # Laporan & rekapitulasi
│   │   │   ├── admin/         # Pengaturan sistem (super admin)
│   │   │   └── umum/          # Halaman umum (FAQ, kalender, pengumuman)
│   │   ├── components/
│   │   │   └── Layout/        # Sidebar, Topbar, Layout utama
│   │   ├── context/           # React Context (auth, dll)
│   │   ├── hooks/             # Custom React hooks
│   │   └── locales/           # File terjemahan i18n
│   ├── server.ts              # Express server (SSR/proxy)
│   ├── vite.config.ts
│   ├── dev.sh                 # Script development
│   └── push.sh                # Script push ke GitHub
│
└── backend-api/               # Backend NestJS
    ├── src/
    │   ├── modules/           # Modul NestJS per fitur
    │   └── main.ts            # Entry point
    └── prisma/
        └── schema/            # Prisma schema (modular)
```

---

## 🚀 Panduan Instalasi

### Prasyarat

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **PostgreSQL** ≥ 14
- **Git**

### Clone Repositori

```bash
git clone https://github.com/kotajakarta/sekolah-app.git
cd sekolah-app
npm install
```

```bash
git clone https://github.com/kotajakarta/backend-api.git
cd backend-api
npm install
```

---

## ⚙️ Konfigurasi Environment

### Frontend (`sekolah-app/.env`)

```env
# URL Backend API
# Kosongkan untuk development lokal (Vite Proxy akan handle /api/v1)
# Isi dengan URL penuh untuk production, contoh: https://api.domain.com/api/v1
VITE_API_BASE_URL=""
```

### Backend (`backend-api/.env`)

```env
# Koneksi database PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# Secret key JWT (ganti dengan nilai acak yang panjang di production)
JWT_SECRET="your-very-secure-random-secret-key"

# Port server backend
PORT=8080

# Prefix API global
API_PREFIX="api/v1"

# Daftar origin yang diizinkan (CORS)
CORS_ORIGINS="http://localhost:3000,https://esantri.domain.com"

# Aktifkan Swagger API Docs (true/false)
ENABLE_SWAGGER="true"
```

---

## ▶️ Menjalankan Aplikasi

### Mode Development

**1. Jalankan Backend API**
```bash
cd backend-api
./dev.sh
# atau: npm run dev
# Server berjalan di http://localhost:8080
# Swagger docs di http://localhost:8080/api/v1/docs
```

**2. Jalankan Frontend**
```bash
cd sekolah-app
./dev.sh
# atau: npm run dev
# Aplikasi berjalan di http://localhost:3000
```

> Vite Proxy secara otomatis meneruskan request `/api/v1/*` dari port 3000 ke backend di port 8080.

### Mode Production

```bash
# Build frontend
cd sekolah-app
npm run build

# Jalankan production server
npm start
# Server berjalan di http://localhost:3000
```

---

## 👥 Level Akses Pengguna

Sistem menggunakan autentikasi berbasis JWT dengan 3 level scope akses:

| Level | Scope | Deskripsi |
|-------|-------|-----------|
| 🔵 **Cabang** | `CABANG` | Akses data hanya pada cabang sendiri (santri, kehadiran, kelas) |
| 🟡 **Wilayah** | `WILAYAH` | Akses seluruh cabang di bawah wilayah, termasuk monitoring lintas cabang |
| 🔴 **Pusat / Global** | `GLOBAL` | Super Admin — akses penuh ke semua data, konfigurasi sistem, dan manajemen user |

---

## 📦 Modul Aplikasi

### Ringkasan Rute Frontend

| Rute | Modul | Akses |
|------|-------|-------|
| `/` | Landing Page | Publik |
| `/daftar-ulang` | Portal Daftar Ulang | Publik |
| `/login` | Halaman Login | Publik |
| `/dashboard` | Dashboard Utama | Semua level |
| `/core/siswa` | Data Santri | Semua level |
| `/core/guru` | Data Guru | Semua level |
| `/core/cabang` | Data Cabang | WILAYAH, GLOBAL |
| `/core/wilayah` | Data Wilayah | GLOBAL |
| `/formal/kelas` | Rombongan Belajar | Semua level |
| `/formal/mapel` | Mata Pelajaran | Semua level |
| `/formal/muadalah` | Lembaga Muadalah | Semua level |
| `/formal/rapor` | Input Rapor | Semua level |
| `/absensi/siswa` | Absensi Santri | Semua level |
| `/laporan/absensi` | Rekap Absensi | Semua level |
| `/sarpras/fasilitas` | Manajemen Fasilitas | Semua level |
| `/settings/users` | Manajemen User | GLOBAL |
| `/settings/akademik` | Pengaturan Akademik | GLOBAL |

---

## 📞 Kontak & Dukungan

| | |
|--|--|
| **Institusi** | PP Sulaimaniyah — Pusdatin |
| **Email** | info@sulaimaniyah.sch.id |
| **Telepon** | 0813-1415-1420 |
| **Website** | https://esantri.yts.sch.id |

---

<div align="center">

© 2025 eSantri PP Sulaimaniyah. Dikembangkan oleh **Tim Pusdatin**.

</div>
