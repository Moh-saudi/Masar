'use client';

import React, { useState, useMemo } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SECTIONS_DEFINITIONS, SAMPLE_GOVERNORATES } from '@/lib/constants';
import { exportToStyledExcel, exportToExcelFile } from '@/lib/excel-export';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Filter, 
  Search, 
  Calendar, 
  Building2, 
  Building,
  CheckCircle2,
  Share2,
  Users,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface ReportsCenterViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({
  submissions,
  user,
}) => {
  // حالات الفلاتر
  const [selectedGov, setSelectedGov] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // قائمة الإدارات المتاحة للمحافظة المختارة
  const availableDistricts = useMemo(() => {
    if (selectedGov === 'all') {
      return Array.from(new Set(submissions.map(s => s.district_name_ar)));
    }
    const govObj = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    if (!govObj) return [];
    return submissions.filter(s => s.governorate_name_ar === govObj.name_ar).map(s => s.district_name_ar);
  }, [selectedGov, submissions]);

  // تجهيز صفوف البيانات التفصيلية المفلترة
  const reportRows = useMemo(() => {
    const rows: any[] = [];

    submissions.forEach(sub => {
      // فلترة المحافظة
      if (selectedGov !== 'all') {
        const govObj = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
        if (govObj && sub.governorate_name_ar !== govObj.name_ar) return;
      }

      // فلترة الإدارة
      if (selectedDistrict !== 'all' && sub.district_name_ar !== selectedDistrict) {
        return;
      }

      // فلترة الحالة
      if (selectedStatus !== 'all' && sub.status !== selectedStatus) {
        return;
      }

      // فلترة نص البحث
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = sub.district_name_ar.toLowerCase().includes(term) ||
                            sub.governorate_name_ar.toLowerCase().includes(term);
        if (!matchesName) return;
      }

      // التكرار على الأقسام
      SECTIONS_DEFINITIONS.forEach(def => {
        if (selectedSection !== 'all' && def.code !== parseInt(selectedSection)) {
          return;
        }

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
          status: sub.status === 'APPROVED' ? 'معتمد' : 
                  sub.status === 'SUBMITTED_LOCKED' ? 'مرفوع للمديرية' : 
                  sub.status === 'RETURNED' ? 'مُرتجع' : 'مسودة',
          updatedAt: sub.updated_at ? sub.updated_at.split('T')[1]?.slice(0, 5) : '—',
        });
      });
    });

    return rows;
  }, [submissions, selectedGov, selectedDistrict, selectedSection, selectedStatus, searchTerm]);

  // إجماليات السجلات المفلترة
  const totals = useMemo(() => {
    let attendees = 0;
    let referrals = 0;
    let larc = 0;

    reportRows.forEach(r => {
      if (r.sectionCode !== 12) {
        attendees += r.field1;
        referrals += r.field2;
        larc += r.field3;
      }
    });

    const avgConvRate = attendees > 0 ? Math.round((referrals / attendees) * 100) : 0;
    return { attendees, referrals, larc, avgConvRate };
  }, [reportRows]);

  // تصدير الإكسيل المنسق (.xls)
  const handleExportStyledExcel = () => {
    const columns = [
      { header: 'التاريخ', key: 'date' },
      { header: 'المحافظة', key: 'governorate' },
      { header: 'الإدارة الصحية', key: 'district' },
      { header: 'كود القسم', key: 'sectionCode' },
      { header: 'القسم التجميعي', key: 'sectionName' },
      { header: 'البيان 1 (المترددات)', key: 'field1' },
      { header: 'البيان 2 (المحولات لـ ت.أ)', key: 'field2' },
      { header: 'البيان 3 (وسائل LARC)', key: 'field3' },
      { header: 'معدل التحويل %', key: 'convRate' },
      { header: 'حالة الاعتماد', key: 'status' },
      { header: 'وقت التسجيل', key: 'updatedAt' },
    ];

    exportToStyledExcel(
      'تقرير_مسار_التفصيلي',
      'منظومة مَسَار - وزارة الصحة والسكان - التقرير الإحصائي التجميعي الشامل',
      columns,
      reportRows
    );
  };

  // تصدير CSV
  const handleExportCsv = () => {
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

    exportToExcelFile('masar_detailed_report', columns, reportRows);
  };

  // إعادة ضبط الفلاتر
  const handleResetFilters = () => {
    setSelectedGov('all');
    setSelectedDistrict('all');
    setSelectedSection('all');
    setSelectedStatus('all');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. ترويسة مركز التقارير والتصدير */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">
              مركز التقارير التجميعية وتصدير البيانات (Excel Export Center)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إعداد واستخراج البيانات الإحصائية التفصيلية لجميع المستويات الإدارية بصيغة إكسيل معتمدة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>طباعة التقرير</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={handleExportStyledExcel}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير ملف إكسيل (.XLS) منسق</span>
          </button>
        </div>
      </div>

      {/* 2. شريط الفلاتر والبحث المتقدم */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          
          {/* فلتر المحافظة */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">المحافظة:</label>
            <select
              value={selectedGov}
              onChange={(e) => {
                setSelectedGov(e.target.value);
                setSelectedDistrict('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded-lg font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="all">كافة المحافظات</option>
              {SAMPLE_GOVERNORATES.map(gov => (
                <option key={gov.code} value={gov.code}>
                  محافظة {gov.name_ar}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر الإدارة */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">الإدارة الصحية:</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded-lg font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="all">كافة الإدارات</option>
              {availableDistricts.map(distName => (
                <option key={distName} value={distName}>
                  {distName}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر القسم التجميعي */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">القسم التجميعي:</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded-lg font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="all">كافة الأقسام الـ 12</option>
              {SECTIONS_DEFINITIONS.map(def => (
                <option key={def.code} value={def.code}>
                  {def.code}. {def.name_ar}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر حالة الاعتماد */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">حالة البيان:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 rounded-lg font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="all">كافة الحالات</option>
              <option value="APPROVED">معتمد فقط</option>
              <option value="SUBMITTED_LOCKED">مرفوع للمديرية</option>
              <option value="RETURNED">مُرتجع للتصحيح</option>
              <option value="DRAFT">مسودة</option>
            </select>
          </div>

          {/* البحث بالاسم */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">بحث بالاسم:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث عن إدارة أو محافظة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2 pr-7 rounded-lg font-medium focus:outline-none focus:border-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
          </div>

          {/* زر إعادة الضبط */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إلغاء التصفية</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. شريط ملخص نتائج التقرير */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-0.5">عدد السجلات المستخرجة</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            {reportRows.length.toLocaleString('en-US')} سجل
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-0.5">إجمالي المترددات بالتقرير</span>
          <span className="text-xl font-bold font-mono text-sky-700">
            {totals.attendees.toLocaleString('en-US')}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-0.5">المحولات لتنظيم الأسرة</span>
          <span className="text-xl font-bold font-mono text-indigo-700">
            {totals.referrals.toLocaleString('en-US')}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-400 block mb-0.5">متوسط معدل التحويل</span>
          <span className="text-xl font-bold font-mono text-emerald-700">
            {totals.avgConvRate}%
          </span>
        </div>
      </div>

      {/* 4. جدول التقرير التفصيلي المتوافق مع الإكسيل */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            جدول البيانات التفصيلي المستخرج
          </h3>
          <span className="text-xs text-slate-400">
            جاهز للتصدير والتنزيل الفوري
          </span>
        </div>

        <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px] sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="p-3 w-12 text-center">م</th>
                <th className="p-3">المحافظة</th>
                <th className="p-3">الإدارة الصحية</th>
                <th className="p-3">القسم التجميعي</th>
                <th className="p-3 text-center">المترددات (1)</th>
                <th className="p-3 text-center">المحولات (2)</th>
                <th className="p-3 text-center">LARC (3)</th>
                <th className="p-3 text-center">معدل التحويل</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3 text-center">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {reportRows.length > 0 ? (
                reportRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-2.5 text-center font-bold text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 font-medium text-slate-700">
                      {row.governorate}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">
                      {row.district}
                    </td>
                    <td className="p-2.5 font-medium text-slate-800">
                      <span className="font-mono text-slate-400 text-[10px] ml-1">({row.sectionCode})</span>
                      <span>{row.sectionName}</span>
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono">
                      {row.field1.toLocaleString('en-US')}
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono text-indigo-700">
                      {row.field2.toLocaleString('en-US')}
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono text-emerald-700">
                      {row.field3.toLocaleString('en-US')}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      {row.sectionCode !== 12 ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          row.convRate >= 40 ? 'bg-emerald-100 text-emerald-800' :
                          row.convRate > 0 ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {row.convRate}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">قسم لوالب</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        row.status === 'معتمد' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        row.status === 'مرفوع للمديرية' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        row.status === 'مُرتجع' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-500 text-[11px]">
                      {row.date}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد بيانات مطابقة لخيارات التصفية المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
