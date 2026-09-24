'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DailySubmission, AuditLog } from '@/lib/types';
import { SECTIONS_DEFINITIONS } from '@/lib/constants';
import { fetchSubmissionDetails } from '@/lib/services/submissions-client';
import { fetchSubmissionAuditLogs } from '@/lib/services/audit-client';
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  X,
  History,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  RefreshCw,
  Layers
} from 'lucide-react';

interface SubmissionMonitoringTableProps {
  submissions: DailySubmission[];
  title?: string;
  description?: string;
  pageSize?: number;
  paginateLocally?: boolean;
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
  const late = deadlinePassed && (submission.status === 'DRAFT' || submission.status === 'RETURNED') && !activeOverride && !requestedOverride;

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

interface TimelineEvent {
  id: string;
  timestamp: string;
  timeDisplay: string;
  dateDisplay: string;
  actor: string;
  role: string;
  actionTitle: string;
  actionType: 'creation' | 'edit' | 'lock' | 'return' | 'override' | 'directorate_approval' | 'ministry_approval' | 'audit_log';
  description: string;
}

function buildSubmissionTimeline(submission: DailySubmission, auditLogs: AuditLog[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. تدشين وإنشاء البيان
  if (submission.created_at) {
    const c = formatCairoDateTime(submission.created_at);
    events.push({
      id: `creation-${submission.id}`,
      timestamp: submission.created_at,
      timeDisplay: c.time,
      dateDisplay: c.date,
      actor: 'مسؤول الإدخال بالإدارة الصحية',
      role: 'الإدارة الصحية',
      actionTitle: 'تدشين وبدء السجل اليومي',
      actionType: 'creation',
      description: `تم فتح وتدشين السجل اليومي للإدارة الصحية (${submission.district_name_ar}) لبيان يوم ${submission.submission_date}.`,
    });
  }

  // 2. حركات تعديل الأقسام من history_logs
  if (submission.history_logs) {
    Object.entries(submission.history_logs).forEach(([codeStr, entries]) => {
      const code = Number(codeStr);
      const def = SECTIONS_DEFINITIONS.find(d => d.code === code);
      const secName = def?.name_ar || `قسم ${code}`;
      if (Array.isArray(entries)) {
        entries.forEach((e, idx) => {
          const t = formatCairoDateTime(e.timestamp || e.date);
          events.push({
            id: `sec-${code}-${idx}-${e.id || e.timestamp}`,
            timestamp: e.timestamp || e.date,
            timeDisplay: t.time,
            dateDisplay: t.date,
            actor: e.editor_name || 'مسؤول الإدخال',
            role: 'الإدارة الصحية',
            actionTitle: `تحديث بيانات: ${secName}`,
            actionType: 'edit',
            description: `تم تسجيل وتحديث قيم القسم (قيمة 1: ${(e.field_1_value || 0).toLocaleString('en-US')}, قيمة 2: ${(e.field_2_value || 0).toLocaleString('en-US')}, قيمة 3: ${(e.field_3_value || 0).toLocaleString('en-US')})${e.notes ? ' — ملاحظات: ' + e.notes : ''}.`,
          });
        });
      }
    });
  }

  // 3. إرجاع البيان للتصحيح
  if (submission.returned_at || submission.returned_reason) {
    const r = formatCairoDateTime(submission.returned_at);
    events.push({
      id: `returned-${submission.id}`,
      timestamp: submission.returned_at || submission.updated_at,
      timeDisplay: r.time,
      dateDisplay: r.date,
      actor: submission.returned_by || 'مديرية الشئون الصحية',
      role: 'مديرية الشئون الصحية',
      actionTitle: 'إرجاع البيان للتصحيح والاستيفاء',
      actionType: 'return',
      description: `تم إرجاع البيان إلى الإدارة الصحية لتعديل البيانات. السبب: ${submission.returned_reason || 'غير محدد'}.`,
    });
  }

  // 4. فتح استثنائي
  if (submission.override_granted_at || submission.override_reason) {
    const o = formatCairoDateTime(submission.override_granted_at);
    events.push({
      id: `override-${submission.id}`,
      timestamp: submission.override_granted_at || submission.updated_at,
      timeDisplay: o.time,
      dateDisplay: o.date,
      actor: submission.override_granted_by || 'الجهة المانحة للاستثناء',
      role: 'سلطة الإشراف والحوكمة',
      actionTitle: 'منح فتح استثنائي خارج الحوكمة الزمنية',
      actionType: 'override',
      description: `تم فتح النظام استثنائياً للإدارة. المبرر: ${submission.override_reason || 'طلب إداري'}${submission.override_expires_at ? ' — ينتهي الفتح في: ' + formatCairoDateTime(submission.override_expires_at).time : ''}.`,
    });
  }

  // 5. اعتماد مديرية الشئون الصحية
  if (submission.directorate_status === 'APPROVED') {
    const a = formatCairoDateTime(submission.updated_at);
    events.push({
      id: `dir-approved-${submission.id}`,
      timestamp: submission.updated_at,
      timeDisplay: a.time,
      dateDisplay: a.date,
      actor: `مديرية ${submission.governorate_name_ar}`,
      role: 'مديرية الشئون الصحية',
      actionTitle: 'اعتماد مديرية الشئون الصحية بالمحافظة',
      actionType: 'directorate_approval',
      description: `تمت مراجعة وتدقيق واعتماد البيان رسمياً من مديرية الشئون الصحية بمحافظة ${submission.governorate_name_ar}.`,
    });
  }

  // 6. الاعتماد القومي النهائي لديوان عام الوزارة
  if (submission.ministry_status === 'APPROVED') {
    const m = formatCairoDateTime(submission.updated_at);
    events.push({
      id: `min-approved-${submission.id}`,
      timestamp: submission.updated_at,
      timeDisplay: m.time,
      dateDisplay: m.date,
      actor: 'ديوان عام الوزارة',
      role: 'قطاع الرعاية الصحية وتنمية الأسرة',
      actionTitle: 'الاعتماد النهائي القومي الشامل',
      actionType: 'ministry_approval',
      description: 'تم الاعتماد النهائي للبيان ضمن التقرير القومي الموحد لقطاع الرعاية وتنمية الأسرة بالوزارة.',
    });
  }

  // 7. أحداث التدقيق من قاعدة البيانات (audit_logs)
  auditLogs.forEach((log, idx) => {
    const exists = events.some(e => e.description === log.description || e.actionTitle === log.action_type);
    if (!exists) {
      events.push({
        id: `audit-${log.id || idx}`,
        timestamp: log.timestamp,
        timeDisplay: log.timestamp,
        dateDisplay: '',
        actor: log.actor_name,
        role: log.actor_role,
        actionTitle: log.action_type,
        actionType: 'audit_log',
        description: log.description,
      });
    }
  });

  // الترتيب زمنيًا من الأحدث إلى الأقدم
  return events.sort((a, b) => {
    const tA = new Date(a.timestamp).getTime() || 0;
    const tB = new Date(b.timestamp).getTime() || 0;
    return tB - tA;
  });
}

export const SubmissionMonitoringTable: React.FC<SubmissionMonitoringTableProps> = ({
  submissions,
  title = 'متابعة جهات الإدخال',
  description = 'صف واحد لكل جهة، والتفاصيل تظهر عند الطلب دون أي استدعاء إضافي لقاعدة البيانات.',
  pageSize = 50,
  paginateLocally = true,
  deadline = '15:00',
  emptyMessage = 'لا توجد بيانات مطابقة.',
  onView,
  renderActions,
}) => {
  const [page, setPage] = useState(1);
  const [localDetails, setLocalDetails] = useState<DailySubmission | null>(null);
  const [modalTab, setModalTab] = useState<'sections' | 'audit'>('sections');
  const [submissionAuditLogs, setSubmissionAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const detailsCache = useRef(new Map<string, DailySubmission>());

  const rows = useMemo(() => [...submissions].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || a.submission_date).getTime();
    const bTime = new Date(b.updated_at || b.created_at || b.submission_date).getTime();
    return bTime - aTime;
  }), [submissions]);

