'use client';

import React from 'react';
import Image from 'next/image';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SECTIONS_DEFINITIONS, MINISTRY_NAME, SECTOR_NAME, DEPARTMENT_NAME } from '@/lib/constants';
import { Printer, X, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { exportToStyledExcel } from '@/lib/excel-export';

interface OfficialReportModalProps {
  submission: DailySubmission;
  user: UserProfile;
  onClose: () => void;
}

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  submission,
  user,
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
      { header: 'م', key: 'code', width: 40 },
      { header: 'القسم ومجال الخدمة', key: 'name_ar', width: 200 },
      { header: 'الحقل الأول', key: 'field_1', width: 110 },
      { header: 'الحقل الثاني', key: 'field_2', width: 110 },
      { header: 'الحقل الثالث (LARC)', key: 'field_3', width: 130 },
      { header: 'ملاحظات التحقق', key: 'notes', width: 160 },
    ];

    const data = SECTIONS_DEFINITIONS.map(def => {
      const s = submission.sections[def.code];
      return {
        code: def.code,
        name_ar: `${def.name_ar} (${def.field_1_label} / ${def.field_2_label} / ${def.field_3_label})`,
        field_1: s?.field_1_value || 0,
        field_2: s?.field_2_value || 0,
        field_3: s?.field_3_value || 0,
        notes: s?.notes || '—',
      };
    });

    exportToStyledExcel(
      `استمارة_متابعة_${submission.district_name_ar}_${submission.submission_date}`,
      'استمارة المتابعة اليومية التجميعية لمنافذ تنمية الأسرة وحصيلة وسائل (LARC)',
      columns,
      data,
      {
        subtitle: `محافظة: ${submission.governorate_name_ar} • الإدارة الصحية: ${submission.district_name_ar} • تاريخ البيان: ${submission.submission_date}`,
        governorateName: submission.governorate_name_ar,
        districtName: submission.district_name_ar,
        showSignatures: true,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl print:border-none print:shadow-none print:max-h-none print:rounded-none print:bg-white print:text-black">
        
        {/* شريط الإجراءات العلوي (لا يظهر في الطباعة) */}
        <div className="px-6 py-4 bg-gradient-to-r from-white via-white to-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-extrabold text-[#172033]">معاينة استمارة التقرير القومي الرسمي المعتمد (مقاس A4)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-[#087f78] border border-teal-200/60 font-bold">
              وثيقة إحصائية رسمية
            </span>
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
              <span>طباعة الاستمارة (A4 PDF)</span>
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

        {/* وثيقة التقرير الرسمية (Print Ready A4) */}
        <div className="p-8 sm:p-10 overflow-y-auto font-arabic bg-white print:p-6 print:overflow-visible text-slate-900 print:text-black">
          
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
            }
          ` }} />

          {/* الترويسة الرسمية مع الشعار */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-5">
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

            {/* الشعار الرسمي لوزارة الصحة والسكان بدقة عالية */}
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

            <div className="text-left space-y-1 text-xs">
              <div className="text-[10px] text-slate-500">كود الإدارة الصحية:</div>
              <div className="text-sm font-mono font-black text-slate-900 print:text-black">{submission.district_id}</div>
              <div className="text-[10px] text-slate-500">تاريخ البيان:</div>
              <div className="text-sm font-mono font-bold text-slate-900 print:text-black">{submission.submission_date}</div>
              <div className="text-[10px] text-slate-500">توقيت استخراج الاستمارة:</div>
              <div className="text-[11px] font-mono font-bold text-slate-700">{datePrintedFormatted} ({timePrintedFormatted})</div>
            </div>
          </div>

          {/* عنوان الاستمارة الرسمي */}
          <div className="text-center my-3 pb-2 border-b border-slate-200">
            <h1 className="text-base sm:text-lg font-black text-slate-900 print:text-black underline underline-offset-6">
              استمارة المتابعة اليومية التجميعية لمنافذ تنمية الأسرة وحصيلة وسائل (LARC)
            </h1>
            <div className="mt-1.5 text-xs font-bold text-[#087f78] print:text-gray-900 flex items-center justify-center gap-3">
              <span>محافظة: <strong className="underline text-slate-900">{submission.governorate_name_ar}</strong></span>
              <span>•</span>
              <span>الإدارة الصحية: <strong className="underline text-slate-900">{submission.district_name_ar}</strong></span>
              <span>•</span>
              <span>كود الإدارة: <strong className="font-mono text-slate-900">{submission.district_id}</strong></span>
            </div>
          </div>

          {/* جدول الأقسام الـ 12 المعتمد */}
          <div className="mt-4 border border-slate-300 print:border-black rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-slate-100 print:bg-gray-100 text-slate-900 print:text-black border-b border-slate-300 print:border-black font-black text-[11px]">
                <tr>
                  <th className="p-2 border-l border-slate-300 print:border-black w-10 text-center">م</th>
                  <th className="p-2 border-l border-slate-300 print:border-black">القسم والبيان التجميعي</th>
                  <th className="p-2 border-l border-slate-300 print:border-black text-center w-28">الحقل الأول</th>
                  <th className="p-2 border-l border-slate-300 print:border-black text-center w-28">الحقل الثاني</th>
                  <th className="p-2 border-l border-slate-300 print:border-black text-center w-28">الحقل الثالث (LARC)</th>
                  <th className="p-2">ملاحظات التحقق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black text-[11px] text-slate-900 print:text-black">
                {SECTIONS_DEFINITIONS.map((def) => {
                  const s = submission.sections[def.code];
                  return (
                    <tr key={def.code} className="hover:bg-slate-50/60 print:hover:bg-transparent">
                      <td className="p-2 text-center font-mono font-bold border-l border-slate-300 print:border-black">
                        {def.code}
                      </td>
                      <td className="p-2 font-bold border-l border-slate-300 print:border-black">
                        <div>{def.name_ar}</div>
                        <div className="text-[10px] text-slate-500 print:text-gray-600 font-normal">
                          {def.field_1_label} / {def.field_2_label} / {def.field_3_label}
                        </div>
                      </td>
                      <td className="p-2 text-center font-mono font-black border-l border-slate-300 print:border-black text-slate-900">
                        {s?.field_1_value || 0}
                      </td>
                      <td className="p-2 text-center font-mono font-black border-l border-slate-300 print:border-black text-slate-900">
                        {s?.field_2_value || 0}
                      </td>
                      <td className="p-2 text-center font-mono font-black border-l border-slate-300 print:border-black text-slate-900">
                        {s?.field_3_value || 0}
                      </td>
                      <td className="p-2 text-[10px] text-slate-600 print:text-gray-700">
                        {s?.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* مربع التوقيعات والاعتماد الرسمي وختم الشعار */}
          <div className="mt-8 pt-5 border-t-2 border-slate-900 grid grid-cols-4 gap-4 text-center text-xs">
            <div className="space-y-12">
              <div className="font-extrabold text-slate-900 print:text-black">إعداد وتجميع الإدارة الصحية</div>
              <div className="border-b border-dotted border-slate-400 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-600 font-semibold">منسق تنمية الأسرة بالإدارة</div>
            </div>

            <div className="space-y-12">
              <div className="font-extrabold text-slate-900 print:text-black">تدقيق مديرية الشئون الصحية</div>
              <div className="border-b border-dotted border-slate-400 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-600 font-semibold">مدير إدارة تنظيم وتنمية الأسرة</div>
            </div>

            <div className="space-y-12">
              <div className="font-extrabold text-slate-900 print:text-black">الاعتماد النهائي — ديوان الوزارة</div>
              <div className="border-b border-dotted border-slate-400 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-600 font-semibold">رئيس قطاع الرعاية الصحية وتنمية الأسرة</div>
            </div>

            {/* إطار خاتم شعار الجمهورية */}
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-dashed border-slate-400 print:border-black h-28 my-auto">
              <span className="text-[10px] text-slate-500 font-bold">
                (مكان خاتم شعار الجمهورية)
              </span>
              <span className="text-[8px] text-slate-400 mt-1 font-mono">
                خاتم الشعار الرسمي المعتمد
              </span>
            </div>
          </div>

          {/* ختم إلكتروني وتوقيع رقمي وحقوق الملكية 2026 */}
          <div className="mt-6 pt-3 border-t border-slate-300 print:border-gray-400 flex items-center justify-between text-[10px] text-slate-500 print:text-gray-700">
            <div>
              وثيقة إحصائية رسمية صادرة آلياً عبر منظومة «مَسَار» — المعرف الرقمي: {submission.id}
            </div>
            <div>
              حالة الاعتماد: <strong>{submission.directorate_status === 'APPROVED' ? 'معتمد رسمياً ✓' : 'قيد المراجعة الإدارية'}</strong>
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
