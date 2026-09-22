'use client';

import React, { useMemo, useState } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SECTIONS_DEFINITIONS, SAMPLE_GOVERNORATES } from '@/lib/constants';
import { exportToStyledExcel, exportToExcelFile } from '@/lib/excel-export';
import { fetchSubmissionPage } from '@/lib/services/submissions-client';
import { getCairoDateString } from '@/lib/date';
import { SubmissionMonitoringTable, formatCairoDateTime } from './SubmissionMonitoringTable';
import { FileSpreadsheet, Download, Printer, Search, RotateCcw, SlidersHorizontal, Building2, Users, ArrowLeftRight, ShieldCheck, CalendarRange, Loader2 } from 'lucide-react';

interface ReportsCenterViewProps { submissions: DailySubmission[]; user: UserProfile; }

type PeriodPreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

function shiftedDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getCairoDateString(date);
}

function reportTitle(user: UserProfile) {
  if (user.role === 'district_user') return 'تقارير الإدارة الصحية';
  if (user.role === 'directorate_user') return 'تقارير مديرية الشئون الصحية';
  if (user.role === 'general_director') return 'تقارير الإدارة العامة';
  if (user.role === 'central_admin') return 'تقارير الإدارة المركزية';
  if (user.role === 'sector_head') return 'التقارير القومية';
  return 'مركز التقارير والرقابة';
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({ submissions, user }) => {
  const today = getCairoDateString();
  const [preset, setPreset] = useState<PeriodPreset>('today');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [selectedGov, setSelectedGov] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [remoteRows, setRemoteRows] = useState<DailySubmission[] | null>(null);
  const [resultCount, setResultCount] = useState(submissions.length);
  const [serverPage, setServerPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [loadingRange, setLoadingRange] = useState(false);
  const [rangeError, setRangeError] = useState('');

  const sourceSubmissions = remoteRows ?? submissions;

  const availableDates = useMemo(() => Array.from(new Set(sourceSubmissions.map(s => s.submission_date))).sort().reverse(), [sourceSubmissions]);

  const availableDistricts = useMemo(() => {
    const gov = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    const source = selectedGov === 'all' || !gov ? sourceSubmissions : sourceSubmissions.filter(s => s.governorate_name_ar === gov.name_ar);
    return Array.from(new Set(source.map(s => s.district_name_ar))).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [selectedGov, sourceSubmissions]);

  const filteredSubmissions = useMemo(() => {
    const gov = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    const term = searchTerm.trim().toLowerCase();
    return sourceSubmissions.filter(sub => {
      if (selectedGov !== 'all' && gov && sub.governorate_name_ar !== gov.name_ar) return false;
      if (selectedDistrict !== 'all' && sub.district_name_ar !== selectedDistrict) return false;
      if (selectedStatus !== 'all' && sub.status !== selectedStatus) return false;
      if (selectedDate !== 'all' && sub.submission_date !== selectedDate) return false;
      if (term && !`${sub.governorate_name_ar} ${sub.district_name_ar}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [sourceSubmissions, selectedGov, selectedDistrict, selectedStatus, selectedDate, searchTerm]);

  const totals = useMemo(() => {
    let attendees = 0, referrals = 0, value3 = 0;
    filteredSubmissions.forEach(sub => {
      SECTIONS_DEFINITIONS.forEach(def => {
        const section = sub.sections?.[def.code];
        if (!section || def.code === 12) return;
        attendees += section.field_1_value || 0;
        referrals += section.field_2_value || 0;
        value3 += section.field_3_value || 0;
      });
    });
    return { attendees, referrals, value3 };
  }, [filteredSubmissions]);

  const exportRows = useMemo(() => {
    const rows: Record<string, string | number>[] = [];
    filteredSubmissions.forEach(sub => {
      SECTIONS_DEFINITIONS.forEach(def => {
        const section = sub.sections?.[def.code];
        const created = formatCairoDateTime(sub.created_at);
        const updated = formatCairoDateTime(sub.updated_at);
        rows.push({
          date: sub.submission_date, governorate: sub.governorate_name_ar, district: sub.district_name_ar,
          sectionCode: def.code, sectionName: def.name_ar,
          field1: section?.field_1_value || 0, field2: section?.field_2_value || 0, field3: section?.field_3_value || 0,
          createdAt: `${created.date} ${created.time}`, updatedAt: `${updated.date} ${updated.time}`,
        });
      });
    });
    return rows;
  }, [filteredSubmissions]);

  const columns = [
    { header: 'تاريخ البيان', key: 'date' }, { header: 'المحافظة', key: 'governorate' },
    { header: 'الإدارة الصحية', key: 'district' }, { header: 'كود القسم', key: 'sectionCode' },
    { header: 'القسم', key: 'sectionName' }, { header: 'القيمة 1', key: 'field1' },
    { header: 'القيمة 2', key: 'field2' }, { header: 'القيمة 3', key: 'field3' },
    { header: 'أول تسجيل', key: 'createdAt' }, { header: 'آخر تحديث', key: 'updatedAt' },
  ];

  const applyPreset = (value: PeriodPreset) => {
    setPreset(value);
    if (value === 'today') {
      setFromDate(today); setToDate(today);
    } else if (value === 'yesterday') {
      const date = shiftedDate(-1); setFromDate(date); setToDate(date);
    } else if (value === 'last7') {
      setFromDate(shiftedDate(-6)); setToDate(today);
    } else if (value === 'last30') {
      setFromDate(shiftedDate(-29)); setToDate(today);
    }
  };

  const loadRange = async (page = 1) => {
    setRangeError('');
    if (!fromDate || !toDate) {
      setRangeError('حدد تاريخ البداية والنهاية.');
      return;
    }
    if (fromDate > toDate) {
      setRangeError('تاريخ البداية يجب أن يسبق تاريخ النهاية.');
      return;
    }

    if (fromDate === today && toDate === today && selectedGov === 'all' && selectedDistrict === 'all' && selectedStatus === 'all' && page === 1) {
      setRemoteRows(null);
      setResultCount(submissions.length);
      setServerPage(1);
      setServerTotalPages(1);
      return;
    }

    const gov = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    setLoadingRange(true);
    try {
      const result = await fetchSubmissionPage({
        fromDate,
        toDate,
        page,
        pageSize: 50,
        governorateName: selectedGov === 'all' ? undefined : gov?.name_ar,
        districtName: selectedDistrict === 'all' ? undefined : selectedDistrict,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      });
      setRemoteRows(result.rows);
      setResultCount(result.count);
      setServerPage(result.page);
      setServerTotalPages(result.totalPages);
    } catch {
      setRangeError('تعذر تحميل الفترة المطلوبة. أعد المحاولة.');
    } finally {
      setLoadingRange(false);
    }
  };

  const reset = () => {
    setPreset('today');
    setFromDate(today);
    setToDate(today);
    setSelectedGov('all');
    setSelectedDistrict('all');
    setSelectedStatus('all');
    setSelectedDate('all');
    setSearchTerm('');
    setRemoteRows(null);
    setResultCount(submissions.length);
    setServerPage(1);
    setServerTotalPages(1);
    setRangeError('');
  };

  return (
    <div className="space-y-4">
      <div className="gov-surface px-5 py-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5"><FileSpreadsheet className="w-4 h-4 text-[#087f78]" /><h2 className="text-sm font-extrabold text-[#172033]">{reportTitle(user)}</h2></div>
            <p className="text-[10px] text-slate-500 leading-5">بحث تاريخي منظم حسب نطاق صلاحية الحساب، والطلب يُنفذ فقط عند الضغط على «عرض النتائج».</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => window.print()} className="h-10 px-3.5 rounded-xl gov-btn-secondary text-[10px] font-extrabold flex items-center gap-2"><Printer className="w-4 h-4" /> طباعة</button>
            <button onClick={() => exportToExcelFile('masar_detailed_report', columns, exportRows)} className="h-10 px-3.5 rounded-xl gov-btn-secondary text-[10px] font-extrabold flex items-center gap-2"><Download className="w-4 h-4" /> CSV</button>
            <button onClick={() => exportToStyledExcel('تقرير_مسار_التفصيلي', 'منظومة مَسَار - التقرير التفصيلي', columns, exportRows)} className="h-10 px-4 rounded-xl gov-btn-primary text-[10px] font-extrabold flex items-center gap-2"><Download className="w-4 h-4" /> تصدير Excel</button>
          </div>
        </div>
      </div>

      <div className="gov-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2"><CalendarRange className="w-4 h-4 text-[#087f78]" /><h3 className="text-xs font-extrabold text-[#172033]">الفترة الزمنية</h3></div>
          <div className="text-[9px] text-slate-500">إجمالي النتائج: <strong className="text-[#172033] tabular-nums">{resultCount}</strong></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            ['today', 'اليوم'],
            ['yesterday', 'أمس'],
            ['last7', 'آخر 7 أيام'],
            ['last30', 'آخر 30 يومًا'],
            ['custom', 'فترة مخصصة'],
          ].map(([value, label]) => (
            <button key={value} onClick={() => applyPreset(value as PeriodPreset)} className={`h-9 px-3 rounded-lg border text-[9px] font-extrabold transition ${preset === value ? 'bg-[#087f78] text-white border-[#087f78]' : 'bg-white text-slate-600 border-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <label><span className="block text-[9px] font-bold text-slate-500 mb-1.5">من تاريخ</span><input type="date" value={fromDate} onChange={e => { setPreset('custom'); setFromDate(e.target.value); }} className="gov-input h-10 px-3 text-[10px]" /></label>
          <label><span className="block text-[9px] font-bold text-slate-500 mb-1.5">إلى تاريخ</span><input type="date" value={toDate} onChange={e => { setPreset('custom'); setToDate(e.target.value); }} className="gov-input h-10 px-3 text-[10px]" /></label>
          <button onClick={() => void loadRange(1)} disabled={loadingRange} className="h-10 px-5 rounded-xl gov-btn-primary text-[10px] font-extrabold flex items-center justify-center gap-2 disabled:opacity-60">
            {loadingRange ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            عرض النتائج
          </button>
        </div>
        {rangeError && <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-[9px] font-bold text-rose-700">{rangeError}</div>}
      </div>

      <div className="gov-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-[#087f78]" /><h3 className="text-xs font-extrabold text-[#172033]">تصفية الجهات</h3></div>
          <button onClick={reset} className="h-8 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> إعادة الضبط</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <label><span className="block text-[9px] font-bold text-slate-500 mb-1.5">تاريخ البيان</span><select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="gov-input h-10 px-3 text-[10px]"><option value="all">كل التواريخ</option>{availableDates.map(date => <option key={date} value={date}>{date}</option>)}</select></label>
          <label><span className="block text-[9px] font-bold text-slate-500 mb-1.5">المحافظة</span><select value={selectedGov} onChange={e => { setSelectedGov(e.target.value); setSelectedDistrict('all'); }} className="gov-input h-10 px-3 text-[10px]"><option value="all">كافة المحافظات</option>{SAMPLE_GOVERNORATES.map(gov => <option key={gov.code} value={gov.code}>محافظة {gov.name_ar}</option>)}</select></label>
          <label><span className="block text-[9px] font-bold text-slate-500 mb-1.5">الإدارة الصحية</span><select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="gov-input h-10 px-3 text-[10px]"><option value="all">كافة الإدارات</option>{availableDistricts.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
          <label><span className="block text-[9px] font-bold text-slate-500 mb-1.5">الحالة</span><select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="gov-input h-10 px-3 text-[10px]"><option value="all">كافة الحالات</option><option value="APPROVED">معتمد</option><option value="SUBMITTED_LOCKED">مرفوع</option><option value="RETURNED">مرجع</option><option value="DRAFT">مسودة</option></select></label>
          <label><span className="block text-[9px] font-bold text-slate-500 mb-1.5">بحث سريع</span><div className="relative"><Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="محافظة أو إدارة..." className="gov-input h-10 pr-9 pl-3 text-[10px]" /></div></label>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'الجهات الظاهرة', value: filteredSubmissions.length, icon: <Building2 className="w-4 h-4 text-[#087f78]" /> },
          { label: 'إجمالي المترددات', value: totals.attendees, icon: <Users className="w-4 h-4 text-sky-600" /> },
          { label: 'إجمالي التحويلات', value: totals.referrals, icon: <ArrowLeftRight className="w-4 h-4 text-indigo-600" /> },
          { label: 'إجمالي القيمة الثالثة', value: totals.value3, icon: <ShieldCheck className="w-4 h-4 text-emerald-600" /> },
        ].map((item, index) => <div key={index} className="gov-kpi"><div className="flex items-center gap-2 text-[9px] text-slate-500 mb-1.5">{item.icon}{item.label}</div><div className="text-lg font-extrabold text-[#172033] tabular-nums">{item.value.toLocaleString('en-US')}</div></div>)}
      </div>

      <SubmissionMonitoringTable
        submissions={filteredSubmissions}
        title="السجلات اليومية"
        description="الأحمر للسجلات المتأخرة، والأصفر لطلبات الفتح، والأزرق للفتح الاستثنائي النشط."
      />

      {remoteRows !== null && serverTotalPages > 1 && (
        <div className="gov-surface px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-[9px] text-slate-500">صفحة {serverPage} من {serverTotalPages}</span>
          <div className="flex items-center gap-2">
            <button disabled={serverPage <= 1 || loadingRange} onClick={() => void loadRange(serverPage - 1)} className="h-8 px-3 rounded-lg gov-btn-secondary text-[9px] font-extrabold disabled:opacity-40">السابق</button>
            <button disabled={serverPage >= serverTotalPages || loadingRange} onClick={() => void loadRange(serverPage + 1)} className="h-8 px-3 rounded-lg gov-btn-secondary text-[9px] font-extrabold disabled:opacity-40">التالي</button>
          </div>
        </div>
      )}
    </div>
  );
};
