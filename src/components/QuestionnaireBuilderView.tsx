'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileEdit,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import { createFormAction, updateFormAction } from '@/actions/forms';
import type { FormRecord, Question, QuestionType } from '@/types/form';

interface QuestionnaireBuilderViewProps {
  existingForm?: FormRecord | null;
}

export function QuestionnaireBuilderView({ existingForm }: QuestionnaireBuilderViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: edit existing form if provided, otherwise create new
  const [isEditing, setIsEditing] = useState<boolean>(!!existingForm);
  const [title, setTitle] = useState(existingForm?.title || '');
  const [description, setDescription] = useState(existingForm?.description || '');
  const [isActive, setIsActive] = useState(existingForm?.is_active ?? true);
  const [questions, setQuestions] = useState<Question[]>(
    existingForm?.questions || [
      {
        q_id: 'q_1',
        type: 'text',
        label: 'Nama Lengkap Anda',
        required: true,
      },
    ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Switch to creating a new form
  const handleSwitchToNew = () => {
    setIsEditing(false);
    setTitle('');
    setDescription('');
    setIsActive(true);
    setQuestions([
      {
        q_id: 'q_' + Date.now(),
        type: 'text',
        label: 'Pertanyaan Baru',
        required: true,
      },
    ]);
    setStatusMessage(null);

    // Remove formId from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('formId');
    router.push('/admin/kuesioner');
  };

  // Add question
  const handleAddQuestion = (type: QuestionType = 'text') => {
    const newQ: Question = {
      q_id: 'q_' + Date.now(),
      type,
      label: 'Pertanyaan Baru',
      required: false,
      options: ['radio', 'checkbox', 'dropdown'].includes(type)
        ? ['Pilihan 1', 'Pilihan 2']
        : undefined,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  // Delete question
  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Update question property
  const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        const updated = { ...q, ...updates };

        // If changed to choice type and has no options, initialize options
        if (
          updates.type &&
          ['radio', 'checkbox', 'dropdown'].includes(updates.type) &&
          (!updated.options || updated.options.length === 0)
        ) {
          updated.options = ['Opsi 1', 'Opsi 2'];
        }

        return updated;
      })
    );
  };

  // Add option to a question
  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const currentOpts = q.options || [];
        return {
          ...q,
          options: [...currentOpts, `Opsi ${currentOpts.length + 1}`],
        };
      })
    );
  };

  // Update option label
  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const currentOpts = [...(q.options || [])];
        currentOpts[optIndex] = value;
        return {
          ...q,
          options: currentOpts,
        };
      })
    );
  };

  // Delete option from question
  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const currentOpts = (q.options || []).filter((_, oi) => oi !== optIndex);
        return {
          ...q,
          options: currentOpts,
        };
      })
    );
  };

  // Save form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Judul kuesioner wajib diisi.' });
      return;
    }

    if (questions.length === 0) {
      setStatusMessage({ type: 'error', text: 'Kuesioner minimal harus memiliki 1 pertanyaan.' });
      return;
    }

    // Validate options for choice-based questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (['radio', 'checkbox', 'dropdown'].includes(q.type)) {
        if (!q.options || q.options.length < 2) {
          setStatusMessage({
            type: 'error',
            text: `Pertanyaan "${q.label}" harus memiliki minimal 2 opsi pilihan.`,
          });
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      if (isEditing && existingForm) {
        const res = await updateFormAction(existingForm.id, {
          title: title.trim(),
          description: description.trim(),
          is_active: isActive,
          questions,
        });

        if (!res.success) {
          throw new Error(res.error || 'Gagal memperbarui formulir.');
        }

        setStatusMessage({ type: 'success', text: 'Kuesioner berhasil diperbarui!' });
        router.refresh();
      } else {
        const res = await createFormAction({
          title: title.trim(),
          description: description.trim(),
          is_active: isActive,
          questions,
        });

        if (!res.success) {
          throw new Error(res.error || 'Gagal membuat formulir baru.');
        }

        setStatusMessage({ type: 'success', text: 'Kuesioner baru berhasil dibuat!' });
        if (res.data?.id) {
          router.push(`/admin/dashboard?formId=${res.data.id}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-50">
      {/* Header Info Card */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-white/5 shadow-xs p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <FileEdit className="w-3.5 h-3.5 text-[#DF1A3D]" />
              {isEditing ? 'Mode Edit Formulir' : 'Mode Buat Formulir Baru'}
            </span>
            {isEditing && existingForm && (
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-lg">
                ID: {existingForm.id}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isEditing ? `Edit: ${existingForm?.title}` : 'Buat Kuesioner Baru'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Atur judul, deskripsi, dan buat skema daftar pertanyaan kuesioner secara dinamis.
          </p>
        </div>

        {/* Action Button: Create New Form */}
        {isEditing && (
          <button
            onClick={handleSwitchToNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#DF1A3D]" />
            <span>Buat Formulir Baru</span>
          </button>
        )}
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-3xl border flex items-center gap-3 text-xs sm:text-sm backdrop-blur-md shadow-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#DF1A3D] shrink-0" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Main Builder Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Form Metadata Section - Informasi Dasar Kuesioner Card */}
        <div className="bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-white/5 shadow-xs p-6 sm:p-7 space-y-5 transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#DF1A3D]" />
            Informasi Dasar Kuesioner
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Judul Kuesioner <span className="text-[#DF1A3D]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Survei Evaluasi SHARING VISION 2026"
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Deskripsi / Petunjuk Pengisian
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan petunjuk atau tujuan survei ini bagi responden..."
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 transition-all resize-y"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
                Status Kuesioner
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                Kuesioner aktif akan langsung ditampilkan pada halaman formulir publik.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="inline-flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              {isActive ? (
                <ToggleRight className="w-8 h-8 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-500 dark:text-slate-600" />
              )}
              <span className={`text-xs font-bold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Question Builder Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Daftar Pertanyaan ({questions.length})
            </h2>

            {/* Quick Add Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddQuestion('text')}
                className="px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                + Teks
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('radio')}
                className="px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                + Pilihan
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('checkbox')}
                className="px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                + Checkbox
              </button>
            </div>
          </div>

          {questions.map((q, qIndex) => {
            const isChoice = ['radio', 'checkbox', 'dropdown'].includes(q.type);

            return (
              <div
                key={q.q_id}
                className="bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/80 dark:border-white/5 shadow-xs p-5 sm:p-6 space-y-4 transition-all hover:border-slate-300 dark:hover:border-white/15"
              >
                {/* Question Top Row: Index, Label Input, Type Selector, Delete */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-rose-500/10 text-[#DF1A3D] dark:text-rose-400 text-xs font-extrabold flex items-center justify-center shrink-0 border border-rose-500/20">
                      {qIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={q.label}
                      onChange={(e) => handleUpdateQuestion(qIndex, { label: e.target.value })}
                      placeholder="Masukkan pertanyaan di sini..."
                      required
                      className="flex-1 font-bold text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    {/* Question Type Select */}
                    <div className="relative">
                      <select
                        value={q.type}
                        onChange={(e) =>
                          handleUpdateQuestion(qIndex, { type: e.target.value as QuestionType })
                        }
                        className="appearance-none pl-3 pr-8 py-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#181818] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 cursor-pointer"
                      >
                        <option value="text">Teks Singkat</option>
                        <option value="textarea">Paragraf / Teks Panjang</option>
                        <option value="radio">Pilihan Tunggal (Radio)</option>
                        <option value="checkbox">Pilihan Ganda (Checkbox)</option>
                        <option value="dropdown">Menu Tarik (Dropdown)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Required Checkbox */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleUpdateQuestion(qIndex, { required: e.target.checked })}
                        className="w-3.5 h-3.5 text-[#DF1A3D] rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-[#DF1A3D]/30"
                      />
                      <span>Wajib</span>
                    </label>

                    {/* Delete Question Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIndex)}
                      className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#DF1A3D] hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Hapus pertanyaan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Options List (for radio, checkbox, dropdown) */}
                {isChoice && (
                  <div className="pl-9 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                      Opsi Jawaban:
                    </span>
                    {(q.options || []).map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                          placeholder={`Opsi ${optIndex + 1}`}
                          required
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 transition-all"
                        />
                        {(q.options || []).length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(qIndex, optIndex)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#DF1A3D] hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Hapus opsi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      className="mt-1 text-xs text-[#DF1A3D] dark:text-rose-400 hover:opacity-80 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Opsi</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Bottom Bar */}
        <div className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 transition-colors">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Perubahan akan langsung disimpan ke database Firebase Firestore.
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#DF1A3D] hover:bg-[#c91434] shadow-lg shadow-[#DF1A3D]/25 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Formulir...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Kuesioner'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
