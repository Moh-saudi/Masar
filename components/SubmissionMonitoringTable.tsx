'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { DailySubmission } from '@/lib/types';
import { SECTIONS_DEFINITIONS } from '@/lib/constants';
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Clock3, Eye, MapPin, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface SubmissionMonitoringTableProps {
  submissions: DailySubmission[];
  title?: string;
  description?: string;
  pageSize?: number;
  deadline?: string;
  emptyMessage?: string;
  onView?: (submission: DailySubmission) => void;
  renderActions?: (submission: DailySubmission) => React.ReactNode;
}

export function formatCairoDateTime(value?: string) {
  if (!value) return { date: '—', time: '—' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: value.slice(0, 10) || '—', time: value.slice(11, 16) || '—' };
  }
  return {
    date: new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date),
    time: new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true }).format(date),
  };
}

export function getSubmissionCompletion(submission: DailySubmission) {
  const completed = SECTIONS_DEFINITIONS.filter(def => submission.sections?.[def.code]?.status === 'completed').length;
  const total = SECTIONS_DEFINITIONS.length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

export function getSubmissionStatusLabel(submission: DailySubmission) {
  if (submission.ministry_status === 'APPROVED') return 'اعتماد مركزي';
  if (submission.directorate_status === 'APPROVED') return 'معتمد من المديرية';
  if (submission.status === 'RETURNED' || submission.directorate_status === 'RETURNED') return 'مرجع للتصحيح';
  if (submission.status === 'SUBMITTED_LOCKED') return 'بانتظار المراجعة';
  return 'مسودة';
}

function statusClass(label: string) {
  if (label === 'اعتماد مركزي' || label === 'معتمد من المديرية') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (label === 'مرجع للتصحيح') return 'bg-rose-50 border-rose-200 text-rose-700';
  if (label === 'بانتظار المراجعة') return 'bg-[#eef9f7] border-[#ccebe7] text-[#087f78]';
  return 'bg-amber-50 border-amber-200 text-amber-700';
}

function cairoNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function operationalFlag(submission: DailySubmission, deadline: string) {
  const now = cairoNow();
  const activeOverride = Boolean(
    submission.override_active &&
    submission.override_expires_at &&
    new Date(submission.override_expires_at).getTime() > Date.now()
  );
  const requestedOverride = Boolean(submission.override_reason && !activeOverride);
  const deadlinePassed =
    submission.submission_date < now.date ||
    (submission.submission_date === now.date && now.minutes >= timeToMinutes(deadline));
  const late = deadlinePassed && submission.status === 'DRAFT' && !activeOverride && !requestedOverride;

  if (activeOverride) {
    return {
      label: 'فتح استثنائي نشط',
      rowClass: 'bg-sky-50/70 hover:bg-sky-50',
      badgeClass: 'bg-sky-100 border-sky-200 text-sky-800',
      icon: <ShieldCheck className="w-3 h-3" />,
    };
  }
  if (requestedOverride) {
    return {
      label: 'طلب فتح استثنائي',
      rowClass: 'bg-amber-50/75 hover:bg-amber-50',
      badgeClass: 'bg-amber-100 border-amber-200 text-amber-800',
      icon: <ShieldAlert className="w-3 h-3" />,
    };
  }
  if (late) {
    return {
      label: 'متأخر عن الإغلاق',
      rowClass: 'bg-rose-50/70 hover:bg-rose-50',
      badgeClass: 'bg-rose-100 border-rose-200 text-rose-800',
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  }
  return null;
}

export const SubmissionMonitoringTable: React.FC<SubmissionMonitoringTableProps> = ({
  submissions,
  title = 'متابعة جهات الإدخال',
  description = 'صف واحد لكل جهة، والتفاصيل تظهر عند الطلب دون أي استدعاء إضافي لقاعدة البيانات.',
  pageSize = 50,
  deadline = '15:00',
  emptyMessage = 'لا توجد بيانات مطابقة.',
  onView,
  renderActions,
}) => {
  const [page, setPage] = useState(1);
  const [localDetails, setLocalDetails] = useState<DailySubmission | null>(null);

  const rows = useMemo(() => [...submissions].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || a.submission_date).getTime();
    const bTime = new Date(b.updated_at || b.created_at || b.submission_date).getTime();
    return bTime - aTime;
  }), [submissions]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleView = (submission: DailySubmission) => {
    if (onView) onView(submission);
    else setLocalDetails(submission);
  };

  return (
    <>
      <div className="gov-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-extrabold text-[#172033]">{title}</h3>
            <p className="text-[9px] text-slate-400 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[8px]">
            <span className="inline-flex items-center gap-1 text-rose-700"><span className="w-2 h-2 rounded-full bg-rose-300" /> متأخر</span>
            <span className="inline-flex items-center gap-1 text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-300" /> طلب فتح</span>
            <span className="inline-flex items-center gap-1 text-sky-700"><span className="w-2 h-2 rounded-full bg-sky-300" /> فتح نشط</span>
            <span className="text-slate-400 tabular-nums">{rows.length} جهة</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-right">
            <thead className="bg-[#f7f9fb] border-b border-slate-200 text-[9px] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-extrabold w-12 text-center">م</th>
                <th className="px-4 py-3 font-extrabold">مكان تسجيل البيانات</th>
                <th className="px-4 py-3 font-extrabold text-center">تاريخ البيان</th>
                <th className="px-4 py-3 font-extrabold text-center">أول تسجيل</th>
                <th className="px-4 py-3 font-extrabold text-center">آخر تحديث</th>
                <th className="px-4 py-3 font-extrabold text-center">اكتمال الأقسام</th>
                <th className="px-4 py-3 font-extrabold text-center">الحالة</th>
                <th className="px-4 py-3 font-extrabold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.length === 0 && (
                <tr><td colSpan={8} className="py-14 text-center text-[10px] text-slate-400">{emptyMessage}</td></tr>
              )}
              {visibleRows.map((submission, index) => {
                const created = formatCairoDateTime(submission.created_at);
                const updated = formatCairoDateTime(submission.updated_at);
                const completion = getSubmissionCompletion(submission);
                const status = getSubmissionStatusLabel(submission);
                const flag = operationalFlag(submission, deadline);
                return (
                  <tr key={submission.id} className={`${flag?.rowClass || 'hover:bg-[#fbfcfd]'} transition text-[10px]`}>
                    <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{(safePage - 1) * pageSize + index + 1}</td>
                    <td className="px-4 py-3 min-w-[250px]">
                      <div className="font-extrabold text-[#172033]">{submission.district_name_ar}</div>
                      <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400"><MapPin className="w-3 h-3" />محافظة {submission.governorate_name_ar}</div>
                      {flag && (
                        <span className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[8px] font-extrabold ${flag.badgeClass}`}>
                          {flag.icon}
                          {flag.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 tabular-nums"><CalendarDays className="w-3.5 h-3.5 text-slate-400" />{submission.submission_date}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="font-bold text-slate-700">{created.time}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">{created.date}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold text-[#087f78]"><Clock3 className="w-3.5 h-3.5" />{updated.time}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">{updated.date}</div>
                    </td>
                    <td className="px-4 py-3 text-center min-w-[150px]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#087f78] rounded-full" style={{ width: `${completion.percentage}%` }} />
                        </div>
                        <span className="font-extrabold text-[#172033] tabular-nums">{completion.completed}/{completion.total}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-lg border text-[8px] font-extrabold ${statusClass(status)}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center items-center gap-1.5 flex-wrap">
                        <button onClick={() => handleView(submission)} className="h-8 px-3 rounded-lg gov-btn-secondary text-[9px] font-extrabold inline-flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> التفاصيل
                        </button>
                        {renderActions?.(submission)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length > pageSize && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-[#fbfcfd]">
            <div className="text-[9px] text-slate-500">عرض {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, rows.length)} من {rows.length}</div>
            <div className="flex items-center gap-2">
              <button disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 px-3 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-[9px] font-bold inline-flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5" /> السابق
              </button>
              <span className="text-[9px] font-extrabold text-slate-600">صفحة {safePage} من {totalPages}</span>
              <button disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="h-8 px-3 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-[9px] font-bold inline-flex items-center gap-1">
                التالي <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {localDetails && (
        <div className="fixed inset-0 z-[80] bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center p-4" onClick={() => setLocalDetails(null)}>
          <div className="w-full max-w-5xl max-h-[88vh] overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#172033]">{localDetails.district_name_ar}</h3>
                <p className="text-[9px] text-slate-500 mt-1">محافظة {localDetails.governorate_name_ar} · بيان {localDetails.submission_date}</p>
              </div>
              <button onClick={() => setLocalDetails(null)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-auto max-h-[72vh]">
              <table className="w-full min-w-[820px] text-right">
                <thead className="sticky top-0 bg-[#f7f9fb] border-b border-slate-200 text-[9px] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">القسم</th>
                    <th className="px-4 py-3 text-center">القيمة 1</th>
                    <th className="px-4 py-3 text-center">القيمة 2</th>
                    <th className="px-4 py-3 text-center">القيمة 3</th>
                    <th className="px-4 py-3 text-center">الحالة</th>
                    <th className="px-4 py-3">آخر تحديث بالقسم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SECTIONS_DEFINITIONS.map(def => {
                    const section = localDetails.sections?.[def.code];
                    return (
                      <tr key={def.code} className="text-[10px]">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-[#172033]">{def.name_ar}</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">قسم {def.code}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold tabular-nums">{(section?.field_1_value || 0).toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-indigo-700 tabular-nums">{(section?.field_2_value || 0).toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-emerald-700 tabular-nums">{(section?.field_3_value || 0).toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{section?.status === 'completed' ? 'مكتمل' : section?.status === 'draft' ? 'مسودة' : 'غير مدخل'}</td>
                        <td className="px-4 py-3 text-slate-500">{formatCairoDateTime(section?.last_updated_at).time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
