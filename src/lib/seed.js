import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
} from 'firebase/firestore';

/**
 * Firebase Config
 * Reads environment variables with production-ready fallbacks matching .env.local
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    'AIzaSyDYhrFnN79EYN1sf0W2MAM634vKgDy4SeU',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN ||
    'sharing-vision-3fb3a.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'sharing-vision-3fb3a',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    'sharing-vision-3fb3a.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    '130099179975',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.FIREBASE_APP_ID ||
    '1:130099179975:web:661090e4e59731e14aa9e2',
};

// Initialize Firebase App & Firestore
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Question definitions for the dummy survey
 */
export const dummyQuestions = [
  {
    q_id: 'q_01',
    type: 'text',
    label: 'Nama Lengkap Responden',
    required: true,
  },
  {
    q_id: 'q_02',
    type: 'dropdown',
    label: 'Divisi / Unit Kerja',
    required: true,
    options: [
      'Information Technology',
      'Digital Banking & Fintech',
      'Risk Management & Compliance',
      'Corporate Strategy & Planning',
      'Operations & People',
    ],
  },
  {
    q_id: 'q_03',
    type: 'radio',
    label: 'Tingkat Kepuasan terhadap Kualitas Konsultasi Sharing Vision',
    required: true,
    options: ['Sangat Puas', 'Puas', 'Cukup Puas', 'Perlu Peningkatan'],
  },
  {
    q_id: 'q_04',
    type: 'checkbox',
    label: 'Layanan / Topik yang Paling Bermanfaat bagi Instansi Anda',
    required: true,
    options: [
      'Cybersecurity & AML/CFT Assessment',
      'IT Architecture & Enterprise Blueprint',
      'Digital Maturity Index (DMI)',
      'Regulasi Fintech & Roadmap AI',
      'Executive Workshop & Sertifikasi IT',
    ],
  },
  {
    q_id: 'q_05',
    type: 'radio',
    label: 'Apakah Anda bersedia merekomendasikan layanan Sharing Vision?',
    required: true,
    options: [
      'Pasti Merekomendasikan',
      'Kemungkinan Besar',
      'Ragu-ragu',
      'Tidak',
    ],
  },
  {
    q_id: 'q_06',
    type: 'textarea',
    label: 'Kritik, Saran, dan Masukan Tambahan',
    required: false,
  },
];

/**
 * Realistic respondent answers
 */
