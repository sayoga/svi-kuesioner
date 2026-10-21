'use client';

import { useState, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  RotateCcw,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Layers,
  Save,
  Search,
  ClipboardList,
} from 'lucide-react';
import type { FormRecord } from '@/types/form';
import type { AnswerValue } from '@/types/response';
import type { Module, Question as SurveyQuestion, QuestionOption } from '@/types/survey';
import { SearchableSelect } from '@/components/SearchableSelect';

interface RespondentFormProps {
  form: FormRecord;
}

interface FormValues {
  respondent_name: string;
  answers: Record<string, AnswerValue>;
}

interface TerminationState {
  isTerminated: boolean;
  reason?: string;
  questionId?: string;
}

function sanitizeFirestorePayload<T extends Record<string, unknown>>(data: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      sanitized[key] = val;
    }
  }
  return sanitized as T;
}

export function RespondentForm({ form }: RespondentFormProps) {
  // CAPI Session States
  const [activeRespondentName, setActiveRespondentName] = useState('');
  const [responseDocId, setResponseDocId] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<{
    type: 'loading' | 'found' | 'new';
    text: string;
  } | null>(null);
  const checkedNameRef = useRef<string>('');

  // Wizard Navigation & Submission States
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [terminationState, setTerminationState] = useState<TerminationState>({
    isTerminated: false,
  });

  // Normalize modules: support modular forms or fallback for legacy flat forms
  const activeModules: Module[] = useMemo(() => {
    if (form.modules && Array.isArray(form.modules) && form.modules.length > 0) {
      return form.modules;
    }
    if (form.questions && Array.isArray(form.questions) && form.questions.length > 0) {
      return [
        {
          id: 'M1',
          title: form.title || 'Modul Utama',
          description: form.description || '',
          questions: form.questions.map((q) => ({
            id: q.q_id,
            code: q.q_id,
            text: q.label,
            type: q.type as SurveyQuestion['type'],
            required: q.required,
            options: (q.options || []).map((opt) => ({
              value: opt,
              label: opt,
            })),
          })),
        },
      ];
    }
    return [];
  }, [form]);

  // Extract all questions across all modules for default values
  const allQuestions: SurveyQuestion[] = useMemo(() => {
    return activeModules.flatMap((m) => m.questions || []);
  }, [activeModules]);

  // Setup default form values for all questions across all modules
  const defaultAnswers: Record<string, AnswerValue> = useMemo(() => {
    const defaults: Record<string, AnswerValue> = {};
    for (const q of allQuestions) {
      const qId = q.id || '';
      if (!qId) continue;
      if (q.type === 'checkbox') {
        defaults[qId] = [];
      } else {
        defaults[qId] = '';
      }
    }
    return defaults;
  }, [allQuestions]);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      respondent_name: '',
      answers: defaultAnswers,
    },
    mode: 'onTouched',
  });

  // Watch answers to allow reactive checks (e.g. conditional rendering / terminate checks)
  const watchedAnswers = watch('answers');

  // Currently active module
  const currentModule: Module = activeModules[currentModuleIndex] || {
    id: '',
    title: 'Kuesioner',
    description: '',
    questions: [],
  };

  const currentQuestions: SurveyQuestion[] = currentModule.questions || [];
  const totalModules = activeModules.length;
  const progressPercentage =
    totalModules > 0 ? Math.round(((currentModuleIndex + 1) / totalModules) * 100) : 100;

  // CAPI: Auto-load / Check session on blur or manual click
  const handleCheckSession = async (name: string) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return;

    if (checkedNameRef.current === cleanName) return;

    setIsCheckingSession(true);
    setSessionStatus({ type: 'loading', text: 'Memeriksa data draft...' });

    try {
      if (!db) {
        console.warn('[RespondentForm] Firestore db is not initialized yet');
        return;
      }
      const responsesRef = collection(db, 'responses');
      // Query Firestore responses collection for matching surveyId AND respondentName
      let q = query(
        responsesRef,
        where('form_id', '==', form.id),
        where('respondent_name', '==', cleanName)
      );
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Fallback with surveyId / respondentName
        const fallbackQ = query(
          responsesRef,
          where('surveyId', '==', form.id),
          where('respondentName', '==', cleanName)
        );
        querySnapshot = await getDocs(fallbackQ);
      }

      if (!querySnapshot.empty) {
        // 1. Found existing session! Resume draft answers and last module index
        const docSnap = querySnapshot.docs[0];
        const docData = docSnap.data();
        const docId = docSnap.id;

        const savedModuleIndex =
          typeof docData.current_module_index === 'number'
            ? docData.current_module_index
            : typeof docData.currentModuleIndex === 'number'
            ? docData.currentModuleIndex
            : 0;

        const clampedModuleIndex = Math.min(
          Math.max(0, savedModuleIndex),
          Math.max(0, activeModules.length - 1)
        );

        const loadedAnswers = {
          ...defaultAnswers,
          ...(docData.answers || {}),
        };

        reset({
          respondent_name: cleanName,
          answers: loadedAnswers,
        });

        setResponseDocId(docId);
        setActiveRespondentName(cleanName);
        setCurrentModuleIndex(clampedModuleIndex);
        checkedNameRef.current = cleanName;

        setSessionStatus({
          type: 'found',
          text: `Draft ditemukan! Melanjutkan di ${
            activeModules[clampedModuleIndex]?.title || `Modul ${clampedModuleIndex + 1}`
          }`,
        });
      } else {
        // 2. Not found: Ready for new session
        setActiveRespondentName(cleanName);
        checkedNameRef.current = cleanName;
        setSessionStatus({
          type: 'new',
          text: 'Draft baru siap diisi',
        });
      }
    } catch (err: unknown) {
      console.warn('Error checking existing draft session:', err);
      setSessionStatus(null);
    } finally {
      setIsCheckingSession(false);
    }
  };

  // Evaluate if current module answers trigger early termination
  const checkTermination = (currentAnswers: Record<string, AnswerValue>): TerminationState => {
    for (const q of currentQuestions) {
      const qId = q.id || '';
      const ans = currentAnswers?.[qId];

      if (ans === undefined || ans === null || ans === '') continue;

      // 1. Check option-level termination
      if (q.options && Array.isArray(q.options)) {
        for (const opt of q.options) {
          if (typeof opt !== 'string' && opt.terminate) {
            if (String(opt.value) === String(ans)) {
              return {
                isTerminated: true,
                reason: opt.terminationReason || 'Kriteria responden tidak memenuhi syarat untuk survei ini.',
                questionId: qId,
              };
            }
          }
        }
      }

      // 2. Check question-level skipRules with terminate action
      if (q.skipRules && Array.isArray(q.skipRules)) {
        for (const rule of q.skipRules) {
          if (rule.action === 'terminate') {
            const conditions = rule.conditions || (rule.condition ? [rule.condition] : []);
            const logic = rule.conditionLogic || 'and';

            const checkCond = (cond: { operator: string; value?: unknown }) => {
              const op = cond.operator;
              const targetVal = cond.value;

              if (op === 'less_than') {
                return Number(ans) < Number(targetVal);
              }
              if (op === 'greater_than') {
                return Number(ans) > Number(targetVal);
              }
              if (op === 'equals') {
                if (Array.isArray(ans) && Array.isArray(targetVal)) {
                  return targetVal.every((t) => ans.includes(t)) && ans.length === targetVal.length;
                }
                if (Array.isArray(ans)) {
                  return ans.includes(targetVal as string);
                }
                return String(ans) === String(targetVal);
              }
              return false;
            };

            const isTriggered =
              logic === 'or' ? conditions.some(checkCond) : conditions.every(checkCond);

            if (isTriggered) {
              return {
                isTerminated: true,
                reason: rule.terminationReason || 'Kriteria responden tidak memenuhi persyaratan survei ini.',
                questionId: qId,
              };
            }
          }
        }
      }
    }

    return { isTerminated: false };
  };

  // Step Navigation: Next Module with Auto-Save
  const handleNext = async () => {
    // 1. Collect all field names in current module that are currently visible
    const visibleQuestions = currentQuestions.filter((q) => {
      if (q.displayCondition) {
        const observedField = q.displayCondition.field;
        const observedAnswer = watchedAnswers?.[observedField];
        const condValue = q.displayCondition.value;

        if (q.displayCondition.operator === 'contains') {
          return (
            Array.isArray(observedAnswer) &&
            observedAnswer.some((val) =>
              String(val).toLowerCase().includes(String(condValue).toLowerCase())
            )
          );
        } else if (q.displayCondition.operator === 'equals') {
          return String(observedAnswer) === String(condValue);
        }
      }
      return true;
    });

    const currentFields = visibleQuestions.map((q) => `answers.${q.id}` as const);

    // 2. Trigger validation for fields in current module only
    const isValid = await trigger(currentFields);
    if (!isValid) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('[aria-invalid="true"], .border-rose-400');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // 3. Evaluate termination rules for the current step
    const currentAnswers = getValues('answers');
    const termCheck = checkTermination(currentAnswers);
    if (termCheck.isTerminated) {
      setTerminationState(termCheck);
      if (responseDocId) {
        updateDoc(doc(db, 'responses', responseDocId), {
          answers: currentAnswers,
          status: 'terminated',
          termination_reason: termCheck.reason,
          updated: new Date().toISOString(),
        }).catch(console.error);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. Auto-save current answers & updated module position to Firestore
    const respondentName = (getValues('respondent_name') || activeRespondentName || '').trim();

    if (!db) {
      console.warn('[RespondentForm] Firestore db instance is not initialized yet');
      if (currentModuleIndex < totalModules - 1) {
        setCurrentModuleIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (responseDocId) {
      setIsAutoSaving(true);
      try {
        await updateDoc(
          doc(db, 'responses', responseDocId),
          sanitizeFirestorePayload({
            answers: currentAnswers,
            current_module_index: currentModuleIndex + 1,
            currentModuleIndex: currentModuleIndex + 1,
            updated: new Date().toISOString(),
          })
        );
      } catch (err) {
        console.error('Error during auto-save per module:', err);
      } finally {
        setIsAutoSaving(false);
      }
    } else if (respondentName) {
      // Create new draft document in Firestore on first "Selanjutnya"
      setIsAutoSaving(true);
      try {
        const nowIso = new Date().toISOString();
        const newDocRef = await addDoc(
          collection(db, 'responses'),
          sanitizeFirestorePayload({
            form_id: form.id,
            surveyId: form.id,
            relation: form.id,
            respondent_name: respondentName,
            respondentName: respondentName,
            status: 'draft',
            current_module_index: currentModuleIndex + 1,
            currentModuleIndex: currentModuleIndex + 1,
            answers: currentAnswers,
            created: nowIso,
            updated: nowIso,
          })
        );
        setResponseDocId(newDocRef.id);
        setActiveRespondentName(respondentName);
      } catch (err) {
        console.error('Error creating draft on next:', err);
      } finally {
        setIsAutoSaving(false);
      }
    }

    // 5. Proceed to next module
    if (currentModuleIndex < totalModules - 1) {
      setCurrentModuleIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step Navigation: Previous Module
  const handlePrev = async () => {
    if (currentModuleIndex > 0) {
      if (responseDocId) {
        const currentAnswers = getValues('answers');
        updateDoc(
          doc(db, 'responses', responseDocId),
          sanitizeFirestorePayload({
            answers: currentAnswers,
            current_module_index: currentModuleIndex - 1,
            currentModuleIndex: currentModuleIndex - 1,
            updated: new Date().toISOString(),
          })
        ).catch(console.error);
      }
      setCurrentModuleIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submission handler (only called on final step)
  const onSubmit = async (data: FormValues) => {
    // Final termination check
    const termCheck = checkTermination(data.answers);
    if (termCheck.isTerminated) {
      setTerminationState(termCheck);
      if (responseDocId) {
        updateDoc(
          doc(db, 'responses', responseDocId),
          sanitizeFirestorePayload({
            answers: data.answers,
            status: 'terminated',
            termination_reason: termCheck.reason,
            updated: new Date().toISOString(),
          })
        ).catch(console.error);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const nowIso = new Date().toISOString();
      const respondentName = (data.respondent_name || activeRespondentName || 'Anonymous').trim();

      if (responseDocId) {
        // Complete the existing draft document in Firestore
        await updateDoc(
          doc(db, 'responses', responseDocId),
          sanitizeFirestorePayload({
            respondent_name: respondentName,
            respondentName: respondentName,
            answers: {
              ...data.answers,
              _submitted_at: nowIso,
            },
            status: 'completed',
            current_module_index: totalModules - 1,
            currentModuleIndex: totalModules - 1,
            completed_at: nowIso,
            updated: nowIso,
          })
        );
        setSubmittedId(responseDocId);
      } else {
        // Fallback to API endpoint
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
          throw new Error(json.error || json.message || 'Gagal mengirim jawaban kuesioner.');
        }

        setSubmittedId(json.data?.id || null);
      }

      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form or start new survey
  const handleResetForm = () => {
    reset({
      respondent_name: '',
      answers: defaultAnswers,
    });
    setCurrentModuleIndex(0);
    setSubmitSuccess(false);
    setSubmitError(null);
    setSubmittedId(null);
    setTerminationState({ isTerminated: false });
    setActiveRespondentName('');
    setResponseDocId(null);
    setSessionStatus(null);
    checkedNameRef.current = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. TERMINATION STATE
  if (terminationState.isTerminated) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden text-center p-8 sm:p-12 transition-all text-[#1E293B]">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-6 ring-8 ring-amber-50 border border-amber-200 shadow-inner">
            <XCircle className="w-10 h-10 text-[#DF1A3D]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#DF1A3D] border border-rose-200 mb-4">
            Penapisan Kriteria Responden
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
            Terima Kasih atas Partisipasi Anda
          </h2>

          <p className="text-[#475569] text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            {terminationState.reason ||
              'Berdasarkan kriteria riset yang telah ditetapkan, profil Anda belum sesuai dengan sasaran target responden survei ini.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] transition-all shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Mulai Ulang Survei
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. SUCCESS STATE
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

          <p className="text-[#475569] text-sm sm:text-base max-w-md mx-auto mb-4 leading-relaxed">
            Jawaban wawancara untuk{' '}
            <strong className="text-[#0F172A] font-semibold">{activeRespondentName || 'Responden'}</strong> pada{' '}
            kuesioner <strong className="text-[#0F172A] font-semibold">{form.title}</strong> telah
            berhasil disimpan lengkap ke basis data.
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
              Mulai Sesi Responden Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helpers for options
  const getOptValue = (opt: string | QuestionOption): string => {
    if (typeof opt === 'string') return opt;
    return String(opt.value);
  };

  const getOptLabel = (opt: string | QuestionOption): string => {
    if (typeof opt === 'string') return opt;
    return opt.label;
  };

  const getOptSubLabel = (opt: string | QuestionOption): string | undefined => {
    if (typeof opt === 'string') return undefined;
    return opt.subLabel;
  };

  // 3. MAIN WIZARD QUESTIONNAIRE (Directly Rendered)
  return (
    <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
      {/* Main Survey Title & Description Card (Static at Top) */}
      <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden transition-all hover:shadow-lg text-[#1E293B]">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#DF1A3D] to-[#A30018]" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#DF1A3D] border border-rose-200">
            <ClipboardList className="w-3.5 h-3.5" />
            Kuesioner Resmi
          </span>
          <span className="text-xs text-[#64748B] font-medium font-mono">
            {allQuestions.length} Total Pertanyaan
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-2">
          {form.title}
        </h1>

        {form.description && (
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            {form.description}
          </p>
        )}
      </div>

      {/* Wizard Progress Bar & Stepper Card */}
      <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-5 sm:p-6 mb-6 transition-all hover:shadow-lg text-[#1E293B]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#DF1A3D] border border-rose-200">
              <Layers className="w-3.5 h-3.5" />
              Langkah {currentModuleIndex + 1} dari {totalModules}
            </span>
            <span className="text-xs text-[#64748B] font-medium font-mono hidden sm:inline">
              {currentQuestions.length} Pertanyaan di Modul Ini
            </span>
          </div>

          <span className="text-xs font-bold text-[#DF1A3D] font-mono">
            {progressPercentage}% Selesai
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#DF1A3D] to-[#A30018] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Module Steps Navigation Pills */}
        {totalModules > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {activeModules.map((mod, idx) => {
              const isActiveStep = idx === currentModuleIndex;
              const isPassed = idx < currentModuleIndex;

              return (
                <div
                  key={mod.id || idx}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActiveStep
                      ? 'bg-[#DF1A3D] text-white shadow-sm'
                      : isPassed
                      ? 'bg-rose-50 text-[#DF1A3D] border border-rose-200'
                      : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white/20">
                    {idx + 1}
                  </span>
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {mod.title.split('-')[0].trim() || `Modul ${mod.id}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Module Header Card */}
      <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-5 sm:p-7 mb-6 relative overflow-hidden transition-all hover:shadow-lg text-[#1E293B]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Layers className="w-3.5 h-3.5" />
            Modul {currentModuleIndex + 1}: {currentModule.title}
          </span>
          <span className="text-xs text-[#64748B] font-medium font-mono">
            {currentQuestions.length} Pertanyaan di Modul Ini
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight mb-1.5">
          {currentModule.title}
        </h2>

        {currentModule.description && (
          <p className="text-[#475569] text-xs sm:text-sm md:text-base leading-relaxed">
            {currentModule.description}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
          <span className="flex items-center gap-1 text-[#334155]">
            <span className="text-red-600 font-bold">*</span> Menandakan pertanyaan wajib diisi
          </span>
          <span className="hidden sm:inline">Data Anda dilindungi dan terenkripsi aman</span>
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
        {/* Inline Respondent Name Card at Top of Form */}
        <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-4 sm:p-6 md:p-7 transition-all hover:shadow-lg focus-within:border-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-red-600 border border-rose-100 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <label htmlFor="respondent_name" className="text-base font-bold text-[#0F172A] block">
                Nama Lengkap Responden / Inisial
              </label>
            </div>

            {sessionStatus && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold animate-fadeIn ${
                  sessionStatus.type === 'found'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : sessionStatus.type === 'loading'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {sessionStatus.type === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {sessionStatus.type === 'found' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {sessionStatus.type === 'new' && <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                {sessionStatus.text}
              </span>
            )}
          </div>

          <p className="text-xs text-[#64748B] mb-3">
            Ketik nama responden lalu klik luar (blur) atau klik &quot;Cek Data&quot; untuk me-resume isian draft sebelumnya.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                id="respondent_name"
                type="text"
                placeholder="Contoh: Budi Santoso atau Toko Berkah"
                {...register('respondent_name')}
                onBlur={(e) => handleCheckSession(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCheckSession(getValues('respondent_name'));
                  }
                }}
                className="bg-white border border-[#CBD5E1] text-[#1E293B] placeholder-[#94A3B8] rounded-xl px-4 py-3 w-full focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => handleCheckSession(getValues('respondent_name'))}
              disabled={isCheckingSession}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isCheckingSession ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                  <span>Mengecek...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-slate-500" />
                  <span>Cek Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Questions for Active Module (Always Rendered) */}
        {currentQuestions.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
            Tidak ada pertanyaan pada modul ini.
          </div>
        ) : (
          currentQuestions.map((q, index) => {
            const qId = q.id || `q_${index}`;
            const qText = q.text || '';
            const qCode = q.code || `${currentModule.id}.${index + 1}`;
            const fieldName = `answers.${qId}` as const;
            const fieldError = errors.answers?.[qId];
            const isDropdownOpen = openDropdownId === qId;
            const baseZIndex = Math.max(10, 40 - index);

            // Dynamic displayCondition check
            if (q.displayCondition) {
              const observedField = q.displayCondition.field;
              const observedAnswer = watchedAnswers?.[observedField];
              const condValue = q.displayCondition.value;

              if (q.displayCondition.operator === 'contains') {
                const containsMatch =
                  Array.isArray(observedAnswer) &&
                  observedAnswer.some((val) =>
                    String(val).toLowerCase().includes(String(condValue).toLowerCase())
                  );
                if (!containsMatch) return null;
              } else if (q.displayCondition.operator === 'equals') {
                if (String(observedAnswer) !== String(condValue)) return null;
              }
            }

            return (
              <div
                key={qId}
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
                  <span className="shrink-0 px-2 h-7 rounded-lg bg-rose-50 border border-rose-200/60 text-[#DF1A3D] text-xs font-extrabold flex items-center justify-center mt-0.5">
                    {qCode}
                  </span>
                  <div className="flex-1">
                    <label className="text-base sm:text-lg font-bold text-[#0F172A] block leading-snug">
                      {qText}
                      {q.required && (
                        <span className="text-red-600 ml-1 font-extrabold" title="Wajib diisi">
                          *
                        </span>
                      )}
                    </label>
                    {q.instruction && (
                      <span className="text-xs text-[#64748B] font-medium block mt-1">
                        {q.instruction}
                      </span>
                    )}
                  </div>
                </div>

                {/* Input Render By Question Type */}

                {/* 1. TEXT */}
                {q.type === 'text' && (
                  <div>
                    <input
                      type="text"
                      placeholder={q.placeholder || 'Ketik jawaban Anda di sini...'}
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
                      placeholder={q.placeholder || 'Tuliskan jawaban lengkap Anda di sini...'}
                      {...register(fieldName, {
                        required: q.required ? 'Pertanyaan ini wajib diisi' : false,
                      })}
                      className="bg-white border border-[#CBD5E1] text-[#1E293B] placeholder-[#94A3B8] rounded-lg p-3 w-full focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-sm resize-y"
                    />
                  </div>
                )}

                {/* 3. NUMBER */}
                {q.type === 'number' && (
                  <div>
                    <input
                      type="number"
                      placeholder={q.placeholder || 'Masukkan angka...'}
                      {...register(fieldName, {
                        required: q.required ? 'Pertanyaan ini wajib diisi' : false,
                        valueAsNumber: true,
                      })}
                      className="bg-white border border-[#CBD5E1] text-[#1E293B] placeholder-[#94A3B8] rounded-lg p-3 w-full sm:w-64 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all outline-none text-sm"
                    />
                  </div>
                )}

                {/* 4. RADIO */}
                {q.type === 'radio' && (
                  <div className="space-y-2.5">
                    {q.options && q.options.length > 0 ? (
                      q.options.map((option, optIdx) => {
                        const optVal = getOptValue(option);
                        const optLabel = getOptLabel(option);
                        const optSubLabel = getOptSubLabel(option);
                        const currentVal = watchedAnswers?.[qId];
                        const isSelected = String(currentVal) === optVal;

                        return (
                          <label
                            key={optIdx}
                            className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#DF1A3D] bg-rose-50/50 shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              value={optVal}
                              {...register(fieldName, {
                                required: q.required ? 'Silakan pilih salah satu opsi' : false,
                              })}
                              className="w-4 h-4 mt-0.5 accent-red-600 text-red-600 border-[#CBD5E1] focus:ring-red-600/20 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-[#1E293B] block">
                                {optLabel}
                              </span>
                              {optSubLabel && (
                                <span className="text-xs text-[#64748B] block mt-0.5">
                                  {optSubLabel}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-xs text-amber-600">Opsi radio belum dikonfigurasi.</p>
                    )}
                  </div>
                )}

                {/* 5. CHECKBOX */}
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

                      const handleToggle = (optVal: string) => {
                        if (currentValues.includes(optVal)) {
                          field.onChange(currentValues.filter((v) => v !== optVal));
                        } else {
                          field.onChange([...currentValues, optVal]);
                        }
                      };

                      return (
                        <div className="space-y-2.5">
                          {q.options && q.options.length > 0 ? (
                            q.options.map((option, optIdx) => {
                              const optVal = getOptValue(option);
                              const optLabel = getOptLabel(option);
                              const isChecked = currentValues.includes(optVal);

                              return (
                                <label
                                  key={optIdx}
                                  onClick={() => handleToggle(optVal)}
                                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                    isChecked
                                      ? 'border-[#DF1A3D] bg-rose-50/50 text-[#0F172A] shadow-xs'
                                      : 'border-slate-200 bg-white hover:bg-slate-50 text-[#1E293B]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="w-4 h-4 mt-0.5 accent-red-600 text-red-600 rounded border-[#CBD5E1] focus:ring-red-600/20 cursor-pointer"
                                  />
                                  <span className="text-sm font-semibold">{optLabel}</span>
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

                {/* 6. SCALE / LIKERT RATING */}
                {q.type === 'scale' && (
                  <Controller
                    name={fieldName}
                    control={control}
                    rules={{
                      required: q.required ? 'Silakan berikan penilaian Anda' : false,
                    }}
                    render={({ field }) => {
                      const scaleMin = q.scaleConfig?.min || 1;
                      const scaleMax = q.scaleConfig?.max || 5;
                      const scaleValues = Array.from(
                        { length: scaleMax - scaleMin + 1 },
                        (_, i) => scaleMin + i
                      );

                      return (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {scaleValues.map((score) => {
                              const isSelected = Number(field.value) === score;
                              return (
                                <button
                                  type="button"
                                  key={score}
                                  onClick={() => field.onChange(score)}
                                  className={`flex-1 min-w-[44px] h-12 rounded-xl font-bold text-sm transition-all border ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-red-600 to-[#A30018] text-white border-red-700 shadow-md transform scale-105'
                                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {score}
                                </button>
                              );
                            })}
                          </div>

                          {(q.scaleConfig?.minLabel || q.scaleConfig?.maxLabel) && (
                            <div className="flex items-center justify-between text-xs text-[#64748B] px-1 font-medium">
                              <span>{q.scaleConfig?.minLabel || `Nilai ${scaleMin}`}</span>
                              <span>{q.scaleConfig?.maxLabel || `Nilai ${scaleMax}`}</span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                )}

                {/* 7. GRID / MATRIX TABLE */}
                {q.type === 'grid' && q.gridRows && q.gridColumns && (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[#475569]">
                          <th className="p-3 font-bold">Aspek Penilaian</th>
                          {q.gridColumns.map((col) => (
                            <th key={col.value} className="p-3 text-center font-bold">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {q.gridRows.map((row) => {
                          const subFieldName = `answers.${qId}_${row.id}` as const;
                          return (
                            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-3 font-medium text-[#1E293B]">{row.text}</td>
                              {q.gridColumns!.map((col) => {
                                const currentGridVal = watchedAnswers?.[`${qId}_${row.id}`];
                                const isChecked = String(currentGridVal) === String(col.value);

                                return (
                                  <td key={col.value} className="p-3 text-center">
                                    <input
                                      type="radio"
                                      value={String(col.value)}
                                      checked={isChecked}
                                      {...register(subFieldName, {
                                        required: q.required ? 'Wajib diisi' : false,
                                      })}
                                      className="w-4 h-4 accent-red-600 text-red-600 cursor-pointer"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 8. DROPDOWN (Searchable Select) */}
                {q.type === 'dropdown' && (
                  <Controller
                    name={fieldName}
                    control={control}
                    rules={{
                      required: q.required ? 'Silakan pilih opsi dari daftar' : false,
                    }}
                    render={({ field }) => (
                      <SearchableSelect
                        value={(field.value as string) || ''}
                        onChange={(val) => field.onChange(val)}
                        options={(q.options || []).map((o) => getOptLabel(o))}
                        placeholder="-- Pilih atau cari opsi jawaban --"
                        error={!!fieldError}
                        onOpenChange={(isOpen) => setOpenDropdownId(isOpen ? qId : null)}
                      />
                    )}
                  />
                )}

                {/* Field Validation Error Message */}
                {fieldError && (
                  <p className="mt-2.5 text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldError.message as string}
                  </p>
                )}
              </div>
            );
          })
        )}

        {/* Wizard Navigation Bar */}
        <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-lg">
          <div>
            {currentModuleIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isAutoSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            ) : (
              <span className="text-xs text-[#64748B] text-center sm:text-left block">
                Langkah 1 dari {totalModules} &bull; {currentModule.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {currentModuleIndex < totalModules - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isAutoSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-[#A30018] hover:from-[#A30018] hover:to-red-600 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-red-950/10 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                {isAutoSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Draft...</span>
                  </>
                ) : (
                  <>
                    <span>Selanjutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-[#A30018] hover:from-[#A30018] hover:to-red-600 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-red-950/10 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm"
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
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
