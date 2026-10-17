'use client';

import { useState, useTransition } from 'react';
import {
  ScrollText,
  Search,
  RefreshCw,
  Clock,
  PlusCircle,
  Trash2,
  Edit3,
  LogIn,
  Shield,
  Activity,
  Layers,
  ListFilter,
  Copy,
  Check,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import type { AuditLogRecord } from '@/types/audit';
import { fetchAuditLogsAction } from '@/actions/audit';
import { formatSubmissionDate } from '@/lib/date';

interface AuditLogsViewProps {
  initialLogs: AuditLogRecord[];
}

export function AuditLogsView({ initialLogs }: AuditLogsViewProps) {
  const [logs, setLogs] = useState<AuditLogRecord[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('timeline');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await fetchAuditLogsAction(50);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    });
  };

  // Filter logs based on search and action filter
  const filteredLogs = logs.filter((log) => {
    // Action filter
    if (actionFilter !== 'ALL') {
      if (!log.action.toUpperCase().includes(actionFilter)) {
        return false;
      }
    }

    // Search query
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const detailsStr =
      typeof log.details === 'string'
        ? log.details
        : JSON.stringify(log.details);

    return (
      log.action.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      detailsStr.toLowerCase().includes(q) ||
      log.id.toLowerCase().includes(q)
    );
  });

  // Action badge and icon helper
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();

    if (act.includes('DELETE')) {
      return {
        label: action,
        bg: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
        dot: 'bg-rose-500',
        icon: Trash2,
      };
    }
    if (act.includes('STATUS')) {
      return {
        label: action,
        bg: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
        dot: 'bg-amber-500',
        icon: SlidersHorizontal,
      };
    }
    if (act.includes('CREATE')) {
      return {
        label: action,
        bg: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
        dot: 'bg-emerald-500',
        icon: PlusCircle,
      };
    }
    if (act.includes('UPDATE')) {
      return {
        label: action,
        bg: 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
        dot: 'bg-sky-500',
        icon: Edit3,
      };
    }
    if (act.includes('LOGIN')) {
      return {
        label: action,
        bg: 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30',
        dot: 'bg-violet-500',
        icon: LogIn,
      };
    }

    return {
      label: action,
      bg: 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10',
      dot: 'bg-slate-500',
      icon: Activity,
    };
  };

  const createCount = logs.filter((l) => l.action.toUpperCase().includes('CREATE')).length;
  const updateCount = logs.filter((l) => l.action.toUpperCase().includes('UPDATE')).length;
  const deleteCount = logs.filter((l) => l.action.toUpperCase().includes('DELETE')).length;

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Hero Banner / Header - Bento Box Style */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm p-6 sm:p-8 relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#DF1A3D] dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30">
                <Shield className="w-3.5 h-3.5 text-[#DF1A3D]" />
                Audit Trail & Traceability
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 px-2.5 py-0.5 rounded-lg">
                Firestore audit_logs
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Catatan Aktivitas Admin
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Riwayat lengkap tindakan krusial administrator kuesioner. Memantau pembuatan akun, penghapusan data, dan modifikasi formulir untuk kepatuhan keamanan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.07] text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm font-semibold"
              title="Perbarui log"
            >
              <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin text-[#DF1A3D]' : ''}`} />
              <span>Perbarui Log</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bento Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Total Log
              </span>
              <ScrollText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {logs.length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Pembuatan
              </span>
              <PlusCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {createCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Pembaruan
              </span>
              <Edit3 className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-sky-600 dark:text-sky-400">
              {updateCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Penghapusan
              </span>
              <Trash2 className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
              {deleteCount}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Filter & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Action Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-2xl shadow-xs">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'CREATE', label: 'Create' },
            { id: 'UPDATE', label: 'Update' },
            { id: 'DELETE', label: 'Delete' },
            { id: 'STATUS', label: 'Status' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActionFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                actionFilter === item.id
                  ? 'bg-rose-50 dark:bg-rose-500/15 text-[#DF1A3D] dark:text-white border border-rose-200 dark:border-rose-400/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher (Timeline vs Table) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center p-1 bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Search Bar + Table or Timeline */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden transition-colors">
        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pelaku, aksi, atau detail aktivitas..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DF1A3D]/40 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Reset
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between sm:justify-end gap-2 px-1">
            <span>
              Menampilkan {filteredLogs.length} dari {logs.length} catatan aktivitas
            </span>
          </div>
        </div>

        {/* Content Mode 1: Timeline View */}
        {viewMode === 'timeline' && (
          <div className="p-6 sm:p-8">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center max-w-xs mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] text-slate-400 flex items-center justify-center mb-3 mx-auto">
                  <ListFilter className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Tidak Ada Log Aktivitas
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {search || actionFilter !== 'ALL'
                    ? 'Tidak ada log yang cocok dengan kriteria pencarian/filter.'
                    : 'Belum ada aktivitas yang dicatat. Aktivitas akan muncul otomatis saat admin berinteraksi.'}
                </p>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2.5 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  const isCopied = copiedId === log.id;

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline Node Icon */}
                      <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-[#121212] border-2 border-slate-300 dark:border-white/20 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                        <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                      </div>

                      {/* Timeline Bento Card */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                            >
                              <Icon className="w-3 h-3" />
                              {badge.label}
                            </span>
                            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                              oleh <strong className="text-slate-900 dark:text-slate-200">{log.performedBy}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#DF1A3D]" />
                              {formatSubmissionDate(log.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                          {typeof log.details === 'string' ? (
                            <p>{log.details}</p>
                          ) : (
                            <pre className="p-2.5 bg-slate-100 dark:bg-black/30 rounded-xl overflow-x-auto text-[11px] font-mono text-slate-700 dark:text-slate-300">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>

                        {/* Bottom Metadata */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <div className="flex items-center gap-1">
                            <span>ID: {log.id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(log.id)}
                              className="p-1 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                              title="Salin Log ID"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>
                          <span>Status: Berhasil</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content Mode 2: Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="py-4 px-4 sm:px-6">Waktu</th>
                  <th className="py-4 px-4 sm:px-6">Aksi</th>
                  <th className="py-4 px-4 sm:px-6">Pelaku (Admin)</th>
                  <th className="py-4 px-4 sm:px-6">Detail Aktivitas</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Log ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] text-slate-400 flex items-center justify-center mb-3">
                          <ListFilter className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          Tidak Ada Log Aktivitas
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Belum ada aktivitas yang tercatat sesuai filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const badge = getActionBadge(log.action);
                    const isCopied = copiedId === log.id;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Waktu */}
                        <td className="py-4 px-4 sm:px-6 align-middle text-xs whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {formatSubmissionDate(log.timestamp)}
                        </td>

                        {/* Aksi Badge */}
                        <td className="py-4 px-4 sm:px-6 align-middle">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Pelaku */}
                        <td className="py-4 px-4 sm:px-6 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {log.performedBy.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-[200px]">
                              {log.performedBy}
                            </span>
                          </div>
                        </td>

                        {/* Detail */}
                        <td className="py-4 px-4 sm:px-6 align-middle text-xs text-slate-700 dark:text-slate-300">
                          {typeof log.details === 'string' ? (
                            <span className="line-clamp-2">{log.details}</span>
                          ) : (
                            <span className="font-mono text-[11px] text-slate-500">
                              {JSON.stringify(log.details)}
                            </span>
                          )}
                        </td>

                        {/* Log ID */}
                        <td className="py-4 px-4 sm:px-6 align-middle text-right">
                          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-lg font-mono text-[11px] text-slate-500">
                            <span className="truncate max-w-[90px]">{log.id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(log.id)}
                              className="p-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                              title="Salin ID"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
