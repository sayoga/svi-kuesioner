# System Architecture

## Tech Stack
- **Framework**: Next.js 16.4 (App Router, Turbopack).
- **Styling**: Tailwind CSS v3, `next-themes` untuk *Dark Mode*.
- **Database**: Firebase Firestore (NoSQL Document Store).
- **Authentication**: Firebase Auth (Email/Password).
- **Data Visualization**: Recharts.

## Folder Structure
```text
src/
├── app/
│   ├── admin/             # Restricted area (Dashboard, Form Builder)
│   │   ├── dashboard/     # Bento Box analytics grid
│   │   └── login/         # Admin authentication
│   ├── form/              # Public facing dynamic forms
│   │   └── [formId]/      # Dynamic routing for specific surveys
│   └── page.tsx           # Landing page portal
├── components/            # Reusable UI (CurrentYear.tsx, ActiveFormsList.tsx)
└── lib/
    └── firebase.ts        # Firebase initialization & SDK exports
```

## Database Schema (Firestore)
Skema data Firestore terstruktur dan teroptimasi untuk kuesioner digital.
- `surveys`: Menyimpan *metadata* kuesioner (status aktif/tidak).
- `questions`: Relasional ke `survey_id` (tipe pertanyaan, opsi jawaban).
- `responses`: Menampung *submit* jawaban publik, dilindungi *security rules*.