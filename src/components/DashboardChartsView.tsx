'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  Users,
  FileQuestion,
  CheckCircle,
  Clock,
  BarChart2,
  PieChart as PieChartIcon,
  Layers,
  Sparkles,
  Calendar,
  TrendingUp,
  Activity,
  ExternalLink,
  ShieldCheck,
  MessageSquareText,
  ArrowRight,
  Quote,
  FileSpreadsheet,
  FileEdit,
} from 'lucide-react';
import { formatFormCreatedDate } from '@/lib/date';
import { SeedDatabaseButton } from '@/components/SeedDatabaseButton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import type { FormRecord } from '@/types/form';
import type { FormAnalytics, QuestionAnalytics } from '@/types/response';

interface DashboardChartsViewProps {
  analytics: FormAnalytics;
  form?: FormRecord;
}

// Diversified Complementary Chart Palettes
const PALETTE = [
  '#DF1A3D', // SHARING VISION Corporate Red
  '#06b6d4', // Bright Cyan
  '#f59e0b', // Vibrant Amber
  '#10b981', // Emerald Green
  '#8b5cf6', // Vibrant Purple
  '#ec4899', // Bright Pink
  '#3b82f6', // Vivid Blue
  '#f97316', // Bright Orange
];

const CHART_BAR_COLORS = [
  '#DF1A3D', // Chart 1: Corporate Red
  '#06b6d4', // Chart 2: Bright Cyan
  '#8b5cf6', // Chart 3: Vibrant Purple
  '#f97316', // Chart 4: Vibrant Orange
  '#10b981', // Chart 5: Emerald Green
  '#f59e0b', // Chart 6: Amber / Gold
];

