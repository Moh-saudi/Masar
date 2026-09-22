'use client';

import React, { useMemo, useState } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SECTIONS_DEFINITIONS, SAMPLE_GOVERNORATES } from '@/lib/constants';
import { exportToStyledExcel, exportToExcelFile } from '@/lib/excel-export';
import { SubmissionMonitoringTable, formatCairoDateTime } from './SubmissionMonitoringTable';
import { FileSpreadsheet, Download, Printer, Search, RotateCcw, SlidersHorizontal, Building2, Users, ArrowLeftRight, ShieldCheck } from 'lucide-react';

interface ReportsCenterViewProps { submissions: DailySubmission[]; user: UserProfile; }

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({ submissions }) => {
  const [selectedGov, setSelectedGov] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const availableDates = useMemo(() => Array.from(new Set(submissions.map(s => s.submission_date))).sort().reverse(), [submissions]);

  const availableDistricts = useMemo(() => {
    const gov = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    const source = selectedGov === 'all' || !gov ? submissions : submissions.filter(s => s.governorate_name_ar === gov.name_ar);
    return Array.from(new Set(source.map(s => s.district_name_ar))).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [selectedGov, submissions]);

  const filteredSubmissions = useMemo(() => {
    const gov = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    const term = searchTerm.trim().toLowerCase();
    return submissions.filter(sub => {
      if (selectedGov !== 'all' && gov && sub.governorate_name_ar !== gov.name_ar) return false;
      if (selectedDistrict !== 'all' && sub.district_name_ar !== selectedDistrict) return false;
      if (selectedStatus !== 'all' && sub.status !== selectedStatus) return false;
      if (selectedDate !== 'all' && sub.submission_date !== selectedDate) return false;
      if (term && !`${sub.governorate_name_ar} ${sub.district_name_ar}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [submissions, selectedGov, selectedDistrict, selectedStatus, selectedDate, searchTerm]);

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

  const reset = () => {
    setSelectedGov('all'); setSelectedDistrict('all'); setSelectedStatus('all'); setSelectedDate('all'); setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="gov-surface px-5 py-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5"><FileSpreadsheet className="w-4 h-4 text-[#087f78]" /><h2 className="text-sm font-extrabold text-[#172033]">مركز المتابعة والتقارير</h2></div>
            <p className="text-[10px] text-slate-500 leading-5">تحميل واحد للبيانات؛ التصفية والتصفح والتفاصيل تتم محليًا دون طلبات إضافية.</p>
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

      <SubmissionMonitoringTable submissions={filteredSubmissions} />
    </div>
  );
};
