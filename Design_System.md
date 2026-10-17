# System Design Document (SDD)

**Sistem**: Portal Kuesioner & Manajemen Analitik SHARING VISION™  
**Versi Dokumen**: 1.2.0  
**Status**: Approved & Implemented  
**Tanggal**: 16 Oktober 2026  

---

## 1. Desain Arsitektur Sistem

Sistem Kuesioner dirancang dengan arsitektur **Hybrid Server-Rendered & Server-Action First** berbasis **Next.js 16 (App Router)** yang terintegrasi secara *native* dengan infrastruktur **Google Cloud Firestore** dan **Firebase Authentication**.

```
+---------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                 |
|   - Responden Publik (Mobile/Desktop Web)                                       |
|   - Administrator (Desktop Dashboard)                                           |
+---------------------------------------------------------------------------------+
                                       |
                                       | HTTP(S) Request
                                       v
+---------------------------------------------------------------------------------+
|                       NEXT.JS 16 SERVER ENVIRONMENT                             |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  | Middleware (src/middleware.ts): Verifikasi Cookie pb_auth                 |  |
|  +---------------------------------------------------------------------------+  |
|                                       |                                         |
|  +------------------------------------+--------------------------------------+  |
|  |                                                                           |  |
|  v                                                                           v  |
|  SERVER COMPONENTS (Read Operations)                SERVER ACTIONS (Mutations)  |
|  - await connection() for dynamic SSR              - loginAdminAction / Logout  |
|  - Suspense & Bento Skeleton Loaders               - createUser / deleteUser    |
|                                                    - createForm / deleteForm    |
|                                                                      |          |
|                                       +------------------------------+          |
|                                       | (Non-blocking async call)               |
|                                       v                                         |
|  +---------------------------------------------------------------------------+  |
|  | Business Logic & SDK Services Layer                                       |  |
|  | - forms.service.ts       - audit.service.ts (logActivity background)      |  |
|  | - responses.service.ts   - firebase-admin.ts (Lazy Runtime Proxy)          |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
                                       |
                        gRPC / REST (Server Authenticated)
                                       v
+---------------------------------------------------------------------------------+
|                         GOOGLE CLOUD / FIREBASE BACKEND                         |
|                                                                                 |
|  [Firebase Authentication]          [Cloud Firestore NoSQL]                     |
|  - Identity Provider (Admin Users)  - forms collection                          |
|  - UID, Email, Passwords            - responses collection                      |
|                                     - audit_logs collection                     |
+---------------------------------------------------------------------------------+
```

---

## 2. Alur Data & Mutasi (Data Flow)

