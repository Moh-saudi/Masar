'use client';

import React, { useState } from 'react';
import {
  Headphones,
  Phone,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  X,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const SUPPORT_PHONE = '0101779958';
export const SUPPORT_HOURS = 'يومياً من 8:00 صباحاً حتى 8:00 مساءً';

interface TechnicalSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextMessage?: string;
}

export const TechnicalSupportModal: React.FC<TechnicalSupportModalProps> = ({
  isOpen,
  onClose,
  contextMessage,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(SUPPORT_PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#dfe6ee] rounded-2xl max-w-md w-full overflow-hidden shadow-[0_20px_60px_rgba(23,32,51,0.16)] flex flex-col">
        {/* Top Sovereign Teal Line */}
        <div className="h-1.5 bg-gradient-to-l from-[#087f78] via-[#56aaa5] to-[#18334f]" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-white to-[#fbfcfd]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eaf9f7] border border-[#ccebe7] text-[#087f78] flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#172033]">
                الدعم الفني لمنظومة «مَسَار»
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                وزارة الصحة والسكان — قطاع الرعاية وتنمية الأسرة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {contextMessage && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed font-medium">
                {contextMessage}
              </p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#087f78]" />
                رقم التواصل المباشر
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#eaf9f7] text-[#087f78] border border-[#bfebe5]">
                معتمد
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
              <span dir="ltr" className="text-lg font-black text-[#172033] tracking-wider font-mono">
                {SUPPORT_PHONE}
              </span>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1.5 transition active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الرقم'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#087f78] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-[#172033]">أوقات العمل الرسمية</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{SUPPORT_HOURS}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#087f78] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-[#172033]">نطاق الدعم</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">الحسابات، الصلاحيات، والأعطال</div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#eef8f7] border border-[#c4ebe6] flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-[#087f78] flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed">
              عند حدوث مشكلة في الدخول، يرجى تجهيز <strong>اسم المستخدم</strong> أو <strong>الرقم القومي</strong> و<strong>اسم الإدارة أو المديرية</strong> لتسريع وتسهيل المساعدة من فريق الدعم الفني.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="flex-1 h-10 rounded-xl bg-[#087f78] hover:bg-[#066963] text-white text-[11px] font-extrabold flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال مباشر الآن</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl gov-btn-secondary text-[11px] font-extrabold"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
