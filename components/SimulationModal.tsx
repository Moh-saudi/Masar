'use client';

import React from 'react';
import { SlidersHorizontal, X, RefreshCw, Zap, Check } from 'lucide-react';

interface SimulationModalProps {
  simulatedTime: string | null;
  onSetSimulatedTime: (timeStr: string | null) => void;
  onClose: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  simulatedTime,
  onSetSimulatedTime,
  onClose,
}) => {
  const options = [
    {
      time: null,
      label: 'الوقت الفعلي للجهاز (Real-time)',
      desc: 'الاعتماد على ساعة الكمبيوتر الفعلية للتشغيل الطبيعي',
    },
    {
      time: '11:30',
      label: '11:30 صباحاً (نافذة الإدخال مفتوحة)',
      desc: 'قبل إغلاق الإدارة الصحية، يسمح بالحفظ وتعديل الأقسام بحرية',
    },
    {
      time: '15:15',
      label: '03:15 عصراً (إغلاق الإدارة التلقائي)',
      desc: 'تطبيق قيد الجهة الأم وقفل البيان، واختبار طلب الفتح الاستثنائي',
    },
    {
      time: '17:00',
      label: '05:00 مساءً (نافذة فحص المديرية)',
      desc: 'تتيح لمديرية الشئون الصحية فحص واعتماد أو إرجاع البيانات أو الفتح المؤقت',
    },
    {
      time: '22:30',
      label: '10:30 مساءً (الإغلاق القومي النهائي)',
      desc: 'انتهاء اليوم الإحصائي وتثبيت التقارير لديوان عام الوزارة',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95">
        
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">محاكاة مواعيد الحوكمة الزمنية</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-xs text-slate-500 mb-3">
            اختر توقيت المحاكاة لاختبار سلوك المنظومة وقواعد الإغلاق والفتح الاستثنائي:
          </p>

          <div className="space-y-2">
            {options.map((opt, idx) => {
              const isSelected = opt.time === simulatedTime;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    onSetSimulatedTime(opt.time);
                    onClose();
                  }}
                  className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold ring-1 ring-sky-500'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">
                      {opt.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
