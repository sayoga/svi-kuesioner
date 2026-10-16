# Design System — SHARING VISION™ Kuesioner

Panduan desain antarmuka, tipografi, warna, dan komponen visual untuk aplikasi Kuesioner & Survei SHARING VISION™.

---

## Global Theming

| Mode  | Background Primary | Background Secondary | Text Primary | Text Secondary | Border Subdued | Accent Primary | Accent Hover |
| :---  | :---               | :---                 | :---         | :---           | :---           | :---           | :---         |
| **Light** | `slate-50` (`#F8FAFC`) | `white` (`#FFFFFF`) | `slate-900` (`#0F172A`) | `slate-600` / `slate-700` | `slate-200` (`#E2E8F0`) | `#DF1A3D` | `#B00E2C` |
| **Dark**  | `#0A0A0A` | `#121212` / `#141414` | `slate-100` (`#F1F5F9`) | `slate-400` (`#94A3B8`) | `white/10` / `white/15` | `#DF1A3D` | `#E82B4E` |

---

## Standar Kontras & Readability

### 1. Text Secondary (Light Mode)
- **Aturan**: Seluruh teks pendukung, deskripsi kuesioner, petunjuk pengisian, metadata, dan subtitle harus menggunakan kelas Tailwind `text-slate-600` (atau `text-slate-700` untuk teks berukuran kecil/kritis).
- **Dark Mode Pairing**: Selalu pertahankan pasangan kelas dark mode seperti `dark:text-slate-400` atau `dark:text-slate-300`.
- **Contoh**:
  ```tsx
  <p className="text-sm text-slate-600 dark:text-slate-400">
    Deskripsi kuesioner atau petunjuk pengisian form
  </p>
  ```

### 2. Placeholder Input Form
- **Aturan**: Kelas placeholder pada input teks, textarea, dan search combobox menggunakan `placeholder:text-slate-500` atau `placeholder-slate-500` (sebelumnya `slate-400`).
- **Dark Mode**: Didampingi dengan `dark:placeholder-slate-400` / `dark:placeholder:text-slate-500`.
- **Contoh**:
  ```tsx
  <input
    className="placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-900 dark:text-white"
    placeholder="Cari atau masukkan jawaban..."
  />
  ```

### 3. Palet Warna Brand
- **Corporate Red**: `#DF1A3D`
- **Dark Crimson**: `#B00E2C` / `#A30018`
- **Subdued Accent Tint**: `bg-rose-50 dark:bg-rose-500/15`
- **Subdued Accent Border**: `border-rose-200 dark:border-rose-500/30`
