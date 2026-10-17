import { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import Image from 'next/image';
import { formsService } from '@/services/forms.service';
import { RespondentForm } from '@/components/RespondentForm';
import { CurrentYear } from '@/components/CurrentYear';
import {
  Lock,
  ArrowLeft,
  BarChart3,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ formId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connection();
  const resolvedParams = await params;
  const formId = resolvedParams.formId;
  try {
    const form = await formsService.getFormById(formId);
    return {
      title: `${form.title} | SHARING VISION™`,
      description: form.description || 'Formulir kuesioner survei PT. Sharing Vision Indonesia',
    };
  } catch {
    return {
      title: 'Kuesioner Tidak Ditemukan | SHARING VISION™',
    };
  }
}

function FormLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8C0E2B] via-[#A31633] via-30% via-[#C1324E] via-50% to-[#F8FAFC] to-90% bg-no-repeat text-[#1E293B] flex flex-col font-sans">
      {/* Solid White Top Bar */}
      <header className="w-full bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/Logo-Sharingvision-Main.png"
              alt="Sharing Vision Logo"
              width={150}
              height={30}
              className="h-7 sm:h-7.5 w-auto object-contain"
              priority
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6">
        <div className="max-w-2xl w-full bg-white border border-slate-100 rounded-2xl shadow-md p-8 text-center animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-red-600 mx-auto flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="h-6 bg-slate-200 rounded-md w-1/2 mx-auto mb-3" />
          <div className="h-4 bg-slate-100 rounded-md w-3/4 mx-auto mb-6" />
          <div className="space-y-4 pt-4">
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-xl w-full" />
            <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Clean centered UI on SHARING VISION™ Red-to-White transition background when form is inactive/closed
 */
function InactiveFormState({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8C0E2B] via-[#A31633] via-30% via-[#C1324E] via-50% to-[#F8FAFC] to-90% bg-no-repeat text-[#1E293B] flex flex-col font-sans relative selection:bg-red-600 selection:text-white">
      {/* Solid White Top Bar */}
      <header className="w-full bg-white border-b border-slate-100 shadow-sm relative z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Image
              src="/Logo-Sharingvision-Main.png"
              alt="Sharing Vision Logo"
              width={150}
              height={30}
              className="h-7 sm:h-7.5 w-auto object-contain transition-opacity group-hover:opacity-85"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Subtle organic curl wave trails */}
      <div
        className="absolute top-16 sm:top-18 left-0 right-0 h-[520px] pointer-events-none overflow-hidden opacity-10 z-0"
        aria-hidden="true"
      >
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1440 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveFadeInactive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M -60 70 C 220 160, 500 -20, 860 100 C 1180 200, 1360 80, 1500 120 L 1500 -50 L -60 -50 Z"
            fill="url(#waveFadeInactive)"
          />
          <path
            d="M -60 160 C 260 270, 620 50, 990 200 C 1240 290, 1390 170, 1500 220 L 1500 -50 L -60 -50 Z"
            fill="url(#waveFadeInactive)"
            fillOpacity="0.6"
          />
        </svg>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="max-w-lg w-full bg-white border border-slate-100 rounded-2xl p-8 sm:p-10 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-red-600 mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Formulir Nonaktif
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Mohon Maaf, Kuesioner Ini Sudah Tidak Aktif / Ditutup
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Pengumpulan data dan pengisian tanggapan untuk <strong className="text-[#0F172A]">&quot;{title}&quot;</strong> saat ini telah dinonaktifkan oleh administrator.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-slate-50 bg-white border border-[#CBD5E1] transition-all"
            >
              <BarChart3 className="w-4 h-4 text-red-600" />
              Dashboard Admin
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-[#64748B]">
          PT. Sharing Vision Indonesia
        </div>
      </div>
    </div>
  );
}

/**
 * Form Not Found UI
 */
function FormNotFoundState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8C0E2B] via-[#A31633] via-30% via-[#C1324E] via-50% to-[#F8FAFC] to-90% bg-no-repeat text-[#1E293B] flex flex-col font-sans">
      {/* Solid White Top Bar */}
      <header className="w-full bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Image
              src="/Logo-Sharingvision-Main.png"
              alt="Sharing Vision Logo"
              width={150}
              height={30}
              className="h-7 sm:h-7.5 w-auto object-contain transition-opacity group-hover:opacity-85"
              priority
            />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-2xl p-8 text-center space-y-5 shadow-md text-[#1E293B]">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] mb-1.5">
              Kuesioner Tidak Ditemukan
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Formulir dengan ID tersebut tidak ditemukan di sistem atau mungkin telah dihapus.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

async function FormContent({ params }: PageProps) {
  // Opt into dynamic rendering inside Suspense boundary to prevent blocking prerendering
  await connection();

  const resolvedParams = await params;
  const formId = resolvedParams.formId;

  let form = null;
  try {
    form = await formsService.getFormById(formId);
  } catch {
    form = null;
  }

  if (!form) {
    return <FormNotFoundState />;
  }

  // Active validation check
  if (!form.is_active) {
    return <InactiveFormState title={form.title} />;
  }

  // Active: render standard respondent form in SHARING VISION™ smooth red-to-white gradient theme
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#8C0E2B] via-[#A31633] via-30% via-[#C1324E] via-50% to-[#F8FAFC] to-90% bg-no-repeat text-[#1E293B] flex flex-col font-sans relative selection:bg-red-600 selection:text-white antialiased">
      {/* 100% Solid White Top Bar */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Image
              src="/Logo-Sharingvision-Main.png"
              alt="Sharing Vision Logo"
              width={150}
              height={30}
              className="h-7 sm:h-7.5 w-auto object-contain transition-opacity group-hover:opacity-85"
              priority
            />
          </Link>
        </div>
      </header>

      {/* Subtle organic curl wave trails in upper red region */}
      <div
        className="absolute top-16 sm:top-18 left-0 right-0 h-[520px] pointer-events-none overflow-hidden opacity-10 z-0"
        aria-hidden="true"
      >
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1440 520"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="85%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveFadeStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="90%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Organic flowing curves */}
          <path
            d="M -60 70 C 220 160, 500 -20, 860 100 C 1180 200, 1360 80, 1500 120 L 1500 -50 L -60 -50 Z"
            fill="url(#waveFade)"
          />
          <path
            d="M -60 160 C 260 270, 620 50, 990 200 C 1240 290, 1390 170, 1500 220 L 1500 -50 L -60 -50 Z"
            fill="url(#waveFade)"
            fillOpacity="0.6"
          />
          <path
            d="M -60 260 C 320 390, 720 140, 1090 300 C 1290 390, 1430 280, 1500 330 L 1500 -50 L -60 -50 Z"
            fill="url(#waveFade)"
            fillOpacity="0.4"
          />

          {/* Subtle curved wave trails */}
          <path
            d="M -50 120 Q 320 220, 720 70 T 1500 150"
            stroke="url(#waveFadeStroke)"
            strokeWidth="2"
            strokeDasharray="6 8"
          />
          <path
            d="M -50 210 Q 380 340, 840 160 T 1500 240"
            stroke="url(#waveFadeStroke)"
            strokeWidth="2.5"
          />
          <path
            d="M -50 310 Q 440 460, 940 240 T 1500 360"
            stroke="url(#waveFadeStroke)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Main Form Content */}
      <main className="flex-1 py-4 sm:py-8 md:py-12 px-2 sm:px-4 relative z-10">
        <RespondentForm form={form} />
      </main>

      {/* SHARING VISION™ Light Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white/80 backdrop-blur-sm py-8 relative z-10 text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/Logo-Sharingvision-Main.png"
              alt="Sharing Vision Logo"
              width={110}
              height={22}
              className="h-5 w-auto object-contain"
            />
            <span>&copy; <CurrentYear /> PT. Sharing Vision Indonesia. Hak Cipta Dilindungi</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Aktif &amp; Terenkripsi
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DynamicFormPage({ params }: PageProps) {
  return (
    <Suspense fallback={<FormLoadingFallback />}>
      <FormContent params={params} />
    </Suspense>
  );
}