### 2.1. Alur Manajemen User (Admin CRUD)
1. **Request**: Admin membuka `/admin/users` dan menekan tombol *Tambah Admin Baru*.
2. **Server Action Execution**: Form memicu `createUserAction` di [`src/actions/users.ts`](file:///home/sayoga/projects/svi-kuesioner/src/actions/users.ts).
3. **Admin SDK Invocation**: Eksekusi `adminAuth.createUser(...)` dilakukan di sisi server via Service Account. Token login sesi admin saat ini tidak terganggu (*zero session disruption*).
4. **Audit Recording**: Sistem memanggil `logActivity('CREATE_USER', ...)`.
5. **Revalidation**: `revalidatePath('/admin/users')` dijalankan untuk memperbarui data tabel secara reaktif.

### 2.2. Alur Pengelolaan Kuesioner & Non-blocking Audit
1. **Action Trigger**: Admin membuat, menyunting, menghapus kuesioner, atau mengganti status (aktif/nonaktif).
2. **Database Mutation**: Dokumen kuesioner pada koleksi `forms` diperbarui via `formsService`.
3. **Non-blocking Log Dispatch**: Panggilan `void logActivity(...).catch(...)` di-dispatch di latar belakang. Respons mutasi langsung dikembalikan ke browser admin tanpa menunggu latensi penulisan log audit selesai.
4. **Cache Invalidation**: Cache halaman `/forms` dan `/dashboard` dibersihkan.

### 2.3. Alur Pengisian Formulir oleh Responden
1. **Dynamic Page Rendering**: Responden mengakses `/form/[formId]`. Next.js melakukan *server rendering* menggunakan `await connection()` dan `getFormById`.
2. **Client Validation**: Formulir divalidasi di sisi browser oleh `RespondentForm.tsx`.
3. **Submission**: Jawaban dikirim ke Server Action / API Route dan disimpan ke koleksi `responses`.

---

## 3. Skema Data & Koleksi Firestore

### 3.1. Koleksi `audit_logs`
Dirancang khusus untuk standar kepatuhan (*compliance*) dan penelusuran aktivitas:
- `id`: Auto-generated Firestore document ID.
- `action`: Jenis aktivitas (`CREATE_USER`, `UPDATE_USER`, `DELETE_USER`, `CREATE_FORM`, `UPDATE_FORM`, `DELETE_FORM`, `CHANGE_FORM_STATUS`).
- `performedBy`: Email atau identitas administrator pelaksana aksi.
- `details`: Deskripsi rinci mengenai data yang dimutasi (misal: judul form, UID user baru).
- `timestamp`: Format ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`) untuk pengurutan efisien.

### 3.2. Koleksi `forms`
- `id`: ID unik kuesioner.
- `title` & `description`: Metadata dan panduan kuesioner.
- `is_active`: Boolean status penerimaan jawaban.
- `questions`: Array terstruktur berisi daftar pertanyaan, tipe input, opsi pilihan, dan status wajib.

### 3.3. Koleksi `responses`
- `form_id`: Referensi ke form terkait.
- `respondent_name`: Nama responden (opsional).
- `submitted_at`: Waktu pengisian.
- `answers`: Objek kunci-nilai (*key-value*) jawaban pertanyaan kuesioner.

---

## 4. Topologi Keamanan & Otorisasi

1. **Hak Akses Admin Terisolasi**:
   - Seluruh mutasi admin diatur melalui Server Actions yang memvalidasi cookie `pb_auth` yang aman (*HTTP-Only*, *SameSite: Lax*, *Secure in Production*).
2. **Kredensial Service Account**:
   - File `.env.local` menampung `FIREBASE_CLIENT_EMAIL` dan `FIREBASE_PRIVATE_KEY`.
   - Menggunakan inisialisasi *Lazy Proxy* pada [`src/lib/firebase-admin.ts`](file:///home/sayoga/projects/svi-kuesioner/src/lib/firebase-admin.ts) untuk mengonversi karakter escape `\n` secara akurat dan mencegah *caching* instance tanpa otentikasi.
3. **Proteksi Sesi Client**:
   - Operasi admin ke Firebase Authentication menggunakan `firebase-admin/auth`, bukan client SDK `createUserWithEmailAndPassword`, sehingga sesi browser admin yang sedang aktif tidak tertimpa atau ter-logout.

---

## 5. UI/UX Design System & Navigasi

1. **Enterprise Grouped Sidebar**:
   - **MENU UTAMA**: Dashboard, Kuesioner, Tanggapan Responden, Tabel Report.
   - **ADMINISTRATOR**: Manajemen User, Audit Trail.
   - Dilengkapi *accordion* buka-tutup dengan auto-expand pada rute aktif dan counter badge.
2. **Footer Navigasi**:
   - Tombol **Kembali ke Beranda** (`/`) dengan transisi SPA instan via `<Link>`.
   - Tautan **Formulir Publik** (`Live` badge) dan dialog konfirmasi **Keluar**.
3. **Bento Box Visual Style**:
   - Menggunakan kurva modern (`rounded-3xl`), border halus (`border-slate-200 dark:border-white/10`), latar belakang terkurasi (`slate-50` / `#0A0A0A`), serta warna aksen resmi SHARING VISION™ (`#DF1A3D`).
4. **Pencegahan Hydration Mismatch**:
   - Atribut `suppressHydrationWarning` diterapkan pada elemen root `<html>` untuk sinkronisasi tema `next-themes` tanpa flickering.
