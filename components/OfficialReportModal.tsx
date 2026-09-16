'use client';

import React from 'react';
import Image from 'next/image';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SECTIONS_DEFINITIONS, MINISTRY_NAME, SECTOR_NAME, DEPARTMENT_NAME } from '@/lib/constants';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl print:border-none print:shadow-none print:max-h-none print:rounded-none print:bg-white print:text-black">
        
        {/* شريط الإجراءات العلوي (لا يظهر في الطباعة) */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">معاينة استمارة التقرير القومي الرسمي المعتمد</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-health-600/30 text-health-400 border border-health-600/40">
              وثيقة إحصائية سيادية
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-black bg-health-600 hover:bg-health-500 text-white flex items-center gap-2 transition shadow-lg shadow-health-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* وثيقة التقرير الرسمية (Print Ready) */}
        <div className="p-8 sm:p-10 overflow-y-auto font-arabic print:p-4 print:overflow-visible">
          
          {/* الترويسة الرسمية مع الشعار */}
          <div className="flex items-center justify-between border-b-2 border-slate-700 print:border-black pb-5 mb-6">
            <div className="space-y-1 text-right">
              <h2 className="text-base font-black tracking-wide text-white print:text-black">
                جمهورية مصر العربية
              </h2>
              <h3 className="text-sm font-extrabold text-health-500 print:text-black">
                {MINISTRY_NAME}
              </h3>
              <p className="text-xs text-slate-300 print:text-gray-700 font-semibold">
                {SECTOR_NAME} — {DEPARTMENT_NAME}
              </p>
              <p className="text-[11px] text-slate-400 print:text-gray-600 font-mono">
                المنظومة الرقمية لتجميع وتحليل بيانات تنمية الأسرة «مَسَار»
              </p>
            </div>

            {/* الشعار الرسمي لوزارة الصحة والسكان */}
            <div className="relative w-20 h-24 flex-shrink-0 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="شعار وزارة الصحة والسكان"
                width={80}
                height={96}
                className="object-contain"
                priority
              />
            </div>

            <div className="text-left space-y-1">
              <div className="text-xs text-slate-400 print:text-gray-700">كود الإدارة الصحية:</div>
              <div className="text-sm font-mono font-black text-white print:text-black">{submission.district_id}</div>
              <div className="text-xs text-slate-400 print:text-gray-700">تاريخ البيان:</div>
              <div className="text-sm font-mono font-bold text-white print:text-black">{submission.submission_date}</div>
            </div>
          </div>

          {/* عنوان الاستمارة الرسمي */}
          <div className="text-center my-4">
            <h1 className="text-lg sm:text-xl font-black text-white print:text-black underline underline-offset-8">
              بيان المتابعة اليومي التجميعي لمنافذ تنمية الأسرة وحصيلة وسائل (LARC)
            </h1>
            <div className="mt-2 text-xs font-bold text-health-400 print:text-gray-800">
              محافظة: <span className="underline">{submission.governorate_name_ar}</span> | الإدارة الصحية: <span className="underline">{submission.district_name_ar}</span>
            </div>
          </div>

          {/* جدول الأقسام الـ 12 المعتمد */}
          <div className="mt-6 border border-slate-700 print:border-black rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-slate-800 print:bg-gray-100 text-slate-200 print:text-black border-b border-slate-700 print:border-black font-bold">
                <tr>
                  <th className="p-2.5 border-l border-slate-700 print:border-black w-10 text-center">م</th>
                  <th className="p-2.5 border-l border-slate-700 print:border-black">القسم والبيان التجميعي</th>
                  <th className="p-2.5 border-l border-slate-700 print:border-black text-center">الحقل الأول</th>
                  <th className="p-2.5 border-l border-slate-700 print:border-black text-center">الحقل الثاني</th>
                  <th className="p-2.5 border-l border-slate-700 print:border-black text-center">الحقل الثالث</th>
                  <th className="p-2.5">ملاحظات التحقق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300 text-slate-200 print:text-black">
                {SECTIONS_DEFINITIONS.map((def) => {
                  const s = submission.sections[def.code];
                  return (
                    <tr key={def.code} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                      <td className="p-2.5 text-center font-mono font-bold border-l border-slate-700 print:border-black">
                        {def.code}
                      </td>
                      <td className="p-2.5 font-bold border-l border-slate-700 print:border-black">
                        <div>{def.name_ar}</div>
                        <div className="text-[10px] text-slate-400 print:text-gray-600 font-normal">
                          {def.field_1_label} / {def.field_2_label} / {def.field_3_label}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-mono font-black border-l border-slate-700 print:border-black">
                        {s?.field_1_value || 0}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black border-l border-slate-700 print:border-black">
                        {s?.field_2_value || 0}
                      </td>
                      <td className="p-2.5 text-center font-mono font-black border-l border-slate-700 print:border-black">
                        {s?.field_3_value || 0}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-400 print:text-gray-700">
                        {s?.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* مربع التوقيعات والاعتماد السيادي */}
          <div className="mt-8 pt-6 border-t-2 border-slate-700 print:border-black grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-10">
              <div className="font-bold text-slate-300 print:text-black">إعداد وتجميع الإدارة الصحية</div>
              <div className="border-b border-dotted border-slate-600 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-400 print:text-gray-700">منسق تنمية الأسرة بالإدارة</div>
            </div>

            <div className="space-y-10">
              <div className="font-bold text-slate-300 print:text-black">تدقيق مديرية الشئون الصحية</div>
              <div className="border-b border-dotted border-slate-600 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-400 print:text-gray-700">مدير إدارة تنظيم وتنمية الأسرة</div>
            </div>

            <div className="space-y-10">
              <div className="font-bold text-slate-300 print:text-black">الاعتماد النهائي — ديوان الوزارة</div>
              <div className="border-b border-dotted border-slate-600 print:border-black w-3/4 mx-auto"></div>
              <div className="text-[11px] text-slate-400 print:text-gray-700">رئيس قطاع الرعاية الصحية وتنمية الأسرة</div>
            </div>
          </div>

          {/* ختم إلكتروني وتوقيع رقمي */}
          <div className="mt-6 pt-4 border-t border-slate-800 print:border-gray-300 flex items-center justify-between text-[10px] text-slate-500 print:text-gray-600">
            <div>تم استخراج الوثيقة رقمياً عبر منظومة «مَسَار» الوطنية — المعرف الرقمي الموحد: {submission.id}</div>
            <div>حالة الاعتماد: {submission.directorate_status === 'APPROVED' ? 'معتمد رسمياً' : 'قيد المراجعة الإدارية'}</div>
          </div>

        </div>

      </div>
    </div>
  );
};
