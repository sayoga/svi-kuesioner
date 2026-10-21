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
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Loader2,
  FolderPlus,
  HelpCircle,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { createFormAction, updateFormAction } from '@/actions/forms';
import type { FormRecord } from '@/types/form';
import type { QuestionType as SurveyQuestionType } from '@/types/survey';

interface QuestionnaireBuilderViewProps {
  initialData?: FormRecord | null;
  existingForm?: FormRecord | null;
  surveyId?: string;
  formId?: string;
  isLoading?: boolean;
}

export interface BuilderOption {
  value: string | number;
  label: string;
  subLabel?: string;
  terminate?: boolean;
  terminationReason?: string;
  hasFreeText?: boolean;
  freeTextPlaceholder?: string;
  skipToModuleId?: string;
  skipToQuestionId?: string;
}

export interface BuilderQuestion {
  id: string;
  code?: string;
  text: string;
  instruction?: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: (string | BuilderOption)[];
  scaleConfig?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
    neutralLabel?: string;
  };
  skipRules?: unknown[];
}

export interface BuilderModule {
  id: string;
  title: string;
  description?: string;
  questions: BuilderQuestion[];
}

export function QuestionnaireBuilderView({
  initialData,
  existingForm,
  surveyId,
  formId,
  isLoading = false,
}: QuestionnaireBuilderViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSurveyId = surveyId || formId;
  const form = initialData !== undefined ? initialData : existingForm;

  // 1. Loading state: If explicitly loading, or if activeSurveyId is specified but data is still undefined/pending
  if (isLoading || (activeSurveyId && activeSurveyId !== 'new' && form === undefined)) {
    return (
      <div className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-3xl p-12 text-center shadow-sm my-8 flex flex-col items-center justify-center animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-[#DF1A3D] dark:text-rose-400 flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Memuat data kuesioner...
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Mengambil konfigurasi modul dan pertanyaan dari database
        </p>
      </div>
    );
  }

  // Mode: edit existing form if provided, otherwise create new
  const [isEditing, setIsEditing] = useState<boolean>(!!form);
  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [isActive, setIsActive] = useState(form?.is_active ?? true);

  // Normalize initial modules strictly from initialData / existingForm (NO dummy or hardcoded questions)
  const [modules, setModules] = useState<BuilderModule[]>(() => {
    if (form?.modules && Array.isArray(form.modules) && form.modules.length > 0) {
      return form.modules.map((mod, modIdx) => ({
        id: mod.id || `mod_${modIdx + 1}`,
        title: mod.title || `Modul ${modIdx + 1}`,
        description: mod.description || '',
        questions: (mod.questions || []).map((q, qIdx) => ({
          id: q.id || (q as unknown as { q_id?: string }).q_id || `q_${qIdx + 1}`,
          code: q.code || '',
          text: q.text || (q as unknown as { label?: string }).label || '',
          instruction: q.instruction || '',
          type: q.type || 'text',
          required: q.required ?? false,
          placeholder: q.placeholder || '',
          options: q.options || [],
          scaleConfig: q.scaleConfig,
          skipRules: q.skipRules || [],
        })),
      }));
    }

    if (form?.questions && Array.isArray(form.questions) && form.questions.length > 0) {
      return [
        {
          id: 'M1',
          title: 'Modul Utama',
          description: '',
          questions: form.questions.map((q, qIdx) => ({
            id: (q as unknown as { id?: string }).id || q.q_id || `q_${qIdx + 1}`,
            code: `Q${qIdx + 1}`,
            text: (q as unknown as { text?: string }).text || q.label || '',
            type: q.type || 'text',
            required: q.required ?? false,
            options: q.options || [],
          })),
        },
      ];
    }

    // Default: Empty module array if creating new or no data available (no hardcoded questions)
    return [];
  });

  // Track accordion collapsed state per module
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Switch to creating a new form
  const handleSwitchToNew = () => {
    setIsEditing(false);
    setTitle('');
    setDescription('');
    setIsActive(true);
    setModules([]);
    setStatusMessage(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('formId');
    router.push('/admin/kuesioner');
  };

  // Module management
  const handleAddModule = () => {
    const nextChar = modules.length === 0 ? '1' : String.fromCharCode(65 + modules.length); // 1, or A, B, C...
    const newMod: BuilderModule = {
      id: nextChar,
      title: `Modul ${nextChar}`,
      description: '',
      questions: [],
    };
    setModules((prev) => [...prev, newMod]);
  };

  const handleDeleteModule = (moduleId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus modul ini beserta seluruh pertanyaannya?')) {
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    }
  };

  const handleUpdateModule = (moduleId: string, updates: Partial<BuilderModule>) => {
    setModules((prev) =>
      prev.map((mod) => (mod.id === moduleId ? { ...mod, ...updates } : mod))
    );
  };

  // Question management parameterized by moduleId
  const handleAddQuestion = (moduleId: string, type: SurveyQuestionType | string = 'text') => {
    const targetMod = modules.find((m) => m.id === moduleId);
    const count = (targetMod?.questions.length || 0) + 1;
    const newQId = `${moduleId}${count}_${Date.now().toString().slice(-4)}`;

    const isChoice = ['radio', 'checkbox', 'dropdown'].includes(type);
    const newQ: BuilderQuestion = {
      id: newQId,
      code: `${moduleId}${count}`,
      text: 'Pertanyaan Baru',
      type,
      required: false,
      options: isChoice
        ? [
            { value: '1', label: 'Pilihan 1' },
            { value: '2', label: 'Pilihan 2' },
          ]
        : undefined,
      scaleConfig: type === 'scale' ? { min: 1, max: 5, minLabel: 'Sangat Rendah', maxLabel: 'Sangat Tinggi' } : undefined,
    };

    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        return {
          ...mod,
          questions: [...mod.questions, newQ],
        };
      })
    );
  };

  const handleDeleteQuestion = (moduleId: string, questionIndex: number) => {
    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        return {
          ...mod,
          questions: mod.questions.filter((_, idx) => idx !== questionIndex),
        };
      })
    );
  };

  const handleUpdateQuestion = (
    moduleId: string,
    questionIndex: number,
    updates: Partial<BuilderQuestion>
  ) => {
    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        const newQuestions = mod.questions.map((q, qIdx) => {
          if (qIdx !== questionIndex) return q;
          const updated = { ...q, ...updates };

          // If type switched to choice and has no options, initialize options
          if (
            updates.type &&
            ['radio', 'checkbox', 'dropdown'].includes(updates.type) &&
            (!updated.options || updated.options.length === 0)
          ) {
            updated.options = [
              { value: '1', label: 'Pilihan 1' },
              { value: '2', label: 'Pilihan 2' },
            ];
          }

          if (updates.type === 'scale' && !updated.scaleConfig) {
            updated.scaleConfig = { min: 1, max: 5, minLabel: 'Sangat Rendah', maxLabel: 'Sangat Tinggi' };
          }

          return updated;
        });

        return { ...mod, questions: newQuestions };
      })
    );
  };

  // Option management parameterized by moduleId and questionIndex
  const handleAddOption = (moduleId: string, questionIndex: number) => {
    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        const newQuestions = mod.questions.map((q, qIdx) => {
          if (qIdx !== questionIndex) return q;
          const currentOpts = q.options || [];
          const nextVal = String(currentOpts.length + 1);
          const newOpt: BuilderOption = {
            value: nextVal,
            label: `Pilihan ${nextVal}`,
          };
          return {
            ...q,
            options: [...currentOpts, newOpt],
          };
        });
        return { ...mod, questions: newQuestions };
      })
    );
  };

  const handleUpdateOption = (
    moduleId: string,
    questionIndex: number,
    optionIndex: number,
    updatedLabel: string
  ) => {
    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        const newQuestions = mod.questions.map((q, qIdx) => {
          if (qIdx !== questionIndex) return q;
          const currentOpts = [...(q.options || [])];
          const target = currentOpts[optionIndex];
          if (typeof target === 'string') {
            currentOpts[optionIndex] = updatedLabel;
          } else {
            currentOpts[optionIndex] = { ...target, label: updatedLabel };
          }
          return { ...q, options: currentOpts };
        });
        return { ...mod, questions: newQuestions };
      })
    );
  };

  const handleDeleteOption = (moduleId: string, questionIndex: number, optionIndex: number) => {
    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id !== moduleId) return mod;
        const newQuestions = mod.questions.map((q, qIdx) => {
          if (qIdx !== questionIndex) return q;
          const currentOpts = (q.options || []).filter((_, oi) => oi !== optionIndex);
          return { ...q, options: currentOpts };
        });
        return { ...mod, questions: newQuestions };
      })
    );
  };

  // Calculate total questions across all modules
  const totalQuestions = modules.reduce((sum, mod) => sum + mod.questions.length, 0);

  // Save form handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Judul kuesioner wajib diisi.' });
      return;
    }

    if (modules.length === 0) {
      setStatusMessage({ type: 'error', text: 'Kuesioner minimal harus memiliki 1 modul.' });
      return;
    }

    if (totalQuestions === 0) {
      setStatusMessage({ type: 'error', text: 'Kuesioner minimal harus memiliki setidaknya 1 pertanyaan.' });
      return;
    }

    // Flatten questions for backward-compatibility with legacy consumers
    const flatQuestions = modules.flatMap((mod) =>
      mod.questions.map((q) => ({
        q_id: q.id,
        id: q.id,
        label: q.text,
        text: q.text,
        type: q.type as any,
        required: q.required ?? false,
        options: q.options?.map((opt) => (typeof opt === 'string' ? opt : opt.label)) || [],
      }))
    );

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        is_active: isActive,
        modules: modules as any,
        questions: flatQuestions as any,
      };

      if (isEditing && existingForm) {
        const res = await updateFormAction(existingForm.id, payload as any);
        if (!res.success) {
          throw new Error(res.error || 'Gagal memperbarui formulir.');
        }
        setStatusMessage({ type: 'success', text: 'Kuesioner berhasil diperbarui dengan skema modular!' });
        router.refresh();
      } else {
        const res = await createFormAction(payload as any);
        if (!res.success) {
          throw new Error(res.error || 'Gagal membuat formulir baru.');
        }
        setStatusMessage({ type: 'success', text: 'Kuesioner modular baru berhasil dibuat!' });
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
              {isEditing ? 'Mode Edit Formulir (Modular)' : 'Mode Buat Formulir Baru (Modular)'}
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
            Kuesioner terstruktur multi-modul dengan dukungan skip logic dan percabangan pertanyaan.
          </p>
        </div>

        {/* Action Button: Create New Form */}
        {isEditing && (
          <button
            type="button"
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
              placeholder="Contoh: Kuesioner Survei Layanan UMKM BRI"
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

        {/* Modules & Questions Nested Rendering Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Struktur Modul & Pertanyaan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total {modules.length} Modul &bull; {totalQuestions} Total Pertanyaan
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddModule}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-[#DF1A3D] dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Tambah Modul Baru</span>
            </button>
          </div>

          {/* Iterate over form.modules */}
          {modules.length === 0 ? (
            <div className="bg-white dark:bg-[#121212] rounded-3xl border border-dashed border-slate-300 dark:border-white/10 p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-[#DF1A3D] dark:text-rose-400 mx-auto flex items-center justify-center">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Belum Ada Modul
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Kuesioner ini belum memiliki modul atau pertanyaan. Klik tombol di bawah untuk menambahkan modul pertama.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddModule}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#DF1A3D] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[#c01433] transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Buat Modul Pertama</span>
              </button>
            </div>
          ) : (
            modules.map((moduleItem, modIdx) => {
            const isCollapsed = Boolean(collapsedModules[moduleItem.id]);

            return (
              <div
                key={moduleItem.id}
                className="bg-white dark:bg-[#121212] rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-sm overflow-hidden transition-all"
              >
                {/* Module Header / Accordion Bar */}
                <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="px-3 py-1.5 rounded-xl bg-[#DF1A3D] text-white text-xs font-extrabold tracking-wider shrink-0 shadow-sm shadow-[#DF1A3D]/25">
                        MODUL {moduleItem.id}
                      </span>
                      <input
                        type="text"
                        value={moduleItem.title}
                        onChange={(e) =>
                          handleUpdateModule(moduleItem.id, { title: e.target.value })
                        }
                        placeholder="Judul Modul (misal: Modul S - Screening)"
                        required
                        className="flex-1 font-bold text-sm sm:text-base text-slate-900 dark:text-white bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2 placeholder:text-slate-400 focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/70 dark:border-white/10">
                        {moduleItem.questions.length} pertanyaan
                      </span>

                      {/* Accordion Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleModuleCollapse(moduleItem.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title={isCollapsed ? 'Buka modul' : 'Tutup modul'}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete Module Button */}
                      {modules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(moduleItem.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#DF1A3D] hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Hapus Modul"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Module Description Input */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={moduleItem.description || ''}
                      onChange={(e) =>
                        handleUpdateModule(moduleItem.id, { description: e.target.value })
                      }
                      placeholder="Deskripsi singkat modul ini (opsional)..."
                      className="w-full text-xs text-slate-600 dark:text-slate-300 bg-transparent border-b border-dashed border-slate-200 dark:border-white/10 px-1 py-1 focus:outline-none focus:border-[#DF1A3D] transition-colors"
                    />
                  </div>

                  {/* Quick Add Question Bar for this specific module */}
                  {!isCollapsed && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 dark:border-white/5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Tambah Pertanyaan ke Modul {moduleItem.id}:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(moduleItem.id, 'text')}
                          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          + Teks
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(moduleItem.id, 'radio')}
                          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          + Pilihan Tunggal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(moduleItem.id, 'checkbox')}
                          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          + Pilihan Ganda
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(moduleItem.id, 'number')}
                          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          + Angka
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(moduleItem.id, 'scale')}
                          className="px-3 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          + Skala Nilai
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nested Questions Container (Accordion Body) */}
                {!isCollapsed && (
                  <div className="p-5 sm:p-6 space-y-4 bg-slate-100/50 dark:bg-black/20">
                    {moduleItem.questions.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
                        <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Belum ada pertanyaan di Modul {moduleItem.id}.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddQuestion(moduleItem.id, 'text')}
                          className="mt-3 text-xs text-[#DF1A3D] font-bold hover:underline cursor-pointer"
                        >
                          + Tambah Pertanyaan Pertama
                        </button>
                      </div>
                    ) : (
                      moduleItem.questions.map((q, qIndex) => {
                        const isChoice = ['radio', 'checkbox', 'dropdown'].includes(q.type);
                        const hasSkipRules = Boolean(
                          (q.skipRules && Array.isArray(q.skipRules) && q.skipRules.length > 0) ||
                            q.options?.some(
                              (opt) => typeof opt !== 'string' && (opt.terminate || opt.skipToModuleId || opt.skipToQuestionId)
                            )
                        );

                        return (
                          <div
                            key={q.id || `${moduleItem.id}_${qIndex}`}
                            className="bg-white dark:bg-[#181818] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-5 space-y-4 transition-all hover:border-slate-300 dark:hover:border-white/20"
                          >
                            {/* Question Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-8 h-7 rounded-xl bg-rose-500/10 text-[#DF1A3D] dark:text-rose-400 text-xs font-extrabold flex items-center justify-center shrink-0 border border-rose-500/20">
                                  {q.code || `${moduleItem.id}.${qIndex + 1}`}
                                </span>
                                <input
                                  type="text"
                                  value={q.text}
                                  onChange={(e) =>
                                    handleUpdateQuestion(moduleItem.id, qIndex, { text: e.target.value })
                                  }
                                  placeholder="Tuliskan pertanyaan di sini..."
                                  required
                                  className="flex-1 font-bold text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 placeholder:text-slate-400 focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 focus:outline-none transition-all"
                                />
                              </div>

                              <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                                {/* Question Type Select */}
                                <div className="relative">
                                  <select
                                    value={q.type}
                                    onChange={(e) =>
                                      handleUpdateQuestion(moduleItem.id, qIndex, { type: e.target.value })
                                    }
                                    className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202020] text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 cursor-pointer"
                                  >
                                    <option value="text">Teks Singkat</option>
                                    <option value="textarea">Paragraf / Teks Panjang</option>
                                    <option value="radio">Pilihan Tunggal (Radio)</option>
                                    <option value="checkbox">Pilihan Ganda (Checkbox)</option>
                                    <option value="number">Angka / Numerik</option>
                                    <option value="scale">Skala Likert / Rating</option>
                                    <option value="dropdown">Menu Tarik (Dropdown)</option>
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                {/* Required Checkbox */}
                                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={q.required}
                                    onChange={(e) =>
                                      handleUpdateQuestion(moduleItem.id, qIndex, { required: e.target.checked })
                                    }
                                    className="w-3.5 h-3.5 text-[#DF1A3D] rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-[#DF1A3D]/30"
                                  />
                                  <span>Wajib</span>
                                </label>

                                {/* Delete Question Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(moduleItem.id, qIndex)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#DF1A3D] hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Hapus pertanyaan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Additional Question Metadata: Instruction, Placeholder & Skip Badge */}
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              {q.placeholder !== undefined && (
                                <div className="flex-1 min-w-[200px]">
                                  <input
                                    type="text"
                                    value={q.placeholder || ''}
                                    onChange={(e) =>
                                      handleUpdateQuestion(moduleItem.id, qIndex, { placeholder: e.target.value })
                                    }
                                    placeholder="Placeholder input (opsional)..."
                                    className="w-full px-3 py-1 text-xs rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-[#DF1A3D]"
                                  />
                                </div>
                              )}

                              {hasSkipRules && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <ShieldAlert className="w-3 h-3 text-amber-500" />
                                  Ada Aturan Skip / Terminate
                                </span>
                              )}
                            </div>

                            {/* Scale Config UI for Likert scale */}
                            {q.type === 'scale' && (
                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex flex-wrap items-center gap-3 text-xs">
                                <Sliders className="w-4 h-4 text-[#DF1A3D]" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  Skala: {q.scaleConfig?.min || 1} s.d. {q.scaleConfig?.max || 5}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  Label Min: &ldquo;{q.scaleConfig?.minLabel || 'Sangat Tidak Puas'}&rdquo;
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  Label Max: &ldquo;{q.scaleConfig?.maxLabel || 'Sangat Puas'}&rdquo;
                                </span>
                              </div>
                            )}

                            {/* Options List (for radio, checkbox, dropdown) */}
                            {isChoice && (
                              <div className="pl-6 pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                  Opsi Pilihan:
                                </span>
                                {(q.options || []).map((opt, optIndex) => {
                                  const optLabel = typeof opt === 'string' ? opt : opt.label;
                                  const isTerminated = typeof opt !== 'string' && Boolean(opt.terminate);

                                  return (
                                    <div key={optIndex} className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                      <input
                                        type="text"
                                        value={optLabel}
                                        onChange={(e) =>
                                          handleUpdateOption(moduleItem.id, qIndex, optIndex, e.target.value)
                                        }
                                        placeholder={`Opsi ${optIndex + 1}`}
                                        required
                                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 transition-all"
                                      />

                                      {isTerminated && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-[#DF1A3D] dark:text-rose-400 border border-rose-500/20 shrink-0">
                                          Terminate
                                        </span>
                                      )}

                                      {(q.options || []).length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteOption(moduleItem.id, qIndex, optIndex)}
                                          className="p-1 rounded-lg text-slate-400 hover:text-[#DF1A3D] hover:bg-rose-500/10 transition-colors cursor-pointer"
                                          title="Hapus opsi"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}

                                <button
                                  type="button"
                                  onClick={() => handleAddOption(moduleItem.id, qIndex)}
                                  className="mt-1 text-xs text-[#DF1A3D] dark:text-rose-400 hover:opacity-80 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Tambah Opsi</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>

        {/* Action Bottom Bar */}
        <div className="bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 transition-colors">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Perubahan struktur modul dan pertanyaan akan langsung disimpan ke database Firebase Firestore.
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