export function DashboardChartsView({ analytics, form }: DashboardChartsViewProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [chartTypeMap, setChartTypeMap] = useState<Record<string, 'bar' | 'pie'>>({});

  // Ekstrak dari modules jika ada, jika tidak, gunakan array questions lama
  const allQuestions =
    form?.modules && form.modules.length > 0
      ? form.modules.flatMap((module) => module.questions || [])
      : (form?.questions || []);

  const choiceQuestions: QuestionAnalytics[] = analytics.questions.length > 0
    ? analytics.questions.filter((q) =>
        ['radio', 'checkbox', 'dropdown'].includes(q.type)
      )
    : allQuestions
        .filter((q: any) => ['radio', 'checkbox', 'dropdown'].includes(q.type))
        .map((q: any) => ({
          q_id: String(q.id || q.q_id || ''),
          label: String(q.text || q.label || ''),
          type: q.type,
          totalAnswered: 0,
          optionsCount: (q.options || []).reduce((acc: Record<string, number>, opt: any) => {
            const label = typeof opt === 'string' ? opt : opt?.label || String(opt);
            acc[label] = 0;
            return acc;
          }, {} as Record<string, number>),
        }));

  const textQuestions: QuestionAnalytics[] = analytics.questions.length > 0
    ? analytics.questions.filter((q) =>
        ['text', 'textarea', 'number'].includes(q.type)
      )
    : allQuestions
        .filter((q: any) => ['text', 'textarea', 'number'].includes(q.type))
        .map((q: any) => ({
          q_id: String(q.id || q.q_id || ''),
          label: String(q.text || q.label || ''),
          type: q.type,
          totalAnswered: 0,
          textAnswers: [],
        }));

  const totalQuestionsCount =
    allQuestions.length > 0
      ? allQuestions.length
      : analytics.questions.length;

  const toggleChartType = (q_id: string, type: 'bar' | 'pie') => {
    setChartTypeMap((prev) => ({
      ...prev,
      [q_id]: type,
    }));
  };

  // Timeline data aggregation for Submission Timeline chart
  const timelineData = useMemo(() => {
    const responses = analytics.rawResponses || [];

    if (responses.length === 0) {
      const today = new Date('2026-10-14');
      const d1 = new Date(today.getTime() - 2 * 86400000);
      const d2 = new Date(today.getTime() - 1 * 86400000);
      return [
        { date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d1), total: 0 },
        { date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d2), total: 0 },
        { date: new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(today), total: 0 },
      ];
    }

    const countsByDate: Record<string, number> = {};

    responses.forEach((resp, idx) => {
      let dateObj: Date;
      const rawDate = resp.created || (resp.answers?._submitted_at as string);
      if (rawDate && rawDate.trim().length > 0) {
        dateObj = new Date(rawDate);
      } else {
        const base = new Date('2026-10-14T14:30:00+07:00').getTime();
        dateObj = new Date(base - idx * 24 * 60 * 60 * 1000);
      }

      if (isNaN(dateObj.getTime())) {
        dateObj = new Date('2026-10-14');
      }

      const dateKey = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(dateObj);

      countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
    });

    const entries = Object.entries(countsByDate).map(([date, total]) => ({
      date,
      total,
    }));

    if (entries.length === 1) {
      const priorDate = new Date('2026-10-13');
      const priorKey = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
      }).format(priorDate);

      return [
        { date: priorKey, total: 0 },
        ...entries,
      ];
    }

    return entries.reverse();
  }, [analytics.rawResponses]);

  // Extract up to 3 recent text answers from text questions or rawResponses
  const recentFeedbacks = useMemo(() => {
    const list: Array<{ name: string; date: string; question: string; text: string; isReal: boolean }> = [];

    // Check rawResponses first for real submitted answers
    const responses = analytics.rawResponses || [];
    for (const resp of responses) {
      if (list.length >= 3) break;
      const dateStr = resp.created
        ? new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(resp.created))
        : 'Baru saja';
      const name = resp.respondent_name || 'Responden';

      for (const q of textQuestions) {
        const val = resp.answers?.[q.q_id];
        if (typeof val === 'string' && val.trim().length > 0) {
          list.push({
            name,
            date: dateStr,
            question: q.label,
            text: val.trim(),
            isReal: true,
          });
          if (list.length >= 3) break;
        }
      }
    }

    // Fallback: check textQuestions textAnswers
    if (list.length === 0) {
      for (const q of textQuestions) {
        if (list.length >= 3) break;
        for (const ans of q.textAnswers || []) {
          if (typeof ans === 'string' && ans.trim().length > 0) {
            list.push({
              name: 'Responden Terverifikasi',
              date: 'Tersimpan',
              question: q.label,
              text: ans.trim(),
              isReal: true,
            });
            if (list.length >= 3) break;
          }
        }
      }
    }

    // If still empty (e.g. fresh form without responses yet), provide mock samples
    if (list.length === 0) {
      return [
        {
          name: 'Responden Evaluasi',
          date: 'Contoh Respon',
          question: 'Masukan & Saran',
          text: 'Platform kuesioner sangat responsif, pengisian cepat dan antarmuka sangat nyaman diakses dari smartphone.',
          isReal: false,
        },
        {
          name: 'Peserta Survei',
          date: 'Contoh Respon',
          question: 'Kesan & Pengalaman',
          text: 'Penyusunan pertanyaan sistematis dan loading visualisasi data instan tanpa jeda.',
          isReal: false,
        },
      ];
    }

    return list;
  }, [analytics.rawResponses, textQuestions]);

  // Determine if choiceQuestions is odd to complete the Bento Grid rectangle
  const isOddChoice = choiceQuestions.length % 2 !== 0;

  // Dynamic Theme Colors for Recharts
  const gridStroke = isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9';
  const axisTickColor = isDark ? '#94a3b8' : '#64748b';
  const axisLineStroke = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Page Title & Context Header - Bento Style */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#DF1A3D] dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Ringkasan Analitik
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 px-2.5 py-0.5 rounded-lg">
                ID: {analytics.formId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {analytics.formTitle}
            </h1>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <SeedDatabaseButton />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-[#DF1A3D]" />
            Dibuat pada: {formatFormCreatedDate(analytics.formCreatedAt)}
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          <p>
            Visualisasi ringkasan metrik dan grafik distribusi pilihan responden secara langsung.
          </p>
        </div>
      </div>

      {/* METRIC CARDS ROW - Chunky Bento Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* 1. Total Responden */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute right-1 -bottom-2 text-indigo-500/10 dark:text-indigo-400/10 pointer-events-none group-hover:scale-105 transition-transform">
            <Users className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Total Responden
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white relative z-10">
            {analytics.totalResponses}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5 font-medium relative z-10">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Jawaban berhasil dikumpulkan
          </p>
        </div>

        {/* 2. Total Pertanyaan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute right-1 -bottom-2 text-cyan-500/10 dark:text-cyan-400/10 pointer-events-none group-hover:scale-105 transition-transform">
            <FileQuestion className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Total Pertanyaan
            </span>
            <div className="w-9 h-9 rounded-2xl bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white relative z-10">
            {totalQuestionsCount}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 relative z-10 font-medium">
            {choiceQuestions.length} Pilihan Ganda &bull; {textQuestions.length} Isian Teks
          </p>
        </div>

        {/* 3. Tipe Pertanyaan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute right-1 -bottom-2 text-amber-500/10 dark:text-amber-400/10 pointer-events-none group-hover:scale-105 transition-transform">
            <Layers className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Tipe Pertanyaan
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white relative z-10">
            {choiceQuestions.length > 0 && textQuestions.length > 0
              ? 'Multi-tipe'
              : choiceQuestions.length > 0
              ? 'Pilihan'
              : 'Teks'}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 relative z-10 font-medium">
            Radio, Checkbox, Dropdown &amp; Teks
          </p>
        </div>

        {/* 4. Status Sinkronisasi */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute right-1 -bottom-2 text-emerald-500/10 dark:text-emerald-400/10 pointer-events-none group-hover:scale-105 transition-transform">
            <Clock className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Status Sinkronisasi
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white relative z-10">
            {analytics.totalResponses > 0 ? 'Tersinkron' : 'Menunggu'}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 truncate relative z-10 font-medium">
            {analytics.totalResponses > 0
              ? 'Data terbaru aktif'
              : 'Belum ada responden'}
          </p>
        </div>
      </div>

      {/* BENTO BOX CHARTS SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#DF1A3D]" />
              Visualisasi Distribusi &amp; Tren Pengisian
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Grafik distribusi pilihan responden serta tren linier volume pengisian kuesioner dari waktu ke waktu.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
            {choiceQuestions.length + 1} Visualisasi
          </span>
        </div>

        {/* BENTO BOX GRID: Asymmetrical Gen-Z Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Bento Tile 1: Wide Timeline Chart (Spans 3 cols on large screens) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-400/30">
                      Aktivitas
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {analytics.totalResponses} respons tercatat
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                    Tren Waktu Pengisian
                  </h3>
                </div>

                <div className="px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-400/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shrink-0">
                  <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                  <span>Timeline</span>
                </div>
              </div>
            </div>

            {/* Area Chart Rendering */}
            <div className="py-4 my-2">
              {timelineData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 text-xs bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                  <TrendingUp className="w-8 h-8 mb-2 text-slate-500 dark:text-slate-400" />
                  <span>Belum ada data pengisian waktu respons</span>
                </div>
              ) : (
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timelineData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#0891b2" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: axisTickColor }}
                        interval={0}
                        tickLine={false}
                        axisLine={{ stroke: axisLineStroke }}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: axisTickColor }}
                        tickLine={false}
                        axisLine={{ stroke: axisLineStroke }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white dark:bg-[#181818] text-slate-900 dark:text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10">
                                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                                  {data.date}
                                </p>
                                <p className="mt-1 text-slate-500 dark:text-slate-400">
                                  Volume:{' '}
                                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                                    {data.total} respons
                                  </span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        activeDot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Summary Breakdown under timeline chart */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-2.5">
              {timelineData.map((item, itemIdx) => {
                const maxTotal = Math.max(...timelineData.map((t) => t.total), 1);
                const percentage = Math.round(
                  (item.total / (analytics.totalResponses || 1)) * 100
                );
                return (
                  <div key={itemIdx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate max-w-[70%]">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-cyan-500 shadow-xs" />
                        <span className="truncate">{item.date}</span>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        {item.total} respons ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{
                          width: `${Math.round((item.total / maxTotal) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bento Tile 2: Side Summary Bento Pill (Column 4) */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-[#DF1A3D] dark:text-rose-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Status Survei
                </h3>
              </div>

              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                    Kategori Formulir
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {choiceQuestions.length > 0 && textQuestions.length > 0
                      ? 'Campuran (Pilihan & Isian)'
                      : choiceQuestions.length > 0
                      ? 'Pilihan Ganda'
                      : 'Kuesioner Terbuka'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                    Kesiapan Laporan
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Siap Diekspor (CSV)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                    Akses Responden
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    Terenkripsi &amp; Publik
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-white/5 mt-4">
              <a
                href={`/form/${analytics.formId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] shadow-xs transition-all"
              >
                <span>Buka Formulir Publik</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Bento Tiles: Choice-Based Question Cards (Span 2 cols on lg) */}
          {choiceQuestions.length === 0 ? (
            <div className="col-span-full p-8 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 text-center text-slate-600 dark:text-slate-400 text-sm">
              Tidak ada pertanyaan bertipe pilihan ganda dalam kuesioner ini.
            </div>
          ) : (
            choiceQuestions.map((q, idx) => {
              const currentChartType = chartTypeMap[q.q_id] || (idx % 2 === 0 ? 'bar' : 'pie');

              const optionsData = Object.entries(q.optionsCount || {}).map(([name, countVal]) => {
                const count = Number(countVal) || 0;
                const total = q.totalAnswered > 0 ? q.totalAnswered : 1;
                const percentage = Math.round((count / total) * 100);
                return {
                  name,
                  count,
                  percentage,
                };
              });

              const hasAnswers = optionsData.some((d) => d.count > 0);

              return (
                <div
                  key={q.q_id}
                  className="col-span-1 md:col-span-2 lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300"
                >
                  {/* Card Header with Question and Chart Toggle */}
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#DF1A3D] dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30">
                            {q.type}
                          </span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {q.totalAnswered} dari {analytics.totalResponses} menjawab
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {q.label}
                        </h3>
                      </div>

                      {/* Chart Toggle Buttons */}
                      <div className="flex items-center bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 p-1 rounded-2xl shrink-0">
                        <button
                          onClick={() => toggleChartType(q.q_id, 'bar')}
                          className={`p-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            currentChartType === 'bar'
                              ? 'bg-gradient-to-r from-[#DF1A3D] to-[#A30018] text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                          }`}
                          title="Tampilkan Diagram Batang (Bar Chart)"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleChartType(q.q_id, 'pie')}
                          className={`p-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            currentChartType === 'pie'
                              ? 'bg-gradient-to-r from-[#DF1A3D] to-[#A30018] text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                          }`}
                          title="Tampilkan Diagram Lingkaran (Pie Chart)"
                        >
                          <PieChartIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chart Rendering */}
                  <div className="py-4 my-2">
                    {!hasAnswers ? (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 text-xs bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                        <BarChart2 className="w-8 h-8 mb-2 text-slate-500 dark:text-slate-400" />
                        <span>Belum ada data respons untuk pertanyaan ini</span>
                      </div>
                    ) : currentChartType === 'bar' ? (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={optionsData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11, fill: axisTickColor }}
                              interval={0}
                              tickLine={false}
                              axisLine={{ stroke: axisLineStroke }}
                              angle={-15}
                              textAnchor="end"
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 11, fill: axisTickColor }}
                              tickLine={false}
                              axisLine={{ stroke: axisLineStroke }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const highlightColor =
                                    CHART_BAR_COLORS[idx % CHART_BAR_COLORS.length];
                                  return (
                                    <div className="bg-white dark:bg-[#181818] text-slate-900 dark:text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10">
                                      <p className="font-bold text-slate-900 dark:text-white">{data.name}</p>
                                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                                        Jumlah: <span className="font-bold" style={{ color: highlightColor }}>{data.count}</span> ({data.percentage}%)
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                              {optionsData.map((_, optIdx) => (
                                <Cell
                                  key={`cell-${optIdx}`}
                                  fill={CHART_BAR_COLORS[idx % CHART_BAR_COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={optionsData}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={3}
                            >
                              {optionsData.map((_, optIdx) => (
                                <Cell
                                  key={`pie-cell-${optIdx}`}
                                  fill={PALETTE[optIdx % PALETTE.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const highlightColor =
                                    PALETTE[optionsData.findIndex((d) => d.name === data.name) % PALETTE.length] || '#f59e0b';
                                  return (
                                    <div className="bg-white dark:bg-[#181818] text-slate-900 dark:text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10">
                                      <p className="font-bold text-slate-900 dark:text-white">{data.name}</p>
                                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                                        Jumlah: <span className="font-bold" style={{ color: highlightColor }}>{data.count}</span> ({data.percentage}%)
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                              formatter={(value) => (
                                <span className="text-slate-600 dark:text-slate-300 font-medium">{value}</span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Summary Breakdown under chart */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-2.5">
                    {optionsData.map((opt, optIdx) => {
                      const itemColor =
                        currentChartType === 'bar'
                          ? CHART_BAR_COLORS[idx % CHART_BAR_COLORS.length]
                          : PALETTE[optIdx % PALETTE.length];
                      return (
                        <div key={optIdx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate max-w-[70%]">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: itemColor }}
                              />
                              <span className="truncate" title={opt.name}>
                                {opt.name}
                              </span>
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white shrink-0">
                              {opt.count} ({opt.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${opt.percentage}%`,
                                backgroundColor: itemColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* BENTO CARD: Masukan & Saran Terbaru (Recent Feedback) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#DF1A3D] dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30">
                      Tanggapan Teks
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {textQuestions.length} pertanyaan isian
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-2">
                    <MessageSquareText className="w-5 h-5 text-[#DF1A3D]" />
                    Masukan &amp; Kritik Terbaru
                  </h3>
                </div>

                <Link
                  href={`/admin/responses?formId=${analytics.formId}`}
                  className="text-xs font-semibold text-[#DF1A3D] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Feedback items list */}
              <div className="space-y-3 my-2">
                {recentFeedbacks.map((fb, fbIdx) => (
                  <div
                    key={fbIdx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1.5 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Quote className="w-3 h-3 text-[#DF1A3D]" />
                        {fb.name}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">{fb.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic leading-relaxed">
                      &ldquo;{fb.text}&rdquo;
                    </p>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Terkait: {fb.question}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Total {analytics.totalResponses} responden berpartisipasi
              </span>
              <Link
                href={`/admin/responses?formId=${analytics.formId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#DF1A3D] hover:text-[#b81230] transition-colors"
              >
                <span>Buka Tabel Tanggapan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* BENTO CARD: Aksi Cepat & Pintasan (Quick Actions) - Rendered when choiceQuestions is even to complete rectangle */}
          {!isOddChoice && (
            <div className="col-span-1 md:col-span-2 lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30">
                        Pintasan Cepat
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Aksi Manajemen
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Aksi &amp; Rekapitulasi
                    </h3>
                  </div>
                </div>

                {/* Quick Action Navigation Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                  <Link
                    href={`/admin/report?formId=${analytics.formId}`}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/5 transition-all group flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block group-hover:text-[#DF1A3D] transition-colors">
                        Tabel Master Report
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                        Rekap seluruh jawaban
                      </span>
                    </div>
                  </Link>

                  <Link
                    href={`/admin/kuesioner?formId=${analytics.formId}`}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/5 transition-all group flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                      <FileEdit className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block group-hover:text-[#DF1A3D] transition-colors">
                        Edit Pertanyaan
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                        Kelola skema formulir
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Firebase Real-time
                </span>
                <a
                  href={`/form/${analytics.formId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#DF1A3D] dark:hover:text-[#DF1A3D] transition-colors"
                >
                  <span>Buka Form Publik</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
