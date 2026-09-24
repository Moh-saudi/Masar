'use client';

import React from 'react';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';
import { MINISTRY_NAME, SECTOR_NAME, DEPARTMENT_NAME } from '@/lib/constants';
import { Printer, X, Download, ShieldCheck, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { exportToStyledExcel } from '@/lib/excel-export';

export interface RegisterRowItem {
  districtId: string;
  districtNameAr: string;
  districtCode: string;
  governorateNameAr: string;
  statusLabelAr: string;
  completionPercentage: number;
  completedSectionsCount: number;
  totalSectionsCount: number;
  submittedAtFormatted: string;
  notes?: string;
}

export interface OfficialRegisterReportModalProps {
  title?: string;
  subtitle?: string;
  dateStr: string;
  governorateFilterName?: string;
  rows: RegisterRowItem[];
  kpis: {
    totalExpected: number;
    completedCount: number;
    inProgressCount: number;
    lateCount: number;
    overrideCount: number;
    completionRate: number;
  };
  currentUser: UserProfile;
  onClose: () => void;
}

export const OfficialRegisterReportModal: React.FC<OfficialRegisterReportModalProps> = ({
  title = 'سجل المتابعة اليومي لرصد ومطابقة تسجيل إدارات تنمية الأسرة (LARC)',
  subtitle,
  dateStr,
  governorateFilterName,
  rows,
  kpis,
  currentUser,
  onClose,
}) => {
  const currentDate = new Date();
  const datePrintedFormatted = currentDate.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timePrintedFormatted = currentDate.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const columns = [
      { header: 'م', key: 'index', width: 40 },
      { header: 'كود الإدارة', key: 'districtCode', width: 90 },
      { header: 'اسم الإدارة الصحية', key: 'districtNameAr', width: 180 },
      { header: 'المحافظة', key: 'governorateNameAr', width: 120 },
      { header: 'موقف التسجيل لليوم', key: 'statusLabelAr', width: 140 },
      { header: 'نسبة الإنجاز', key: 'completionRateStr', width: 90 },
      { header: 'الأقسام المكتملة', key: 'sectionsStr', width: 100 },
      { header: 'توقيت التسجيل والاعتماد', key: 'submittedAtFormatted', width: 140 },
    ];

    const data = rows.map((r, idx) => ({
      ...r,
      index: idx + 1,
      completionRateStr: `${r.completionPercentage}%`,
      sectionsStr: `${r.completedSectionsCount} من ${r.totalSectionsCount}`,
    }));

    exportToStyledExcel(
      `سجل_متابعة_مسار_${dateStr}`,
      title,
      columns,
      data,
      {
        subtitle: subtitle || `بيان تاريخ: ${dateStr} • النطاق الجغرافي: ${governorateFilterName || 'كافة محافظات الجمهورية'}`,
        governorateName: governorateFilterName || 'كافة محافظات الجمهورية',
        kpis: [
          { label: 'الإدارات المتوقعة', value: kpis.totalExpected },
          { label: 'المكتملة والمعتمدة', value: kpis.completedCount },
          { label: 'جاري الإدخال (مسودات)', value: kpis.inProgressCount },
          { label: 'المتأخرة عن الإغلاق', value: kpis.lateCount },
          { label: 'نسبة الإنجاز القومي', value: `${kpis.completionRate}%` },
        ],
        showSignatures: true,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl print:border-none print:shadow-none print:max-h-none print:rounded-none print:bg-white print:text-black">
        
        {/* شريط الإجراءات العلوي (يختفي في الطباعة) */}
        <div className="px-6 py-4 bg-gradient-to-r from-white via-white to-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-50 text-[#087f78] border border-teal-200">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <div>
              <span className="text-sm font-extrabold text-[#172033]">
                معاينة السجل الرسمي للطباعة والتصدير (مقاس A4 معتمد)
              </span>
              <span className="text-[10px] text-slate-500 block">
                مجهز بالترويسة الرسمية، شعار الوزارة، والتوقيعات الرسمية
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#087f78]" />
              <span>تصدير Excel منسق</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#087f78] hover:bg-[#066560] text-white flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السجل (A4 PDF)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= وثيقة السجل الرسمية (A4 Print Ready) ================= */}
        <div className="p-8 sm:p-10 overflow-y-auto font-arabic bg-white print:p-6 print:overflow-visible text-slate-900 print:text-black">
          
          {/* CSS لضبط مقاس الطباعة A4 بدقة متناهية */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm 12mm 12mm 12mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .page-break {
                page-break-after: always;
              }
            }
          ` }} />

          {/* 1. الترويسة الرسمية مع الشعار */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-5">
            
            {/* الجانب الأيمن: الوزارة والقطاع */}
            <div className="space-y-1 text-right">
              <h2 className="text-sm font-black tracking-wide text-slate-900 print:text-black">
                جمهورية مصر العربية
              </h2>
              <h3 className="text-base font-black text-[#087f78] print:text-black">
                {MINISTRY_NAME}
              </h3>
              <p className="text-xs text-slate-700 font-bold">
                {SECTOR_NAME}
              </p>
              <p className="text-xs text-slate-600 font-semibold">
                {DEPARTMENT_NAME}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                المنظومة الرقمية القومية لتنمية الأسرة «مَسَار»
              </p>
            </div>

            {/* الوسط: شعار وزارة الصحة والسكان بدقة عالية */}
            <div className="flex flex-col items-center justify-center px-4">
              <div className="relative w-20 h-24 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="شعار وزارة الصحة والسكان"
                  fill
                  sizes="80px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-[9px] font-black text-slate-700 mt-1">
                جمهورية مصر العربية
              </span>
            </div>

            {/* الجانب الأيسر: بيانات التوثيق والكود الرقمي */}
            <div className="text-left space-y-1 text-xs">
              <div className="text-[10px] text-slate-500">تاريخ بيان الحصر:</div>
              <div className="text-sm font-mono font-black text-slate-900 print:text-black">{dateStr}</div>
              <div className="text-[10px] text-slate-500">تاريخ وساعة الطباعة:</div>
              <div className="text-xs font-mono font-bold text-slate-700">{datePrintedFormatted} ({timePrintedFormatted})</div>
              <div className="text-[10px] text-slate-500">الرقم المرجعي الموحد:</div>
              <div className="text-xs font-mono font-black text-[#087f78] print:text-black">
                MOH-PDR-{dateStr.replace(/-/g, '')}-{rows.length}
              </div>
            </div>

          </div>

          {/* 2. عنوان التقرير والنطاق الإداري */}
          <div className="text-center my-3 pb-2 border-b border-slate-200">
            <h1 className="text-base sm:text-lg font-black text-slate-900 print:text-black underline underline-offset-6">
              {title}
            </h1>
            <div className="mt-1.5 text-xs font-bold text-[#087f78] print:text-gray-900 flex items-center justify-center gap-3">
              <span>تاريخ الحصر: <strong className="font-mono text-slate-900">{dateStr}</strong></span>
              <span>•</span>
              <span>النطاق الجغرافي: <strong className="text-slate-900">{governorateFilterName || 'كافة محافظات الجمهورية (27 محافظة)'}</strong></span>
              <span>•</span>
              <span>عدد الإدارات المدرجة: <strong className="font-mono text-slate-900">{rows.length}</strong> إدارة</span>
            </div>
          </div>

          {/* 3. بطاقات ملخص المؤشرات الرسمية (KPIs Summary) */}
          <div className="my-4 p-3 rounded-2xl border border-slate-300 print:border-black bg-slate-50 print:bg-transparent grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 bg-white print:bg-transparent rounded-xl border border-slate-200 print:border-black">
              <div className="text-[10px] font-bold text-slate-600">إجمالي الإدارات</div>
              <div className="text-base font-black text-slate-900 font-mono">{kpis.totalExpected}</div>
            </div>
            <div className="p-2 bg-white print:bg-transparent rounded-xl border border-slate-200 print:border-black">
              <div className="text-[10px] font-bold text-emerald-800">مكتمل ومعتمد</div>
              <div className="text-base font-black text-emerald-800 font-mono">{kpis.completedCount}</div>
            </div>
            <div className="p-2 bg-white print:bg-transparent rounded-xl border border-slate-200 print:border-black">
              <div className="text-[10px] font-bold text-amber-800">جاري الإدخال</div>
              <div className="text-base font-black text-amber-800 font-mono">{kpis.inProgressCount}</div>
            </div>
            <div className="p-2 bg-white print:bg-transparent rounded-xl border border-slate-200 print:border-black">
              <div className="text-[10px] font-bold text-rose-800">متأخر عن الإغلاق</div>
              <div className="text-base font-black text-rose-800 font-mono">{kpis.lateCount}</div>
            </div>
            <div className="p-2 bg-white print:bg-transparent rounded-xl border border-slate-200 print:border-black">
              <div className="text-[10px] font-bold text-[#087f78] print:text-black">نسبة الإنجاز</div>
              <div className="text-base font-black text-[#087f78] print:text-black font-mono">{kpis.completionRate}%</div>
            </div>
          </div>

          {/* 4. جدول كشف الإدارات التفصيلي */}
          <div className="mt-4 border border-slate-300 print:border-black rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-slate-100 print:bg-gray-100 text-slate-900 print:text-black border-b border-slate-300 print:border-black font-black text-[11px]">
                <tr>
                  <th className="p-2 border-l border-slate-300 print:border-black w-10 text-center">م</th>
                  <th className="p-2 border-l border-slate-300 print:border-black w-24 text-center">كود الإدارة</th>
                  <th className="p-2 border-l border-slate-300 print:border-black">اسم الإدارة الصحية</th>
                  <th className="p-2 border-l border-slate-300 print:border-black">المحافظة</th>
                  <th className="p-2 border-l border-slate-300 print:border-black text-center">موقف التسجيل</th>
                  <th className="p-2 border-l border-slate-300 print:border-black text-center">نسبة الإنجاز</th>
                  <th className="p-2 border-l border-slate-300 print:border-black text-center">الأقسام</th>
                  <th className="p-2 text-center">توقيت التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black text-[11px] text-slate-900 print:text-black">
                {rows.map((row, idx) => (
                  <tr key={row.districtId} className="hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="p-1.5 text-center font-mono font-bold border-l border-slate-300 print:border-black">
                      {idx + 1}
                    </td>
                    <td className="p-1.5 text-center font-mono font-bold border-l border-slate-300 print:border-black text-slate-700">
                      {row.districtCode}
                    </td>
                    <td className="p-1.5 font-bold border-l border-slate-300 print:border-black">
                      {row.districtNameAr}
                    </td>
                    <td className="p-1.5 border-l border-slate-300 print:border-black">
                      {row.governorateNameAr}
                    </td>
                    <td className="p-1.5 text-center font-bold border-l border-slate-300 print:border-black">
                      {row.statusLabelAr}
                    </td>
                    <td className="p-1.5 text-center font-mono font-bold border-l border-slate-300 print:border-black">
                      {row.completionPercentage}%
                    </td>
                    <td className="p-1.5 text-center font-mono border-l border-slate-300 print:border-black">
                      {row.completedSectionsCount}/{row.totalSectionsCount}
                    </td>
                    <td className="p-1.5 text-center font-mono text-[10px]">
                      {row.submittedAtFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. مربع التوقيعات الرسمية المعتمدة وختم الشعار (Official Signatures & Stamp Box) */}
          <div className="mt-8 pt-5 border-t-2 border-slate-900 grid grid-cols-4 gap-4 text-center text-xs">
            
            <div className="space-y-12">
              <div className="font-extrabold text-slate-900 print:text-black">إعداد وتجميع البيانات</div>
              <div className="border-b border-dotted border-slate-400 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-600 font-semibold">منسق تنمية الأسرة / مدخل البيانات</div>
            </div>

            <div className="space-y-12">
              <div className="font-extrabold text-slate-900 print:text-black">مراجعة وتدقيق الإحصاء</div>
              <div className="border-b border-dotted border-slate-400 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-600 font-semibold">مدير إدارة الإحصاء والتحول الرقمي</div>
            </div>

            <div className="space-y-12">
              <div className="font-extrabold text-slate-900 print:text-black">الاعتماد الرسمي</div>
              <div className="border-b border-dotted border-slate-400 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-600 font-semibold">رئيس الإدارة المركزية / رئيس القطاع</div>
            </div>

            {/* إطار خاتم شعار الجمهورية (Seal of the Republic) */}
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-dashed border-slate-400 print:border-black h-28 my-auto">
              <span className="text-[10px] text-slate-500 font-bold">
                (مكان خاتم شعار الجمهورية)
              </span>
              <span className="text-[8px] text-slate-400 mt-1 font-mono">
                خاتم الشعار الرسمي المعتمد
              </span>
            </div>

          </div>

          {/* 6. الشريط الأمني وتذييل حقوق الوثيقة الرسمية */}
          <div className="mt-6 pt-3 border-t border-slate-300 print:border-gray-400 flex items-center justify-between text-[10px] text-slate-500 print:text-gray-700">
            <div>
              وثيقة إحصائية رسمية صادرة آلياً عبر منظومة «مَسَار» — المعرف الرقمي: MOH-PDR-{dateStr}
            </div>
            <div>
              طبعت بواسطة: <strong>{currentUser.full_name}</strong> ({currentUser.role_title_ar})
            </div>
            <div>
              جميع الحقوق محفوظة © 2026 — وزارة الصحة والسكان المصرية
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
