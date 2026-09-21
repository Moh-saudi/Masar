'use client';

import React from 'react';
import {
  AlertTriangle,
  Headphones,
  Phone,
  RefreshCcw,
  ShieldCheck
} from 'lucide-react';

interface SystemErrorNoticeProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const SUPPORT_PHONE = '0101779958';

export function SystemErrorNotice({
  title = 'تعذر إتمام العملية',
  message = 'حدث خطأ غير متوقع أثناء تنفيذ الطلب. يمكنك المحاولة مرة أخرى، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
  onRetry,
  compact = false,
}: SystemErrorNoticeProps) {
  return (
    <div className={compact ? '' : 'min-h-[320px] flex items-center justify-center p-4'}>
      <div className={`w-full ${compact ? '' : 'max-w-xl'} rounded-2xl border border-[#eadfe2] bg-white overflow-hidden shadow-[0_16px_45px_rgba(23,32,51,0.08)]`}>
        <div className="h-1 bg-gradient-to-l from-[#087f78] via-[#56aaa5] to-[#18334f]" />

        <div className={compact ? 'p-4' : 'p-6 sm:p-7'}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-[#172033]">{title}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f4f7f9] border border-[#e1e7ed] text-[8px] font-extrabold text-slate-500">
                  <ShieldCheck className="w-3 h-3 text-[#087f78]" />
                  رسالة نظام
                </span>
              </div>

              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-6 mt-2">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-[#f7fafb] border border-[#e2e8ee] p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#eaf9f7] text-[#087f78] flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] font-extrabold text-[#172033]">الدعم الفني لمنظومة «مَسَار»</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">للمساعدة في تسجيل الدخول أو الأعطال الفنية</div>
                </div>
              </div>

              <a
                href={`tel:${SUPPORT_PHONE}`}
                className="h-9 px-3.5 rounded-xl bg-white border border-[#cdd8e2] text-[#172033] text-[10px] font-extrabold flex items-center justify-center gap-2 hover:border-[#087f78] hover:text-[#087f78] transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr" className="tabular-nums">{SUPPORT_PHONE}</span>
              </a>
            </div>
          </div>

          {onRetry && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onRetry}
                className="h-9 px-4 rounded-xl gov-btn-primary text-[10px] font-extrabold flex items-center gap-2"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                إعادة المحاولة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