  const totalPages = paginateLocally ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const safePage = paginateLocally ? Math.min(page, totalPages) : 1;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleRows = paginateLocally
    ? rows.slice((safePage - 1) * pageSize, safePage * pageSize)
    : rows;

  const handleView = async (submission: DailySubmission, initialTab: 'sections' | 'audit' = 'sections') => {
    setModalTab(initialTab);

    if (onView) {
      onView(submission);
      return;
    }

    const cached = detailsCache.current.get(submission.id);
    if (cached) {
      setLocalDetails(cached);
    } else {
      setLoadingDetailsId(submission.id);
      try {
        const details = await fetchSubmissionDetails(submission.id);
        detailsCache.current.set(submission.id, details);
        setLocalDetails(details);
      } catch (error) {
        console.error('Failed to load submission details.', error);
        setLocalDetails(submission);
      } finally {
        setLoadingDetailsId(null);
      }
    }

    // جلب سجلات التدقيق التكميلية للسجل
    setLoadingLogs(true);
    try {
      const logs = await fetchSubmissionAuditLogs(submission.id, submission.district_id);
      setSubmissionAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load submission audit logs', err);
      setSubmissionAuditLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const timelineEvents = useMemo(() => {
    if (!localDetails) return [];
    return buildSubmissionTimeline(localDetails, submissionAuditLogs);
  }, [localDetails, submissionAuditLogs]);

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
          <table className="w-full min-w-[1050px] text-right border-collapse">
            <thead className="bg-[#f7f9fb] border-b border-slate-200 text-[10px] text-slate-600 select-none">
              <tr>
                <th className="px-4 py-3 font-extrabold w-12 text-center">م</th>
                <th className="px-4 py-3 font-extrabold min-w-[220px]">مكان تسجيل البيانات</th>
                <th className="px-4 py-3 font-extrabold text-center min-w-[110px]">تاريخ البيان</th>
                <th className="px-4 py-3 font-extrabold text-center min-w-[95px]">أول تسجيل</th>
                <th className="px-4 py-3 font-extrabold text-center min-w-[95px]">آخر تحديث</th>
                <th className="px-4 py-3 font-extrabold text-center min-w-[130px]">اكتمال الأقسام</th>
                <th className="px-4 py-3 font-extrabold text-center min-w-[100px]">الحالة</th>
                <th className="px-4 py-3 font-extrabold text-center min-w-[170px]">الإجراءات</th>
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
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="font-extrabold text-[#172033]">{submission.district_name_ar}</div>
                      <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400"><MapPin className="w-3 h-3 text-[#087f78]" />محافظة {submission.governorate_name_ar}</div>
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
                      <div className="font-bold text-slate-700 tabular-nums">{created.time}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5 tabular-nums">{created.date}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold text-[#087f78] tabular-nums"><Clock3 className="w-3.5 h-3.5" />{updated.time}</div>
                      <div className="text-[8px] text-slate-400 mt-0.5 tabular-nums">{updated.date}</div>
                    </td>
                    <td className="px-4 py-3 text-center min-w-[130px]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
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
                        <button
                          onClick={() => void handleView(submission, 'sections')}
                          disabled={loadingDetailsId === submission.id}
                          className="h-8 px-2.5 rounded-lg gov-btn-secondary text-[9px] font-extrabold inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Eye className="w-3 h-3" />
                          {loadingDetailsId === submission.id && modalTab === 'sections' ? 'تحميل...' : 'التفاصيل'}
                        </button>
                        <button
                          onClick={() => void handleView(submission, 'audit')}
                          disabled={loadingDetailsId === submission.id}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[9px] font-extrabold inline-flex items-center gap-1 transition shadow-xs disabled:opacity-50"
                        >
                          <History className="w-3 h-3 text-[#087f78]" />
                          {loadingDetailsId === submission.id && modalTab === 'audit' ? 'تحميل...' : 'سجل الحركات'}
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

        {paginateLocally && rows.length > pageSize && (
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
        <div className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-5" onClick={() => setLocalDetails(null)}>
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-white via-white to-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#172033]">{localDetails.district_name_ar}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                    محافظة {localDetails.governorate_name_ar}
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">بيان {localDetails.submission_date}</span>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-extrabold">
                  <button
                    onClick={() => setModalTab('sections')}
                    className={`h-7 px-3 rounded-lg transition flex items-center gap-1.5 ${
                      modalTab === 'sections'
                        ? 'bg-white text-[#087f78] shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>بيانات الأقسام (12)</span>
                  </button>
                  <button
                    onClick={() => setModalTab('audit')}
                    className={`h-7 px-3 rounded-lg transition flex items-center gap-1.5 ${
                      modalTab === 'audit'
                        ? 'bg-white text-[#087f78] shadow-xs ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>سجل الحركات والرقابة</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-[#eaf9f7] text-[#087f78] text-[9px] tabular-nums font-black">
                      {timelineEvents.length}
                    </span>
                  </button>
                </div>

                <button onClick={() => setLocalDetails(null)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-auto flex-1 max-h-[75vh]">
              {modalTab === 'sections' && (
                <table className="w-full min-w-[820px] text-right">
                  <thead className="sticky top-0 bg-[#f7f9fb] border-b border-slate-200 text-[10px] text-slate-600 font-extrabold select-none">
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
                        <tr key={def.code} className="text-[10px] hover:bg-[#fbfcfd]">
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-[#172033]">{def.name_ar}</div>
                            <div className="text-[8px] text-slate-400 mt-0.5">قسم {def.code}</div>
                          </td>
                          <td className="px-4 py-3 text-center font-extrabold tabular-nums">{(section?.field_1_value || 0).toLocaleString('en-US')}</td>
                          <td className="px-4 py-3 text-center font-extrabold text-indigo-700 tabular-nums">{(section?.field_2_value || 0).toLocaleString('en-US')}</td>
                          <td className="px-4 py-3 text-center font-extrabold text-emerald-700 tabular-nums">{(section?.field_3_value || 0).toLocaleString('en-US')}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-md border text-[9px] font-bold ${
                              section?.status === 'completed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : section?.status === 'draft'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}>
                              {section?.status === 'completed' ? 'مكتمل' : section?.status === 'draft' ? 'مسودة' : 'غير مدخل'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 tabular-nums">{formatCairoDateTime(section?.last_updated_at).time}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {modalTab === 'audit' && (
                <div className="p-5 space-y-4">
                  {/* Summary Status Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl border border-slate-200 bg-[#fbfcfd]">
                      <div className="text-[9px] text-slate-400 mb-0.5">تاريخ وأول تسجيل</div>
                      <div className="text-[11px] font-extrabold text-slate-800 tabular-nums">
                        {formatCairoDateTime(localDetails.created_at).time}
                      </div>
                      <div className="text-[8px] text-slate-400 mt-0.5">
                        {formatCairoDateTime(localDetails.created_at).date}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-[#fbfcfd]">
                      <div className="text-[9px] text-slate-400 mb-0.5">آخر تعديل وحفظ</div>
                      <div className="text-[11px] font-extrabold text-[#087f78] tabular-nums">
                        {formatCairoDateTime(localDetails.updated_at).time}
                      </div>
                      <div className="text-[8px] text-slate-400 mt-0.5">
                        {formatCairoDateTime(localDetails.updated_at).date}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-[#fbfcfd]">
                      <div className="text-[9px] text-slate-400 mb-0.5">اعتماد المديرية</div>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-md border text-[9px] font-bold ${
                          localDetails.directorate_status === 'APPROVED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : localDetails.directorate_status === 'RETURNED'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {localDetails.directorate_status === 'APPROVED' ? 'معتمد' : localDetails.directorate_status === 'RETURNED' ? 'مرجع للتصحيح' : 'بانتظار المراجعة'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 bg-[#fbfcfd]">
                      <div className="text-[9px] text-slate-400 mb-0.5">الاعتماد القومي النهائي</div>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-md border text-[9px] font-bold ${
                          localDetails.ministry_status === 'APPROVED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {localDetails.ministry_status === 'APPROVED' ? 'معتمد مركزياً' : 'قيد التدقيق'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights Banners (Returned / Override) */}
                  {localDetails.returned_reason && (
                    <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-800 text-[10px] space-y-1">
                      <div className="flex items-center gap-1.5 font-extrabold text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>بيان الإرجاع للتصحيح من المديرية</span>
                      </div>
                      <p className="leading-relaxed">
                        قام <span className="font-bold">{localDetails.returned_by || 'مراجع المديرية'}</span> بإرجاع هذا البيان في <span className="font-bold">{formatCairoDateTime(localDetails.returned_at).date} ({formatCairoDateTime(localDetails.returned_at).time})</span>.
                      </p>
                      <div className="p-2 rounded-lg bg-white/80 border border-rose-200 font-medium mt-1">
                        السبب: {localDetails.returned_reason}
                      </div>
                    </div>
                  )}

                  {localDetails.override_reason && (
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 text-[10px] space-y-1">
                      <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>فتح استثنائي للسجل خارج المواعيد</span>
                      </div>
                      <p className="leading-relaxed">
                        ممنوح بواسطة <span className="font-bold">{localDetails.override_granted_by || 'سلطة المنظومة'}</span> في <span className="font-bold">{formatCairoDateTime(localDetails.override_granted_at).time}</span>.
                      </p>
                      <div className="p-2 rounded-lg bg-white/80 border border-amber-200 font-medium mt-1">
                        المبرر: {localDetails.override_reason}
                        {localDetails.override_expires_at && ` (ينتهي الفتح في: ${formatCairoDateTime(localDetails.override_expires_at).time})`}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-3 bg-[#f8fafc] border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#087f78]" />
                        <h4 className="text-[11px] font-extrabold text-[#172033]">
                          التسلسل الزمني الكامل لكافة الحركات ({timelineEvents.length})
                        </h4>
                      </div>
                      {loadingLogs && (
                        <span className="flex items-center gap-1 text-[9px] text-[#087f78] font-bold">
                          <RefreshCw className="w-3 h-3 animate-spin" /> جاري تدقيق سجلات السيرفر...
                        </span>
                      )}
                    </div>

                    <div className="p-4 divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                      {timelineEvents.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-xs">
                          لا توجد حركات مسجلة حتى الآن لهذا البيان.
                        </div>
                      ) : (
                        timelineEvents.map((ev, idx) => {
                          const isApproval = ev.actionType === 'directorate_approval' || ev.actionType === 'ministry_approval';
                          const isReturn = ev.actionType === 'return';
                          const isOverride = ev.actionType === 'override';
                          const isCreation = ev.actionType === 'creation';

                          return (
                            <div key={ev.id || idx} className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3 text-[10px]">
                              {/* Icon Badge */}
                              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                                isApproval
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : isReturn
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : isOverride
                                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                                      : isCreation
                                        ? 'bg-sky-50 border-sky-200 text-sky-700'
                                        : 'bg-[#eaf9f7] border-[#bfebe5] text-[#087f78]'
                              }`}>
                                {isApproval ? <ShieldCheck className="w-4 h-4" /> :
                                 isReturn ? <AlertTriangle className="w-4 h-4" /> :
                                 isOverride ? <ShieldAlert className="w-4 h-4" /> :
                                 isCreation ? <Sparkles className="w-4 h-4" /> :
                                 <CheckCircle2 className="w-4 h-4" />}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[#172033] text-[11px]">{ev.actionTitle}</span>
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[8px] font-bold">
                                      {ev.role}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 tabular-nums">
                                    <Clock3 className="w-3 h-3" />
                                    <span>{ev.timeDisplay}</span>
                                    {ev.dateDisplay && <span>• {ev.dateDisplay}</span>}
                                  </div>
                                </div>

                                <p className="text-slate-600 leading-relaxed font-normal">
                                  {ev.description}
                                </p>

                                <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400">
                                  <User className="w-3 h-3" />
                                  <span>القائم بالإجراء: <strong className="text-slate-600 font-bold">{ev.actor}</strong></span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
