'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  RotateCcw,
  BarChart3,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { FormRecord } from '@/types/form';
import type { AnswerValue } from '@/types/response';
import { SearchableSelect } from '@/components/SearchableSelect';

interface RespondentFormProps {
  form: FormRecord;
}

interface FormValues {
  respondent_name: string;
  answers: Record<string, AnswerValue>;
}

export function RespondentForm({ form }: RespondentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Default values setup
  const defaultAnswers: Record<string, AnswerValue> = {};
  for (const q of form.questions) {
    if (q.type === 'checkbox') {
      defaultAnswers[q.q_id] = [];
    } else {
      defaultAnswers[q.q_id] = '';
    }
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      respondent_name: '',
      answers: defaultAnswers,
    },
    mode: 'onTouched',
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Determine respondent_name: if user entered something in respondent_name use it,
      // or if there's a text question with label containing "Nama" or q_id="q_name", use that as fallback
      let respondentName = data.respondent_name.trim();
      if (!respondentName) {
        for (const q of form.questions) {
          if (
            (q.q_id.toLowerCase().includes('name') ||
              q.label.toLowerCase().includes('nama')) &&
            typeof data.answers[q.q_id] === 'string' &&
            (data.answers[q.q_id] as string).trim()
          ) {
            respondentName = (data.answers[q.q_id] as string).trim();
            break;
          }
        }
      }

      if (!respondentName) {
        respondentName = 'Anonymous';
      }

      const payload = {
        form_id: form.id,
        respondent_name: respondentName,
        answers: data.answers,
      };

      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || json.message || 'Gagal mengirim jawaban kuesioner.'
        );
      }

      setSubmittedId(json.data?.id || null);
      setSubmitSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    reset();
    setSubmitSuccess(false);
    setSubmitError(null);
    setSubmittedId(null);
  };

  // SUCCESS STATE
  if (submitSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden text-center p-8 sm:p-12 transition-all text-[#1E293B] relative">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-6 ring-8 ring-emerald-50 border border-emerald-200 shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Tanggapan Berhasil Tersimpan
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            Terima Kasih atas Partisipasi Anda!
          </h2>

          <p className="text-[#475569] text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            Jawaban Anda untuk kuesioner{' '}
            <strong className="text-[#0F172A] font-semibold">{form.title}</strong>{' '}
            telah berhasil kami terima dan akan digunakan untuk peningkatan kualitas layanan.
          </p>

          {submittedId && (
            <div className="inline-block bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-[#64748B] font-mono mb-8">
              ID Respons: <span className="text-[#DF1A3D] font-medium">{submittedId}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1E293B] bg-white hover:bg-slate-50 border border-[#CBD5E1] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Kirim Tanggapan Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
      {/* Form Header Card */}
      <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-5 sm:p-8 mb-6 relative overflow-hidden transition-all hover:shadow-lg text-[#1E293B]">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#A30018]" />
        
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kuesioner Aktif
          </span>
          <span className="text-xs text-[#64748B] font-medium font-mono">
            {form.questions.length} Pertanyaan
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
          {form.title}
        </h1>

        {form.description && (
          <p className="text-[#475569] text-xs sm:text-sm md:text-base leading-relaxed">
            {form.description}
          </p>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
          <span className="flex items-center gap-1 text-[#334155]">
            <span className="text-red-600 font-bold">*</span> Menandakan pertanyaan wajib diisi
          </span>
          <span className="text-[#64748B] hidden sm:inline">Semua data dijaga kerahasiaannya</span>
        </div>
      </div>

      {/* Error alert if any */}
      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-900">Gagal Mengirim Tanggapan</p>
            <p className="mt-0.5 text-rose-700">{submitError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Optional Respondent Profile Card */}
        <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-4 sm:p-6 md:p-7 transition-all hover:shadow-lg focus-within:border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-red-600 border border-rose-100 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <label
                htmlFor="respondent_name"
                className="text-base font-bold text-[#0F172A] block"
              >
                Nama Responden / Inisial
              </label>
            </div>
          </div>
          <p className="text-xs text-[#64748B] mb-3">
            Opsional. Biarkan kosong jika Anda ingin mengisi kuesioner secara anonim.
          </p>
          <input
            id="respondent_name"
            type="text"
            placeholder="Contoh: Budi Santoso (opsional)"
            {...register('respondent_name')}
            className="bg-white border border-[#CBD5E1] text-[#1E293B] placeholder-[#94A3B8] rounded-lg p-3 w-full focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-sm"
          />
        </div>

        {/* Dynamic Questions List */}
        {form.questions.map((q, index) => {
          const fieldName = `answers.${q.q_id}` as const;
          // React-hook-form error for this field
          const fieldError = errors.answers?.[q.q_id];
          const isDropdownOpen = openDropdownId === q.q_id;
          // Natural inverted base z-index so earlier question cards stack above later cards
          const baseZIndex = Math.max(10, 40 - index);

          return (
            <div
              key={q.q_id}
              className={`relative transition-all duration-300 rounded-2xl shadow-md p-4 sm:p-6 md:p-8 bg-white border ${
                isDropdownOpen
                  ? 'z-50 ring-2 ring-red-600/20 border-red-600'
                  : 'focus-within:z-40 ' +
                    (fieldError
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-100 hover:border-slate-200 focus-within:border-slate-300')
              } hover:shadow-lg`}
              style={{ zIndex: isDropdownOpen ? 50 : baseZIndex }}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3 mb-4">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/60 text-red-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <label className="text-base sm:text-lg font-bold text-[#0F172A] block leading-snug">
                    {q.label}
                    {q.required && (
                      <span className="text-red-600 ml-1 font-extrabold" title="Wajib diisi">
                        *
                      </span>
                    )}
                  </label>
                  <span className="text-[11px] text-[#64748B] font-medium capitalize block mt-0.5">
                    Tipe: {q.type === 'checkbox' ? 'Pilihan Ganda (Bisa lebih dari 1)' : q.type}
                  </span>
                </div>
              </div>

              {/* Input Render By Question Type */}

              {/* 1. TEXT */}
              {q.type === 'text' && (
                <div>
                  <input
                    type="text"
                    placeholder="Ketik jawaban Anda di sini..."
                    {...register(fieldName, {
                      required: q.required ? 'Pertanyaan ini wajib diisi' : false,
                    })}
                    className="bg-white border border-[#CBD5E1] text-[#1E293B] placeholder-[#94A3B8] rounded-lg p-3 w-full focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-sm"
                  />
                </div>
              )}

              {/* 2. TEXTAREA */}
              {q.type === 'textarea' && (
                <div>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan pendapat, kritik, atau saran Anda..."
                    {...register(fieldName, {
                      required: q.required ? 'Pertanyaan ini wajib diisi' : false,
                    })}
                    className="bg-white border border-[#CBD5E1] text-[#1E293B] placeholder-[#94A3B8] rounded-lg p-3 w-full focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-sm resize-y"
                  />
                </div>
              )}

              {/* 3. RADIO */}
              {q.type === 'radio' && (
                <div className="space-y-2.5">
                  {q.options && q.options.length > 0 ? (
                    q.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className="flex items-center gap-3.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all group"
                      >
                        <input
                          type="radio"
                          value={option}
                          {...register(fieldName, {
                            required: q.required ? 'Silakan pilih salah satu opsi' : false,
                          })}
                          className="w-4 h-4 accent-red-600 text-red-600 border-[#CBD5E1] focus:ring-red-600/20 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-[#1E293B] group-hover:text-[#0F172A]">
                          {option}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-amber-600">Opsi radio belum dikonfigurasi.</p>
                  )}
                </div>
              )}

              {/* 4. CHECKBOX */}
              {q.type === 'checkbox' && (
                <Controller
                  name={fieldName}
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!q.required) return true;
                      if (Array.isArray(value) && value.length > 0) return true;
                      return 'Silakan pilih minimal 1 opsi';
                    },
                  }}
                  render={({ field }) => {
                    const currentValues: string[] = Array.isArray(field.value)
                      ? (field.value as string[])
                      : [];

                    const handleToggle = (opt: string) => {
                      if (currentValues.includes(opt)) {
                        field.onChange(currentValues.filter((v) => v !== opt));
                      } else {
                        field.onChange([...currentValues, opt]);
                      }
                    };

                    return (
                      <div className="space-y-2.5">
                        {q.options && q.options.length > 0 ? (
                          q.options.map((option, optIdx) => {
                            const isChecked = currentValues.includes(option);
                            return (
                              <label
                                key={optIdx}
                                onClick={() => handleToggle(option)}
                                className={`flex items-center gap-3.5 p-3 rounded-lg border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'border-red-600 bg-rose-50/60 text-[#0F172A] shadow-xs'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-[#1E293B]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by parent label onClick
                                  className="w-4 h-4 accent-red-600 text-red-600 rounded border-[#CBD5E1] focus:ring-red-600/20 cursor-pointer"
                                />
                                <span className="text-sm font-medium">
                                  {option}
                                </span>
                              </label>
                            );
                          })
                        ) : (
                          <p className="text-xs text-amber-600">Opsi checkbox belum dikonfigurasi.</p>
                        )}
                      </div>
                    );
                  }}
                />
              )}

              {/* 5. DROPDOWN / SEARCHABLE COMBOBOX */}
              {q.type === 'dropdown' && (
                <Controller
                  name={fieldName}
                  control={control}
                  rules={{
                    required: q.required ? 'Silakan pilih salah satu opsi' : false,
                  }}
                  render={({ field }) => (
                    <SearchableSelect
                      value={(field.value as string) || ''}
                      onChange={(val) => field.onChange(val)}
                      options={q.options || []}
                      placeholder="-- Pilih atau cari opsi jawaban --"
                      error={!!fieldError}
                      onOpenChange={(isOpen) => setOpenDropdownId(isOpen ? q.q_id : null)}
                    />
                  )}
                />
              )}

              {/* Error Message */}
              {fieldError && (
                <p className="mt-2.5 text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fieldError.message as string}
                </p>
              )}
            </div>
          );
        })}

        {/* Action Buttons */}
        <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-lg">
          <p className="text-xs text-[#64748B] text-center sm:text-left">
            Pastikan seluruh pertanyaan wajib telah terisi sebelum mengirim tanggapan.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-[#A30018] hover:from-[#A30018] hover:to-red-600 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-red-950/10 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirim Jawaban...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Jawaban</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
