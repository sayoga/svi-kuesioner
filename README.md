# 🚀 Portal Survei & Analitik SHARING VISION™

Platform manajemen kuesioner dan pengumpulan data terintegrasi berstandar *enterprise*. Dibangun untuk mempercepat proses riset pasar, evaluasi internal, dan pengumpulan umpan balik tanpa bergantung pada platform pihak ketiga.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore_&_Auth-FFCA28?logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v3-38B2AC?logo=tailwind-css)

---

## 📑 Daftar Dokumen Inti (Vibecoding Rules)
Untuk panduan pengembangan lebih lanjut, silakan baca dokumen berikut:
- [Product Requirements Document (PRD)](./PRD.md)
- [Design System & UI Guidelines](./Design_System.md)
- [System Architecture](./Architecture.md)
- [AI Subagent Workflow](./Agents.md)

---

## 🚀 Quick Start (Local Development)

1. **Clone Repository:**
   ```bash
   git clone [URL_REPO_ANDA]
   cd portal-survei
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Setup Environment Variables:**
   Buat file `.env.local` di *root folder* dan isi kredensial Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="..."
   ```
4. **Jalankan Server:**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di *browser*.

---

## 👨‍💼 PANDUAN PENGGUNA (USER MANUAL)
*Ditujukan untuk Administrator (Tim HR, Riset, Manajemen) yang menggunakan portal secara harian.*

### 1. Cara Mengakses Portal Admin
1. Buka tautan utama portal survei.
2. Klik tombol **"Masuk Admin"** di pojok kanan atas.
3. Masukkan **Email Admin** dan **Password** yang telah diberikan oleh tim IT.
4. Jika berhasil, Anda akan langsung dialihkan ke **Dashboard Analitik**.

### 2. Menggunakan Dashboard Analitik
Dashboard menggunakan antarmuka *Bento Box* (grid modern) untuk memudahkan pembacaan data.
- **Pilih Kuesioner**: Gunakan *dropdown* di sudut kiri atas layar untuk berpindah antar kuesioner. Semua grafik akan otomatis menyesuaikan.
- **Tampilan Tema**: Klik ikon ☀️/🌙 di pojok kanan atas untuk mengubah tampilan menjadi *Light Mode* (Terang) atau *Dark Mode* (Gelap).
- **Masukan Terbaru**: Panel di kanan bawah menampilkan ringkasan masukan/teks esai terbaru dari responden.

### 3. Ekspor Data (Download Laporan)
1. Pastikan Anda berada di halaman kuesioner yang ingin diunduh.
2. Pada kartu metrik "Status Survei", klik tombol **"Siap Diekspor (CSV)"**.
3. File `.csv` akan otomatis terunduh berisi rekapan mentah jawaban responden.

---

## 🛠️ DUKUNGAN TEKNIS (IT & SUPPORT)
*Ditujukan untuk Technical Support atau Developer yang melakukan pemeliharaan aplikasi.*

### 1. Manajemen Akun Admin
Aplikasi ini **tidak memiliki** halaman registrasi publik demi keamanan.
- **Menambah Admin Baru**: Buka [Firebase Console](https://console.firebase.google.com/) > Pilih Project > **Authentication** > Tab **Users** > Klik **Add User**.
- **Reset Password**: Lakukan langsung dari Firebase Console pada user yang bersangkutan.

### 2. Panduan Troubleshooting Umum

**Issue 1: Admin tidak bisa Login (Invalid Credentials)**
- **Cek**: Pastikan email terdaftar di Firebase Auth. Pastikan *API Key* di file `.env.local` sudah benar.

**Issue 2: Error "Blocking Route" atau `new Date()` saat Build**
- **Solusi**: Pastikan komponen yang melakukan penarikan data *real-time* ke Firebase sudah memanggil `import { connection } from 'next/server'` dan `await connection();` sebelum *fetch* data.

**Issue 3: Data responden publik tidak masuk**
- **Cek**: Periksa *Firestore Security Rules*. Pastikan `allow create: if true;` pada *collection* `responses` sudah diatur.

**Issue 4: UI berantakan di HP**
- **Solusi**: Pastikan tidak ada komponen grafik (Recharts) yang memiliki `width` statis (wajib menggunakan `<ResponsiveContainer>`).