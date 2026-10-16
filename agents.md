# AI Subagent Workflow (Vibecoding Rules)

Dokumen ini mendefinisikan standar operasional untuk AI IDE (Cursor/Windsurf/Cline) saat memodifikasi *codebase* ini.

## Loop: Plan -> Specify -> Build -> Test

### 1. Plan (Perencanaan)
- Pahami *context* dari *user prompt*.
- Verifikasi dampaknya terhadap rute Next.js yang sudah ada (terutama isu *Server vs Client Components*).
- Pastikan tidak ada konflik dengan `Design_System.md`.

### 2. Specify (Spesifikasi)
- Tentukan *file* mana saja yang akan diubah.
- Jika ada *query* *database* baru, pastikan menggunakan *syntax* Firebase modular (`getDocs`, `collection`) bukan SDK lama.

### 3. Build (Eksekusi)
- Terapkan kode dengan prinsip *Mobile-First* Tailwind CSS.
- Jika ada perhitungan waktu dinamis seperti `new Date()` pada *Server Component*, wajib gunakan `import { connection } from 'next/server'` untuk mengaktifkan *dynamic rendering*.
- Hindari penggunaan tag `<style>` manual; manfaatkan *utility classes* Tailwind.

### 4. Test (Verifikasi)
- Pastikan tidak ada *error build* dari *unstable values*.
- Verifikasi *behavior Light/Dark mode* pada *komponen* yang baru dibuat.
- Pastikan *padding/margin* responsif di ukuran layar kecil (`hidden md:flex`, `grid-cols-1 md:grid-cols-3`).