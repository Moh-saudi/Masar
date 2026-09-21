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
  Rows3,
  Users,
  ArrowLeftRight,
  ShieldCheck
} from 'lucide-react';

interface ReportsCenterViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({
  submissions,
}) => {
  const [selectedGov, setSelectedGov] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const availableDistricts = useMemo(() => {
    if (selectedGov === 'all') {
      return Array.from(new Set(submissions.map(s => s.district_name_ar)));
    }

    const govObj = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    if (!govObj) return [];

    return submissions
      .filter(s => s.governorate_name_ar === govObj.name_ar)
      .map(s => s.district_name_ar);
  }, [selectedGov, submissions]);

  const reportRows = useMemo(() => {
    const rows: any[] = [];

    submissions.forEach(sub => {
      if (selectedGov !== 'all') {
        const govObj = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
        if (govObj && sub.governorate_name_ar !== govObj.name_ar) return;
      }

      if (selectedDistrict !== 'all' && sub.district_name_ar !== selectedDistrict) return;
      if (selectedStatus !== 'all' && sub.status !== selectedStatus) return;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches =
          sub.district_name_ar.toLowerCase().includes(term) ||
          sub.governorate_name_ar.toLowerCase().includes(term);
        if (!matches) return;
      }

      SECTIONS_DEFINITIONS.forEach(def => {
        if (selectedSection !== 'all' && def.code !== Number(selectedSection)) return;

        const sec = sub.sections[def.code] || {
          field_1_value: 0,
          field_2_value: 0,
          field_3_value: 0,
          status: 'empty',
        };

        const f1 = sec.field_1_value || 0;
        const f2 = sec.field_2_value || 0;
        const f3 = sec.field_3_value || 0;
        const convRate = f1 > 0 ? Math.round((f2 / f1) * 100) : 0;

        rows.push({
          id: `${sub.id}-${def.code}`,
          submissionId: sub.id,
          date: sub.submission_date,
          governorate: sub.governorate_name_ar,
          district: sub.district_name_ar,
          sectionCode: def.code,
          sectionName: def.name_ar,
          field1: f1,
          field2: f2,
          field3: f3,
          field1Label: def.field_1_label,
          field2Label: def.field_2_label,
          field3Label: def.field_3_label,
          convRate,
          status:
            sub.status === 'APPROVED' ? 'معتمد' :
            sub.status === 'SUBMITTED_LOCKED' ? 'مرفوع للمديرية' :
            sub.status === 'RETURNED' ? 'مرجع' :
            'مسودة',
          updatedAt: sub.updated_at ? sub.updated_at.split('T')[1]?.slice(0, 5) : '—',
        });
      });
    });

    return rows;
  }, [submissions, selectedGov, selectedDistrict, selectedSection, selectedStatus, searchTerm]);

  const totals = useMemo(() => {
    let attendees = 0;
    let referrals = 0;
    let larc = 0;

    reportRows.forEach(row => {
      if (row.sectionCode !== 12) {
        attendees += row.field1;
        referrals += row.field2;
        larc += row.field3;
      }
    });

    const avgConvRate = attendees > 0 ? Math.round((referrals / attendees) * 100) : 0;
    return { attendees, referrals, larc, avgConvRate };
  }, [reportRows]);

  const columns = [
    { header: 'التاريخ', key: 'date' },
    { header: 'المحافظة', key: 'governorate' },
    { header: 'الإدارة الصحية', key: 'district' },
    { header: 'كود القسم', key: 'sectionCode' },
    { header: 'القسم التجميعي', key: 'sectionName' },
    { header: 'البيان 1', key: 'field1' },
    { header: 'البيان 2', key: 'field2' },
    { header: 'البيان 3', key: 'field3' },
    { header: 'معدل التحويل %', key: 'convRate' },
    { header: 'حالة الاعتماد', key: 'status' },
    { header: 'وقت التسجيل', key: 'updatedAt' },
  ];

  const handleExportStyledExcel = () => {
    exportToStyledExcel(
      'تقرير_مسار_التفصيلي',
      'منظومة مَسَار - وزارة الصحة والسكان - التقرير الإحصائي التجميعي الشامل',
      columns,
      reportRows
    );
  };

  const handleExportCsv = () => {
    exportToExcelFile('masar_detailed_report', columns, reportRows);
  };

  const handleResetFilters = () => {
    setSelectedGov('all');
    setSelectedDistrict('all');
    setSelectedSection('all');
    setSelectedStatus('all');
    setSearchTerm('');
  };

  const statusClass = (status: string) =>
    status === 'معتمد'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : status === 'مرفوع للمديرية'
        ? 'bg-[#eef9f7] border-[#ccebe7] text-[#087f78]'
        : status === 'مرجع'
          ? 'bg-rose-50 border-rose-200 text-rose-700'
          : 'bg-amber-50 border-amber-200 text-amber-700';

  return (
    <div className="space-y-4">
      <div className="gov-surface px-5 py-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#087f78]" />
              <h2 className="text-sm font-extrabold text-[#172033]">مركز التقارير وتصدير البيانات</h2>
            </div>
            <p className="text-[10px] text-slate-500 leading-5">
              إعداد تقارير تفصيلية قابلة للتصفية والطباعة والتصدير حسب النطاق المتاح للمستخدم.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="h-10 px-3.5 rounded-xl gov-btn-secondary text-[10px] font-extrabold flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>

            <button
              onClick={handleExportCsv}
              className="h-10 px-3.5 rounded-xl gov-btn-secondary text-[10px] font-extrabold flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>

            <button
              onClick={handleExportStyledExcel}
              className="h-10 px-4 rounded-xl gov-btn-primary text-[10px] font-extrabold flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير Excel
            </button>
          </div>
        </div>
      </div>

      <div className="gov-surface p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#087f78]" />
            <h3 className="text-xs font-extrabold text-[#172033]">تصفية التقرير</h3>
          </div>
          <button
            onClick={handleResetFilters}
            className="h-8 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold flex items-center gap-1.5 hover:bg-slate-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة الضبط
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">المحافظة</span>
            <select
              value={selectedGov}
              onChange={e => {
                setSelectedGov(e.target.value);
                setSelectedDistrict('all');
              }}
              className="gov-input h-10 px-3 text-[10px]"
            >
              <option value="all">كافة المحافظات</option>
              {SAMPLE_GOVERNORATES.map(gov => (
                <option key={gov.code} value={gov.code}>محافظة {gov.name_ar}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">الإدارة الصحية</span>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="gov-input h-10 px-3 text-[10px]"
            >
              <option value="all">كافة الإدارات</option>
              {availableDistricts.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>

          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">القسم</span>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="gov-input h-10 px-3 text-[10px]"
            >
              <option value="all">كافة الأقسام الـ 12</option>
              {SECTIONS_DEFINITIONS.map(def => (
                <option key={def.code} value={def.code}>{def.code}. {def.name_ar}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">حالة البيان</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="gov-input h-10 px-3 text-[10px]"
            >
              <option value="all">كافة الحالات</option>
              <option value="APPROVED">معتمد</option>
              <option value="SUBMITTED_LOCKED">مرفوع للمديرية</option>
              <option value="RETURNED">مرجع للتصحيح</option>
              <option value="DRAFT">مسودة</option>
            </select>
          </label>

          <label>
            <span className="block text-[9px] font-bold text-slate-500 mb-1.5">بحث</span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="إدارة أو محافظة..."
                className="gov-input h-10 pr-9 pl-3 text-[10px]"
              />
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'السجلات المستخرجة', value: reportRows.length, icon: <Rows3 className="w-4 h-4 text-[#087f78]" /> },
          { label: 'إجمالي المترددات', value: totals.attendees, icon: <Users className="w-4 h-4 text-sky-600" /> },
          { label: 'التحويلات', value: totals.referrals, icon: <ArrowLeftRight className="w-4 h-4 text-indigo-600" /> },
          { label: 'متوسط التحويل', value: `${totals.avgConvRate}%`, icon: <ShieldCheck className="w-4 h-4 text-emerald-600" /> },
        ].map((item, index) => (
          <div key={index} className="gov-kpi">
            <div className="flex items-center gap-2 text-[9px] text-slate-500 mb-1.5">
              {item.icon}
              {item.label}
            </div>
            <div className="text-lg font-extrabold text-[#172033] tabular-nums">
              {typeof item.value === 'number' ? item.value.toLocaleString('en-US') : item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="gov-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-[#172033]">البيانات التفصيلية</h3>
            <p className="text-[9px] text-slate-400 mt-1">النتائج الحالية طبقًا لخيارات التصفية.</p>
          </div>
          <span className="text-[9px] text-slate-400 tabular-nums">{reportRows.length} صف</span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full min-w-[1050px] text-right">
            <thead className="sticky top-0 z-10 bg-[#f7f9fb] border-b border-slate-200 text-[9px] text-slate-500">
              <tr>
                <th className="px-3 py-3 font-extrabold text-center w-12">م</th>
                <th className="px-3 py-3 font-extrabold">المحافظة</th>
                <th className="px-3 py-3 font-extrabold">الإدارة الصحية</th>
                <th className="px-3 py-3 font-extrabold">القسم</th>
                <th className="px-3 py-3 font-extrabold text-center">القيمة 1</th>
                <th className="px-3 py-3 font-extrabold text-center">القيمة 2</th>
                <th className="px-3 py-3 font-extrabold text-center">القيمة 3</th>
                <th className="px-3 py-3 font-extrabold text-center">التحويل</th>
                <th className="px-3 py-3 font-extrabold text-center">الحالة</th>
                <th className="px-3 py-3 font-extrabold text-center">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-[10px] text-slate-400">
                    لا توجد بيانات مطابقة لخيارات التصفية الحالية.
                  </td>
                </tr>
              )}

              {reportRows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-[#fbfcfd] transition text-[10px]">
                  <td className="px-3 py-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="px-3 py-3 text-slate-600">{row.governorate}</td>
                  <td className="px-3 py-3 font-extrabold text-[#172033]">{row.district}</td>
                  <td className="px-3 py-3">
                    <div className="font-bold text-slate-700">{row.sectionName}</div>
                    <div className="text-[8px] text-slate-400 mt-0.5 tabular-nums">قسم {row.sectionCode}</div>
                  </td>
                  <td className="px-3 py-3 text-center font-extrabold tabular-nums">{row.field1.toLocaleString('en-US')}</td>
                  <td className="px-3 py-3 text-center font-extrabold text-indigo-700 tabular-nums">{row.field2.toLocaleString('en-US')}</td>
                  <td className="px-3 py-3 text-center font-extrabold text-emerald-700 tabular-nums">{row.field3.toLocaleString('en-US')}</td>
                  <td className="px-3 py-3 text-center">
                    {row.sectionCode === 12 ? (
                      <span className="text-[8px] text-slate-400">حصيلة LARC</span>
                    ) : (
                      <span className="font-extrabold text-[#087f78] tabular-nums">{row.convRate}%</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-lg border text-[8px] font-extrabold ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-500 tabular-nums">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
