'use client';

import { useState } from 'react';
import {
  MessageSquareText,
  Search,
  Download,
  Calendar,
} from 'lucide-react';
import type { FormAnalytics } from '@/types/response';
import { formatSubmissionDate, formatFormCreatedDate } from '@/lib/date';

interface TextResponsesTableViewProps {
  analytics: FormAnalytics;
}

export function TextResponsesTableView({ analytics }: TextResponsesTableViewProps) {
  const [tableSearch, setTableSearch] = useState('');

  const textQuestions = analytics.questions.filter((q) =>
    ['text', 'textarea'].includes(q.type)
  );

  const rawResponses = analytics.rawResponses || [];

  // Export Table Data to CSV
  const handleExportCSV = () => {
    if (rawResponses.length === 0 || textQuestions.length === 0) return;

    const headers = [
      'No',
      'Tanggal Submit',
      'ID Respons',
      'Responden',
      ...textQuestions.map((q) => `"${q.label.replace(/"/g, '""')}"`),
    ];

    const rows = rawResponses.map((resp, idx) => {
      const dateStr = formatSubmissionDate(
        resp.created || (resp.answers?._submitted_at as string),
        idx
      );
      const respondent = resp.respondent_name || 'Anonymous';
      const answers = textQuestions.map((q) => {
        const val = resp.answers?.[q.q_id];
        return val ? `"${String(val).replace(/"/g, '""').trim()}"` : '""';
      });

      return [idx + 1, `"${dateStr}"`, `"${resp.id}"`, `"${respondent}"`, ...answers].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tanggapan_teks_${analytics.formId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter raw responses based on search query
  const filteredResponses = rawResponses.filter((resp) => {
    if (!tableSearch.trim()) return true;
    const query = tableSearch.toLowerCase();

    if (resp.respondent_name && resp.respondent_name.toLowerCase().includes(query)) {
      return true;
    }

    return textQuestions.some((q) => {
      const val = resp.answers?.[q.q_id];
      return val && String(val).toLowerCase().includes(query);
    });
  });

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header Info Banner - Bento Style */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm p-6 sm:p-8 relative overflow-hidden transition-colors">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#DF1A3D] dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30">
            <MessageSquareText className="w-3.5 h-3.5 text-[#DF1A3D]" />
            Tanggapan Responden
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
            Daftar seluruh tanggapan teks dan masukan tertulis yang dikirimkan oleh responden.
          </p>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Total Pengirim</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">{analytics.totalResponses}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Kolom Pertanyaan Teks</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">{textQuestions.length}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-slate-200/60 dark:border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Status Filter</span>
            <span className="text-sm font-bold text-[#DF1A3D] dark:text-rose-400 mt-1 block">{filteredResponses.length} ditampilkan</span>
          </div>
        </div>
      </div>

      {/* Action Bar: Search & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari tanggapan atau nama responden..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-xs sm:text-sm focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 bg-white dark:bg-[#121212] text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-xs transition-colors"
          />
        </div>

        {rawResponses.length > 0 && textQuestions.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] text-white text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
            title="Unduh tanggapan teks ke CSV"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Ekspor CSV</span>
          </button>
        )}
      </div>

      {/* Unified Table - Bento Style */}
      {textQuestions.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm p-12 text-center text-slate-600 dark:text-slate-400 text-sm">
          Tidak ada pertanyaan bertipe teks bebas (text atau textarea) pada formulir ini.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden transition-colors">
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
                  {textQuestions.map((q) => (
                    <th key={q.q_id} className="py-3.5 px-4 min-w-[220px] max-w-md">
                      <span className="truncate" title={q.label}>
                        {q.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {filteredResponses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3 + textQuestions.length}
                      className="py-12 text-center text-slate-600 dark:text-slate-400 text-xs"
                    >
                      {tableSearch
                        ? 'Tidak ada tanggapan yang cocok dengan kata kunci pencarian.'
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
                        {textQuestions.map((q) => {
                          const rawVal = resp.answers?.[q.q_id];
                          const textVal =
                            rawVal !== undefined && rawVal !== null
                              ? String(rawVal).trim()
                              : '';

                          const isEmpty = !textVal || textVal.length === 0;

                          return (
                            <td
                              key={q.q_id}
                              className={`py-3.5 px-4 leading-relaxed ${
                                isEmpty
                                  ? 'text-slate-400 dark:text-slate-600 italic'
                                  : 'text-slate-700 dark:text-slate-300 font-normal'
                              }`}
                            >
                              {isEmpty ? '-' : textVal}
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