export const dummyResponsesList = [
  {
    name: 'Budi Santoso',
    created: '2026-10-10T08:30:00.000Z',
    answers: {
      q_01: 'Budi Santoso',
      q_02: 'Information Technology',
      q_03: 'Sangat Puas',
      q_04: [
        'Cybersecurity & AML/CFT Assessment',
        'IT Architecture & Enterprise Blueprint',
      ],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Rekomendasi teknis arsitektur sangat aplikatif dan membantu persiapan audit tahunan.',
    },
  },
  {
    name: 'Siti Nurhaliza',
    created: '2026-10-10T10:15:00.000Z',
    answers: {
      q_01: 'Siti Nurhaliza',
      q_02: 'Digital Banking & Fintech',
      q_03: 'Sangat Puas',
      q_04: ['Regulasi Fintech & Roadmap AI', 'Digital Maturity Index (DMI)'],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Kajian regulasi AI dan fintech sangat mendalam serta relevan dengan dinamika perbankan.',
    },
  },
  {
    name: 'Hendra Gunawan',
    created: '2026-10-11T09:00:00.000Z',
    answers: {
      q_01: 'Hendra Gunawan',
      q_02: 'Risk Management & Compliance',
      q_03: 'Puas',
      q_04: ['Cybersecurity & AML/CFT Assessment'],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Analisis gap kepatuhan regulasi sangat membantu pemetaan risiko TI.',
    },
  },
  {
    name: 'Rina Kusuma',
    created: '2026-10-11T13:45:00.000Z',
    answers: {
      q_01: 'Rina Kusuma',
      q_02: 'Corporate Strategy & Planning',
      q_03: 'Sangat Puas',
      q_04: [
        'Digital Maturity Index (DMI)',
        'IT Architecture & Enterprise Blueprint',
      ],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Eksekutif summary sangat mudah dipahami oleh jajaran direksi kami.',
    },
  },
  {
    name: 'Ahmad Fauzi',
    created: '2026-10-12T08:20:00.000Z',
    answers: {
      q_01: 'Ahmad Fauzi',
      q_02: 'Information Technology',
      q_03: 'Sangat Puas',
      q_04: [
        'Cybersecurity & AML/CFT Assessment',
        'Executive Workshop & Sertifikasi IT',
      ],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Materi workshop sangat praktis dan langsung dapat diterapkan pada tim engineering.',
    },
  },
  {
    name: 'Dian Permata',
    created: '2026-10-12T11:10:00.000Z',
    answers: {
      q_01: 'Dian Permata',
      q_02: 'Operations & People',
      q_03: 'Puas',
      q_04: ['Executive Workshop & Sertifikasi IT'],
      q_05: 'Kemungkinan Besar',
      q_06: 'Pelatihan kompetensi digital sangat meningkatkan kapabilitas tim internal.',
    },
  },
  {
    name: 'Rizky Pratama',
    created: '2026-10-13T09:30:00.000Z',
    answers: {
      q_01: 'Rizky Pratama',
      q_02: 'Digital Banking & Fintech',
      q_03: 'Sangat Puas',
      q_04: [
        'Regulasi Fintech & Roadmap AI',
        'Cybersecurity & AML/CFT Assessment',
      ],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Konsultan sangat responsif dan menguasai benchmark industri regional.',
    },
  },
  {
    name: 'Eko Prasetyo',
    created: '2026-10-13T14:00:00.000Z',
    answers: {
      q_01: 'Eko Prasetyo',
      q_02: 'Information Technology',
      q_03: 'Cukup Puas',
      q_04: ['IT Architecture & Enterprise Blueprint'],
      q_05: 'Kemungkinan Besar',
      q_06: 'Diharapkan ada pendampingan berkala setelah fase blueprint selesai.',
    },
  },
  {
    name: 'Maya Anggraini',
    created: '2026-10-14T10:00:00.000Z',
    answers: {
      q_01: 'Maya Anggraini',
      q_02: 'Corporate Strategy & Planning',
      q_03: 'Sangat Puas',
      q_04: [
        'Digital Maturity Index (DMI)',
        'Regulasi Fintech & Roadmap AI',
      ],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Hasil skor DMI memberikan arah yang jelas untuk prioritas investasi TI.',
    },
  },
  {
    name: 'Aditya Nugraha',
    created: '2026-10-14T15:20:00.000Z',
    answers: {
      q_01: 'Aditya Nugraha',
      q_02: 'Risk Management & Compliance',
      q_03: 'Puas',
      q_04: ['Cybersecurity & AML/CFT Assessment'],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Laporan mitigasi keamanan siber disajikan sangat komprehensif.',
    },
  },
  {
    name: 'Fitri Handayani',
    created: '2026-10-15T08:45:00.000Z',
    answers: {
      q_01: 'Fitri Handayani',
      q_02: 'Operations & People',
      q_03: 'Puas',
      q_04: ['Executive Workshop & Sertifikasi IT'],
      q_05: 'Kemungkinan Besar',
      q_06: 'Sesi studi kasus interaktif sangat membuka wawasan peserta.',
    },
  },
  {
    name: 'Dimas Wicaksono',
    created: '2026-10-15T11:30:00.000Z',
    answers: {
      q_01: 'Dimas Wicaksono',
      q_02: 'Digital Banking & Fintech',
      q_03: 'Sangat Puas',
      q_04: [
        'IT Architecture & Enterprise Blueprint',
        'Regulasi Fintech & Roadmap AI',
      ],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Sangat puas dengan rekomendasi arsitektur cloud & microservices.',
    },
  },
  {
    name: 'Agus Triyono',
    created: '2026-10-15T16:15:00.000Z',
    answers: {
      q_01: 'Agus Triyono',
      q_02: 'Information Technology',
      q_03: 'Sangat Puas',
      q_04: [
        'Cybersecurity & AML/CFT Assessment',
        'Digital Maturity Index (DMI)',
      ],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Kualitas analisis sangat tinggi dan selalu tepat waktu.',
    },
  },
  {
    name: 'Nabila Putri',
    created: '2026-10-16T09:10:00.000Z',
    answers: {
      q_01: 'Nabila Putri',
      q_02: 'Corporate Strategy & Planning',
      q_03: 'Puas',
      q_04: ['Digital Maturity Index (DMI)'],
      q_05: 'Kemungkinan Besar',
      q_06: 'Penyusunan indikator kinerja strategis sangat terarah.',
    },
  },
  {
    name: 'Tri Wahyudi',
    created: '2026-10-16T11:00:00.000Z',
    answers: {
      q_01: 'Tri Wahyudi',
      q_02: 'Risk Management & Compliance',
      q_03: 'Sangat Puas',
      q_04: [
        'Cybersecurity & AML/CFT Assessment',
        'IT Architecture & Enterprise Blueprint',
      ],
      q_05: 'Pasti Merekomendasikan',
      q_06: 'Mitigasi kepatuhan AML/CFT sangat detail dan akurat.',
    },
  },
];

