import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import Image from 'next/image';
import { formsService } from '@/services/forms.service';
import {
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { CurrentYear } from '@/components/CurrentYear';
import type { FormRecord } from '@/types/form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SHARING VISION™',
  description: 'Platform manajemen kuesioner dan pengumpulan data terintegrasi PT. Sharing Vision Indonesia',
};

/**
 * Async child component for dynamic active forms data fetching
 * Runs within a <Suspense> boundary to avoid blocking PPR
 */
async function ActiveFormsList() {
  await connection();
  let activeForms: FormRecord[] = [];
  try {
    const res = await formsService.getForms({ isActive: true, perPage: 6 });
    activeForms = res.items || [];
  } catch {
    activeForms = [];
  }

  if (activeForms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-500 text-sm">
        Belum ada kuesioner aktif saat ini.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {activeForms.map((form) => (
        <div
          key={form.id}
          className="bg-white shadow-sm hover:shadow-md border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between transition-all group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktif
              </span>
              <span className="text-xs font-medium text-slate-500">
                {form.questions.length} Pertanyaan
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#DF1A3D] transition-colors line-clamp-2">
              {form.title}
            </h3>

            {form.description && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {form.description}
              </p>
            )}
          </div>

          <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <Link
              href={`/form/${form.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] shadow-xs transition-all"
            >
              <span>Isi Formulir</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              href={`/admin/dashboard?formId=${form.id}`}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Lihat Hasil &rarr;
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Modern Flat Landing Page Component
 * Two-column condensed enterprise layout without heavy gradients
 */
export default function LandingPage() {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white antialiased">
      {/* Solid White Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center group focus:outline-none">
            <Image
              src="/Logo-Sharingvision-Main.png"
              alt="Sharing Vision Logo"
              width={160}
              height={32}
              className="h-8 w-auto object-contain transition-opacity group-hover:opacity-85"
              priority
            />
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#DF1A3D] hover:bg-slate-100 transition-colors"
          >
            <span>Masuk Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content - Two-Column Condensed Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-12 items-start flex-1 w-full">
        {/* Left Column: Title & Modern Features (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6 lg:sticky lg:top-24">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Portal Kuesioner &amp; Analitik
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
              Platform kuesioner digital dan pengumpulan tanggapan terintegrasi untuk kebutuhan survei, riset pasar, dan evaluasi berkala.
            </p>
          </div>

          {/* Compact Modern Features List */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-3.5 text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-red-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Dynamic Form Builder</div>
                <div className="text-xs text-slate-500 font-normal">Kuesioner dinamis dengan skema responsif</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Real-Time Analytics</div>
                <div className="text-xs text-slate-500 font-normal">Visualisasi data dan grafik respons seketika</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Keamanan Enterprise</div>
                <div className="text-xs text-slate-500 font-normal">Sesi terproteksi dengan enkripsi standar industri</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Questionnaires (col-span-7) */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#DF1A3D]" />
                Kuesioner Aktif Saat Ini
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pilih salah satu formulir survei untuk mulai mengisi tanggapan.
              </p>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm animate-pulse">
                Memuat data kuesioner aktif...
              </div>
            }
          >
            <ActiveFormsList />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/Logo-Sharingvision-Main.png"
              alt="Sharing Vision Logo"
              width={110}
              height={22}
              className="h-5 w-auto object-contain"
            />
            <span className="font-medium text-slate-600">
              PT. Sharing Vision Indonesia &bull; Portal Kuesioner Digital
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Firebase Firestore Connected
            </span>
            <span>&copy; <CurrentYear /> Hak Cipta Dilindungi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
