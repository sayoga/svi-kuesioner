<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Subagent Workflow & Engineering Standards (Vibecoding Rules)

Dokumen ini mendefinisikan standar operasional dan aturan mutlak untuk AI Coding Assistant (Antigravity / Cursor / Windsurf / Cline) saat menganalisis, memodifikasi, atau memperluas *codebase* **Portal Kuesioner & Survei SHARING VISION™**.

---

## 1. Siklus Kerja: Plan -> Specify -> Build -> Test

### 1.1. Plan (Perencanaan)
- Pahami konteks permintaan pengguna secara menyeluruh sebelum menyentuh file.
- Verifikasi batas antara **Server Components** dan **Client Components** (`'use client'`).
- Rujuk selalu [`PRD.md`](file:///home/sayoga/projects/svi-kuesioner/PRD.md), [`Architecture.md`](file:///home/sayoga/projects/svi-kuesioner/Architecture.md), dan [`Design_System.md`](file:///home/sayoga/projects/svi-kuesioner/Design_System.md).

### 1.2. Specify (Spesifikasi Arsitektur)
- Tentukan file spesifik yang terdampak.
- Jika ada manipulasi database, pilih SDK yang tepat:
  - **Firebase Admin SDK (Server Actions)**: Wajib untuk seluruh operasi administratif (`createUser`, `updateUser`, `deleteUser`, serta penulisan `audit_logs`).
  - **Firebase Client SDK**: Khusus untuk alur autentikasi login browser dan pengiriman respon kuesioner publik.

### 1.3. Build (Implementasi Kode)
- **Next.js 16 Dynamic Rendering**: Pada Server Component yang membaca data dinamis atau waktu (`new Date()`), **WAJIB** panggil `await connection()` dari `next/server` di dalam boundary Suspense untuk mencegah error *blocking prerender*.
- **Client Session Integrity**: **DILARANG KERAS** menggunakan `createUserWithEmailAndPassword` dari client SDK di dalam dashboard admin, karena akan memutus sesi login admin aktif. Gunakan Server Action di [`src/actions/users.ts`](file:///home/sayoga/projects/svi-kuesioner/src/actions/users.ts).
- **Asynchronous Non-Blocking Logging**: Saat memicu `logActivity` untuk Audit Trail pada Server Actions (misal: mutasi form), gunakan pola *fire-and-forget*:
  ```typescript
  void logActivity({
    action: 'CREATE_FORM',
    details: `Created new form: ${created.title}`,
  }).catch((err) => console.error('Audit log failed:', err));
  ```
- **Enterprise Grouped Navigation**: Saat menambahkan rute baru di Sidebar (`src/components/AdminSidebar.tsx`), tempatkan ke dalam kategori yang sesuai:
  - `MENU UTAMA`: Fitur operasional survei (Dashboard, Kuesioner, Tanggapan, Report).
  - `ADMINISTRATOR`: Fitur manajemen sistem (Manajemen User, Audit Trail).
- **Aset Logo & Favicon**: Gunakan logo resmi `/Logo-Sharingvision-Main.png` dan favicon kustom `/icon.png`. Hindari teks statis pengganti logo pada header.

### 1.4. Test & Verification (Validasi)
- Jalankan pemeriksaan tipe `npx tsc --noEmit` untuk memastikan kepatuhan TypeScript.
- Jalankan `npm run lint` untuk memvalidasi standar ESLint.
- Pastikan tidak ada *Hydration Mismatch* (`suppressHydrationWarning` pada root `<html>`).
- Verifikasi kontras tampilan di kedua mode (*Light* dan *Dark Mode*).

---

## 2. Struktur Direktori Kunci untuk Subagent

| Direktori / File | Peran & Tanggung Jawab | Aturan Modifikasi |
| :--- | :--- | :--- |
| `src/actions/` | Next.js Server Actions | Selalu gunakan `'use server'`. Validasi input dengan Zod. Tangani error secara terstruktur. |
| `src/actions/users.ts` | User Management CRUD | Memanggil `adminAuth` dari `src/lib/firebase-admin.ts`. Wajib mencatat audit log. |
| `src/actions/forms.ts` | Form Management Actions | Panggil `logActivity` non-blocking pada aksi create, update, delete, dan change status. |
| `src/actions/audit.ts` | Audit Logs Retrieval | Mengambil 50 log aktivitas terbaru terurut *descending*. |
| `src/lib/firebase-admin.ts` | Inisialisasi Admin SDK | Menggunakan **Lazy Proxy** agar environment variables terbaca tepat waktu di runtime. |
| `src/services/audit.service.ts` | Service Logging Firestore | Menyimpan data log ke koleksi `audit_logs` dengan resolusi identitas admin otomatis. |
| `src/components/AdminSidebar.tsx` | Navigasi Portal Admin | Navigasi dua grup dengan collapsible accordion, auto-expand, dan tombol *Kembali ke Beranda*. |

---

## 3. Konvensi Styling & Desain (Design System Rules)

1. **Brand Primary Color**: `#DF1A3D` (Corporate Red), aksen gelap `#A30018`.
2. **Background Pairing**:
   - Light: `bg-slate-50` (`#F8FAFC`) / Card: `bg-white` (`#FFFFFF`).
   - Dark: `bg-[#0A0A0A]` / Card: `bg-[#121212]`.
3. **Text Secondary Rule**:
   - Seluruh deskripsi, subtitle, dan label sekunder wajib menggunakan `text-slate-600 dark:text-slate-400`.
   - Hindari teks abu-abu yang terlalu terang (`text-slate-400` di light mode) untuk menjamin standar keterbacaan (WCAG AA).
4. **Bento Box Radii**: Gunakan `rounded-3xl` untuk kartu/container utama dan `rounded-2xl` untuk tombol/input.