/**
 * Seeds dummy survey, questions, and responses directly into Cloud Firestore
 * Creates 'surveys', 'questions', and 'responses' collections (and 'forms' for app compatibility)
 */
export async function seedDatabase() {
  const nowIso = new Date().toISOString();

  // 1. Prepare Survey Document Payload
  const surveyPayload = {
    title: 'Survei Kepuasan Layanan & Transformasi Digital 2026',
    description:
      'Kuesioner evaluasi kualitas layanan riset, konsultasi IT architecture, dan cybersecurity PT Sharing Vision Indonesia.',
    status: 'active',
    is_active: true,
    questions: dummyQuestions,
    created: nowIso,
    updated: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  // Create survey document in 'surveys' collection using addDoc
  const surveyDocRef = await addDoc(
    collection(db, 'surveys'),
    surveyPayload
  );
  const surveyId = surveyDocRef.id;

  // Also write to 'forms' collection using setDoc with identical ID so the dashboard works seamlessly
  await setDoc(doc(db, 'forms', surveyId), {
    id: surveyId,
    collectionId: 'forms',
    collectionName: 'forms',
    ...surveyPayload,
  });

  // 2. Insert individual question documents into 'questions' collection
  let questionsCount = 0;
  for (let i = 0; i < dummyQuestions.length; i++) {
    const q = dummyQuestions[i];
    await addDoc(collection(db, 'questions'), {
      survey_id: surveyId,
      form_id: surveyId,
      q_id: q.q_id,
      type: q.type,
      label: q.label,
      required: q.required,
      options: q.options || [],
      order: i + 1,
      created_at: nowIso,
    });
    questionsCount++;
  }

  // 3. Insert mock respondent records into 'responses' collection
  let responsesCount = 0;
  for (const resp of dummyResponsesList) {
    const respTime = resp.created || nowIso;
    await addDoc(collection(db, 'responses'), {
      form_id: surveyId,
      survey_id: surveyId,
      relation: surveyId,
      respondent_name: resp.name,
      answers: {
        ...resp.answers,
        _submitted_at: respTime,
      },
      created: respTime,
      updated: respTime,
      created_at: respTime,
    });
    responsesCount++;
  }

  return {
    success: true,
    surveyId,
    formId: surveyId,
    title: surveyPayload.title,
    totalQuestions: questionsCount,
    totalResponses: responsesCount,
    message: `Database berhasil di-seed! Dibuat kuesioner '${surveyPayload.title}' (${surveyId}) dengan ${questionsCount} pertanyaan dan ${responsesCount} respons dummy.`,
  };
}

// Allow direct CLI execution: `node src/lib/seed.js`
if (
  process.argv[1] &&
  (process.argv[1].endsWith('seed.js') || process.argv[1].endsWith('seed.mjs'))
) {
  console.log('🚀 Memulai proses seeding data dummy ke Firestore...');
  seedDatabase()
    .then((result) => {
      console.log('✅ ' + result.message);
      console.log('📋 Detail Seeding:');
      console.log(`   - Survey ID   : ${result.surveyId}`);
      console.log(`   - Pertanyaan  : ${result.totalQuestions}`);
      console.log(`   - Respons     : ${result.totalResponses}`);
      console.log(`   - Collections : surveys, questions, responses, forms`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Terjadi kesalahan saat seeding:', err);
      process.exit(1);
    });
}
