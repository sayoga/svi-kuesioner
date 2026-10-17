# Product Requirements Document (PRD)

**Project**: Portal Kuesioner & Analitik SHARING VISION™  
**Status**: Active / Production Ready  
**Version**: 1.2.0 (Enterprise Iteration)  
**Terakhir Diperbarui**: 16 Oktober 2026  

---

## 1. Goal & Latar Belakang

### Tujuan Bisnis
- Menyediakan platform kuesioner digital internal dan riset pasar yang aman, terpusat, dan berstandar *enterprise*.
- Mengeliminasi ketergantungan pada platform pihak ketiga, menjaga privasi data responden, dan menjamin kepemilikan penuh atas basis data survei.
- Mempercepat siklus riset dan evaluasi tim internal dengan analitik *real-time* yang dapat diekspor langsung.

### Indikator Keberhasilan (Terukur)
| ID | Metrik / Sasaran | Target | Status |
| :--- | :--- | :--- | :--- |
| **G1** | *Zero-friction respondent experience* | Pengisian formulir selesai tanpa kendala di perangkat *mobile* maupun *desktop*. | Tercapai |
| **G2** | Analitik *Real-time* | Pembaruan metrik analitik dashboard < 2 detik setelah pengiriman jawaban. | Tercapai |
| **G3** | Performa & Aksesibilitas | Skor Lighthouse: Performance ≥ 90, Accessibility ≥ 95. | Tercapai |
| **G4** | Modernisasi UI/UX & Branding | Antarmuka *Bento Box*, aset logo resmi SHARING VISION™, *custom favicon*, serta transisi *Light/Dark Mode* mulus. | Tercapai |
| **G5** | Integritas Sesi & Manajemen User | Penambahan/penghapusan akun admin tanpa memutus (*logout*) sesi admin yang sedang login. | Tercapai |
| **G6** | Kepatuhan Keamanan & Auditabilitas | 100% mutasi data krusial (user & form) tercatat pada *Audit Trail* (`audit_logs`). | Tercapai |

---

## 2. Target Pengguna

1. **Responden Publik & Klien Mitra**:
   - Mengisi kuesioner melalui tautan publik unik (`/form/[formId]`).
   - Memerlukan antarmuka yang bersih, responsif, cepat dimuat, dengan validasi input yang jelas.
2. **Administrator & Tim Riset (HR / Konsultan IT)**:
   - Membuat, menyunting pertanyaan, mempublikasikan, atau menutup survei (`/admin/kuesioner`).
   - Memantau distribusi data pilihan ganda dan tanggapan teks di *dashboard* analitik (`/admin/dashboard`, `/admin/responses`).
   - Mengunduh rekap data mentah dalam format CSV (`/admin/report`).
3. **Super Admin / Tim Keamanan IT**:
   - Mengelola akun dan kredensial administrator melalui panel *User Management* (`/admin/users`).
   - Memantau rekam jejak aktivitas, perubahan status form, dan penghapusan data via *Audit Trail* (`/admin/audit-logs`).

---

## 3. Scope & Fitur Utama

### 3.1. Public Form Engine
- **Dynamic Form Renderer**: Mendukung beragam tipe input (teks pendek, paragraf/textarea, radio button, checkbox multi-pilihan, dan dropdown).
- **Session-Safe Submission**: Validasi skema Zod di sisi server sebelum jawaban disimpan ke koleksi Firestore `responses`.
- **Branding Resmi**: Header formulir dilengkapi logo resmi SHARING VISION™ (`/Logo-Sharingvision-Main.png`) dan favicon kustom (`/icon.png`).

### 3.2. Enterprise Analytics & Reporting Dashboard
- **Bento Box Grid**: Kartu metrik analitik responsif dengan visualisasi grafis menggunakan Recharts.
- **Tanggapan Responden & Master Report**: Tabel interaktif dengan pencarian instan, filter respons, dan ekspor CSV format UTF-8 BOM.
- **Restrukturisasi Navigasi Sidebar**: Menu sidebar dikelompokkan rapi menjadi:
  - **MENU UTAMA**: Dashboard, Kuesioner, Tanggapan Responden, Tabel Report.
  - **ADMINISTRATOR**: Manajemen User, Audit Trail.
  - **Footer Navigasi**: Tombol *Kembali ke Beranda* (`/`), tautan *Formulir Publik*, dan *Logout Confirmation Modal*.

### 3.3. User Management (Firebase Admin SDK)
- **Server-Side CRUD**: Pembuatan (`createUser`), pembaruan (`updateUser`), dan penghapusan (`deleteUser`) user langsung melalui Firebase Admin SDK.
- **Isolasi Sesi Admin**: Menghindari penggunaan `createUserWithEmailAndPassword` dari client SDK agar token sesi admin saat ini tidak tertimpa/ter-logout.
- **Keamanan Kredensial**: Konfigurasi Service Account privat di sisi server via `.env.local` dengan lazy runtime Proxy.

### 3.4. Enterprise Audit Trail (Activity Logs)
- **Pencatatan Real-time ke Koleksi Firestore `audit_logs`**:
  - `CREATE_USER` & `DELETE_USER`: Pencatatan akun admin yang dibuat atau dihapus.
  - `CREATE_FORM`, `UPDATE_FORM`, & `DELETE_FORM`: Pelacakan siklus hidup formulir survei.
  - `CHANGE_FORM_STATUS`: Pencatatan aktivasi/penonaktifan kuesioner.
- **Asynchronous & Non-Blocking**: Eksekusi pencatatan log berjalan di latar belakang (*background*) tanpa menunda respon HTTP ke pengguna.
- **Log Viewer UI**: Pilihan tampilan *Timeline Vertikal Kronologis* dan *Tabel Data Terstruktur* dilengkapi filter jenis aksi dan pencarian instan.

### 3.5. System & Framework Modernization
- **Next.js 16.4 & Turbopack**: Kompatibel penuh dengan aturan Server Components dan Partial Prerendering.
- **Dynamic Connection Handling**: Penanganan `await connection()` pada rute dinamis untuk mencegah error *blocking prerender*.
- **Hydration Suppression**: Integrasi `suppressHydrationWarning` pada elemen `<html>` untuk transisi tema `next-themes` tanpa warning konsol.