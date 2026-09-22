'use client';

import React, { useMemo, useState } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SECTIONS_DEFINITIONS, SAMPLE_GOVERNORATES } from '@/lib/constants';
import { exportToStyledExcel, exportToExcelFile } from '@/lib/excel-export';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  RotateCcw,
  SlidersHorizontal,
  Building2,
  MapPin,
  CalendarDays,
  Clock3,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface ReportsCenterViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
}

const PAGE_SIZE = 50;

const statusLabel = (status: DailySubmission['status']) =>
  status === 'APPROVED'
    ? 'معتمد'
    : status === 'SUBMITTED_LOCKED'
      ? 'مرفوع للمديرية'
      : status === 'RETURNED'
        ? 'مرجع للتصحيح'
        : 'مسودة';

const statusClass = (status: string) =>
  status === 'معتمد'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : status === 'مرفوع للمديرية'
      ? 'bg-[#eef9f7] border-[#ccebe7] text-[#087f78]'
      : status === 'مرجع للتصحيح'
        ? 'bg-rose-50 border-rose-200 text-rose-700'
        : 'bg-amber-50 border-amber-200 text-amber-700';

function formatDateTime(value?: string) {
  if (!value) return { date: '—', time: '—' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: value.slice(0, 10), time: value.slice(11, 16) || '—' };

  return {
    date: new Intl.DateTimeFormat('ar-EG', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d),
    time: new Intl.DateTimeFormat('ar-EG', {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d),
  };
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({ submissions }) => {
  const [selectedGov, setSelectedGov] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<DailySubmission | null>(null);

  const availableDates = useMemo(
    () => Array.from(new Set(submissions.map(s => s.submission_date))).sort().reverse(),
    [submissions]
  );

  const availableDistricts = useMemo(() => {
    const filtered = selectedGov === 'all'
      ? submissions
      : submissions.filter(s => {
          const govObj = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
          return govObj ? s.governorate_name_ar === govObj.name_ar : true;
        });

    return Array.from(new Set(filtered.map(s => s.district_name_ar))).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [selectedGov, submissions]);

  const filteredSubmissions = useMemo(() => {
    const govObj = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    const term = searchTerm.trim().toLowerCase();

    return [...submissions]
      .filter(sub => {
        if (selectedGov !== 'all' && govObj && sub.governorate_name_ar !== govObj.name_ar) return false;
        if (selectedDistrict !== 'all' && sub.district_name_ar !== selectedDistrict) return false;
        if (selectedStatus !== 'all' && sub.status !== selectedStatus) return false;
        if (selectedDate !== 'all' && sub.submission_date !== selectedDate) return false;
        if (term) {
          const haystack = `${sub.governorate_name_ar} ${sub.district_name_ar}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || a.submission_date).getTime();
        const bTime = new Date(b.updated_at || b.created_at || b.submission_date).getTime();
        return bTime - aTime;
      });
  }, [submissions, selectedGov, selectedDistrict, selectedStatus, selectedDate, searchTerm]);

  const summaryRows = useMemo(() => filteredSubmissions.map(sub => {
    const sections = SECTIONS_DEFINITIONS.map(def => sub.sections?.[def.code]).filter(Boolean);
    const completed = sections.filter(sec => sec.status === 'completed').length;
    const completion = Math.round((completed / SECTIONS_DEFINITIONS.length) * 100);

    let attendees = 0;
    let referrals = 0;
    let larc = 0;

    SECTIONS_DEFINITIONS.forEach(def => {
      const sec = sub.sections?.[def.code];
      if (!sec) return;
      if (def.code !== 12) {
        attendees += sec.field_1_value || 0;
        referrals += sec.field_2_value || 0;
        larc += sec.field_3_value || 0;
      }
    });

    return {
      submission: sub,
      attendees,
      referrals,
      larc,
      completion,
      created: formatDateTime(sub.created_at),
      updated: formatDateTime(sub.updated_at),
      status: statusLabel(sub.status),
    };
  }), [filteredSubmissions]);

  const totalPages = Math.max(1, Math.ceil(summaryRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = summaryRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totals = useMemo(() => summaryRows.reduce(
    (acc, row) => {
      acc.attendees += row.attendees;
      acc.referrals += row.referrals;
      acc.larc += row.larc;
      return acc;
    },
    { attendees: 0, referrals: 0, larc: 0 }
  ), [summaryRows]);

  const detailedExportRows = useMemo(() => {
    const rows: any[] = [];

    filteredSubmissions.forEach(sub => {
      SECTIONS_DEFINITIONS.forEach(def => {
        const sec = sub.sections?.[def.code] || {
          field_1_value: 0,
          field_2_value: 0,
          field_3_value: 0,
          status: 'empty',
        };
        const created = formatDateTime(sub.created_at);
        const updated = formatDateTime(sub.updated_at);

        rows.push({
          date: sub.submission_date,
          governorate: sub.governorate_name_ar,
          district: sub.district_name_ar,
          sectionCode: def.code,
          sectionName: def.name_ar,
          field1: sec.field_1_value || 0,
          field2: sec.field_2_value || 0,
          field3: sec.field_3_value || 0,
          status: statusLabel(sub.status),
          createdAt: `${created.date} ${created.time}`,
          updatedAt: `${updated.date} ${updated.time}`,
        });
      });
    });

    return rows;
  }, [filteredSubmissions]);

  const exportColumns = [
    { header: 'تاريخ البيان', key: 'date' },
    { header: 'المحافظة', key: 'governorate' },
    { header: 'الإدارة الصحية', key: 'district' },
    { header: 'كود القسم', key: 'sectionCode' },
    { header: 'القسم التجميعي', key: 'sectionName' },
    { header: 'البيان 1', key: 'field1' },
    { header: 'البيان 2', key: 'field2' },
    { header: 'البيان 3', key: 'field3' },
    { header: 'حالة الاعتماد', key: 'status' },
    { header: 'وقت أول تسجيل', key: 'createdAt' },
    { header: 'آخر تحديث', key: 'updatedAt' },
  ];

  const resetFilters = () => {
    setSelectedGov('all');
    setSelectedDistrict('all');
    setSelectedStatus('all');
    setSelectedDate('all');
    setSearchTerm('');
    setPage(1);
  };

  const filterChange = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="gov-surface px-5 py-4 sm:px-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#087f78]" />
              <h2 className="text-sm font-extrabold text-[#172033]">مركز المتابعة والتقارير</h2>
            </div>
            <p className="text-[10px] text-slate-500 leading-5">
              عرض مجمّع على مستوى جهة الإدخال. كل صف يمثل إدارة صحية واحدة، والتفاصيل تظهر عند الطلب.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => window.print()} className="h-10 px-3.5 rounded-xl gov-btn-secondary text-[10px] font-extrabold flex items-center gap-2">
              <Printer className="w-4 h-4" /> طباعة
            </button>
            <button onClick={() => exportToExcelFile('masar_detailed_report', exportColumns, detailedExportRows)} className="h-10 px-3.5 rounded-xl gov-btn-secondary text-[10px] font-extrabold flex items-center gap-2">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => exportToStyledExcel('تقرير_مسار_التفصيلي', 'منظومة مَسَار - التقرير التفصيلي', exportColumns, detailedExportRows)} className="h-10 px-4 rounded-xl gov-btn-primary text-[10px] font-extrabold flex items-center gap-2">
              <Download className="w-4 h-4" /> تصدير Excel
            </button>
          </div>
        </div>
      </div>

      <div className="gov-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#087f78]" />
            <h3 className="text-xs font-extrabold text-[#172033]">تصفية الجهات</h3>
          </div>
          <button onClick={resetFilters} className="h-8 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold flex items-center gap-1.5 hover:bg-slate-100">
            <RotateCcw className="w-3.5 h-3.5" /> إعادة الضبط
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">تاريخ البيان</span>
            <select value={selectedDate} onChange={e => filterChange(() => setSelectedDate(e.target.value))} className="gov-input h-10 px-3 text-[10px]">
              <option value="all">كل التواريخ</option>
              {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
            </select>
          </label>

          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">المحافظة</span>
            <select value={selectedGov} onChange={e => filterChange(() => { setSelectedGov(e.target.value); setSelectedDistrict('all'); })} className="gov-input h-10 px-3 text-[10px]">
              <option value="all">كافة المحافظات</option>
              {SAMPLE_GOVERNORATES.map(gov => <option key={gov.code} value={gov.code}>محافظة {gov.name_ar}</option>)}
            </select>
          </label>

          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">الإدارة الصحية</span>
            <select value={selectedDistrict} onChange={e => filterChange(() => setSelectedDistrict(e.target.value))} className="gov-input h-10 px-3 text-[10px]">
              <option value="all">كافة الإدارات</option>
              {availableDistricts.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>

          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">حالة البيان</span>
            <select value={selectedStatus} onChange={e => filterChange(() => setSelectedStatus(e.target.value))} className="gov-input h-10 px-3 text-[10px]">
              <option value="all">كافة الحالات</option>
              <option value="APPROVED">معتمد</option>
              <option value="SUBMITTED_LOCKED">مرفوع للمديرية</option>
              <option value="RETURNED">مرجع للتصحيح</option>
              <option value="DRAFT">مسودة</option>
            </select>
          </label>

          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">بحث سريع</span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input value={searchTerm} onChange={e => filterChange(() => setSearchTerm(e.target.value))} placeholder="محافظة أو إدارة..." className="gov-input h-10 pr-9 pl-3 text-[10px]" />
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'جهات ظاهرة', value: summaryRows.length, icon: <Building2 className="w-4 h-4 text-[#087f78]" /> },
          { label: 'إجمالي المترددات', value: totals.attendees, icon: <MapPin className="w-4 h-4 text-sky-600" /> },
          { label: 'إجمالي التحويلات', value: totals.referrals, icon: <CheckCircle2 className="w-4 h-4 text-indigo-600" /> },
          { label: 'إجمالي القيمة الثالثة', value: totals.larc, icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> },
        ].map((item, index) => (
          <div key={index} className="gov-kpi">
            <div className="flex items-center gap-2 text-[9px] text-slate-500 mb-1.5">{item.icon}{item.label}</div>
            <div className="text-lg font-extrabold text-[#172033] tabular-nums">{item.value.toLocaleString('en-US')}</div>
          </div>
        ))}
      </div>

      <div className="gov-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-extrabold text-[#172033]">متابعة جهات الإدخال</h3>
            <p className="text-[9px] text-slate-400 mt-1">صف واحد لكل إدارة صحية لتجنب تكدس بيانات المستويات العليا.</p>
          </div>
          <span className="text-[9px] text-slate-400 tabular-nums">{summaryRows.length} جهة</span>
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
                <th className="px-4 py-3 font-extrabold text-center">عرض</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-[10px] text-slate-400">لا توجد جهات مطابقة لخيارات التصفية.</td></tr>
              )}

              {paginatedRows.map((row, idx) => (
                <tr key={row.submission.id} className="hover:bg-[#fbfcfd] transition text-[10px]">
                  <td className="px-4 py-3 text-center text-slate-400 tabular-nums">{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3 min-w-[260px]">
                    <div className="font-extrabold text-[#172033]">{row.submission.district_name_ar}</div>
                    <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      محافظة {row.submission.governorate_name_ar}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1.5 text-slate-600 tabular-nums">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      {row.submission.submission_date}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-bold text-slate-700">{row.created.time}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">{row.created.date}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1.5 font-bold text-[#087f78]"><Clock3 className="w-3.5 h-3.5" />{row.updated.time}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">{row.updated.date}</div>
                  </td>
                  <td className="px-4 py-3 text-center min-w-[150px]">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#087f78] rounded-full" style={{ width: `${row.completion}%` }} />
                      </div>
                      <span className="font-extrabold text-[#172033] tabular-nums">{row.completion}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-lg border text-[8px] font-extrabold ${statusClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setSelectedSubmission(row.submission)} className="h-8 px-3 rounded-lg gov-btn-secondary text-[9px] font-extrabold inline-flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {summaryRows.length > PAGE_SIZE && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-[#fbfcfd]">
            <div className="text-[9px] text-slate-500">
              عرض {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, summaryRows.length)} من {summaryRows.length} جهة
            </div>
            <div className="flex items-center gap-2">
              <button disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 px-3 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-[9px] font-bold inline-flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5" /> السابق
              </button>
              <span className="text-[9px] font-extrabold text-slate-600 tabular-nums">صفحة {safePage} من {totalPages}</span>
              <button disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="h-8 px-3 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-[9px] font-bold inline-flex items-center gap-1">
                التالي <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[1px] flex items-center justify-center p-4" onClick={() => setSelectedSubmission(null)}>
          <div className="w-full max-w-5xl max-h-[88vh] overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#172033]">{selectedSubmission.district_name_ar}</h3>
                <p className="text-[9px] text-slate-500 mt-1">محافظة {selectedSubmission.governorate_name_ar} · بيان {selectedSubmission.submission_date}</p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto max-h-[72vh]">
              <table className="w-full min-w-[800px] text-right">
                <thead className="sticky top-0 bg-[#f7f9fb] border-b border-slate-200 text-[9px] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">القسم</th>
                    <th className="px-4 py-3 text-center">القيمة 1</th>
                    <th className="px-4 py-3 text-center">القيمة 2</th>
                    <th className="px-4 py-3 text-center">القيمة 3</th>
                    <th className="px-4 py-3 text-center">حالة القسم</th>
                    <th className="px-4 py-3">آخر تحديث بالقسم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SECTIONS_DEFINITIONS.map(def => {
                    const sec = selectedSubmission.sections?.[def.code];
                    return (
                      <tr key={def.code} className="text-[10px]">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-[#172033]">{def.name_ar}</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">قسم {def.code}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold tabular-nums">{(sec?.field_1_value || 0).toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-indigo-700 tabular-nums">{(sec?.field_2_value || 0).toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-emerald-700 tabular-nums">{(sec?.field_3_value || 0).toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[8px] font-bold text-slate-600">{sec?.status === 'completed' ? 'مكتمل' : sec?.status === 'draft' ? 'مسودة' : 'غير مدخل'}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(sec?.last_updated_at).time}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
