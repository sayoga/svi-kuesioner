'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { FormAnalytics } from '@/types/response';
import { formatSubmissionDate, formatFormCreatedDate } from '@/lib/date';

interface MasterReportTableViewProps {
  analytics: FormAnalytics;
}

export function MasterReportTableView({ analytics }: MasterReportTableViewProps) {
  const [tableSearch, setTableSearch] = useState('');

  const allQuestions = analytics.questions || [];
  const rawResponses = analytics.rawResponses || [];

  // Helper to format values for display and CSV
  const formatAnswer = (val: unknown): string => {
    if (val === undefined || val === null) return '-';
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(', ') : '-';
    }
    const str = String(val).trim();
    return str.length > 0 ? str : '-';
  };

  // Export Master Report Data to CSV
  const handleExportCSV = () => {
    if (rawResponses.length === 0 || allQuestions.length === 0) return;

    const headers = [
      'No',
      'Tanggal Submit',
      'ID Respons',
      'Responden',
      ...allQuestions.map((q) => `"${q.label.replace(/"/g, '""')}"`),
    ];

    const rows = rawResponses.map((resp, idx) => {
      const dateStr = formatSubmissionDate(
        resp.created || (resp.answers?._submitted_at as string),
        idx
      );
      const respondent = resp.respondent_name || 'Anonymous';
      const answers = allQuestions.map((q) => {
        const val = resp.answers?.[q.q_id];
        const formatted = formatAnswer(val);
        return `"${formatted.replace(/"/g, '""')}"`;
      });

      return [idx + 1, `"${dateStr}"`, `"${resp.id}"`, `"${respondent}"`, ...answers].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `master_report_${analytics.formId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter raw responses based on search query across any column
  const filteredResponses = rawResponses.filter((resp) => {
    if (!tableSearch.trim()) return true;
    const query = tableSearch.toLowerCase();

    if (resp.respondent_name && resp.respondent_name.toLowerCase().includes(query)) {
      return true;
    }

    return allQuestions.some((q) => {
      const val = resp.answers?.[q.q_id];
      const str = formatAnswer(val);
      return str.toLowerCase().includes(query);
    });
  });

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header Info Banner - Bento Style */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm p-6 sm:p-8 relative overflow-hidden transition-colors">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Tabel Master Report
          </span>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 px-2.5 py-0.5 rounded-lg">
            ID: {analytics.formId}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {analytics.formTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-[#DF1A3D]" />
            Dibuat pada: {formatFormCreatedDate(analytics.formCreatedAt)}
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          <p>
            Rekapitulasi komprehensif seluruh data jawaban responden yang mencakup seluruh pertanyaan pilihan ganda dan teks.
          </p>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Total Responden</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">{analytics.totalResponses}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Total Kolom Pertanyaan</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">{allQuestions.length}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Pertanyaan Pilihan</span>
            <span className="text-xl font-extrabold text-[#DF1A3D] dark:text-rose-400 mt-0.5 block">
              {allQuestions.filter((q) => ['radio', 'checkbox', 'dropdown'].includes(q.type)).length}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Pertanyaan Teks</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {allQuestions.filter((q) => ['text', 'textarea'].includes(q.type)).length}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar: Search & Master Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari di seluruh kolom jawaban..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs sm:text-sm focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 bg-white dark:bg-[#121212] text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-xs transition-colors"
          />
        </div>

        {rawResponses.length > 0 && allQuestions.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
            title="Unduh seluruh data master ke CSV"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Ekspor Master CSV</span>
          </button>
        )}
      </div>

      {/* Master Table - Bento Style */}
      {allQuestions.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm p-12 text-center text-slate-600 dark:text-slate-400 text-sm">
          Formulir ini belum memiliki daftar pertanyaan.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Menampilkan <strong className="text-slate-900 dark:text-white">{filteredResponses.length}</strong> dari{' '}
              <strong className="text-slate-900 dark:text-white">{rawResponses.length}</strong> baris entri
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Total {allQuestions.length} Kolom Pertanyaan Terintegrasi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-14 text-center shrink-0">No.</th>
                  <th className="py-3.5 px-4 w-44 shrink-0">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      Tanggal Submit
                    </span>
                  </th>
                  <th className="py-3.5 px-4 w-40 shrink-0">Responden</th>
                  {allQuestions.map((q) => (
                    <th key={q.q_id} className="py-3.5 px-4 min-w-[200px] max-w-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate" title={q.label}>
                          {q.label}
                        </span>
                        <span className="text-[9px] font-mono lowercase text-[#DF1A3D] font-bold">
                          [{q.type}]
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {filteredResponses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3 + allQuestions.length}
                      className="py-12 text-center text-slate-600 dark:text-slate-400 text-xs"
                    >
                      {tableSearch
                        ? 'Tidak ada data yang cocok dengan kata kunci pencarian.'
                        : 'Belum ada tanggapan yang masuk dari responden.'}
                    </td>
                  </tr>
                ) : (
                  filteredResponses.map((resp, idx) => {
                    const respondentName = resp.respondent_name || 'Anonymous';
                    const formattedDate = formatSubmissionDate(
                      resp.created || (resp.answers?._submitted_at as string),
                      idx
                    );

                    return (
                      <tr
                        key={resp.id || idx}
                        className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-[11px] font-mono">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                          {respondentName}
                        </td>
                        {allQuestions.map((q) => {
                          const rawVal = resp.answers?.[q.q_id];
                          const formatted = formatAnswer(rawVal);
                          const isEmpty = formatted === '-';

                          return (
                            <td
                              key={q.q_id}
                              className={`py-3.5 px-4 leading-relaxed ${
                                isEmpty
                                  ? 'text-slate-400 dark:text-slate-600 italic'
                                  : 'text-slate-700 dark:text-slate-300 font-normal'
                              }`}
                            >
                              {formatted}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
