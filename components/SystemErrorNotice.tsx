'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Headphones,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Copy,
  Check,
  Clock,
  Home
} from 'lucide-react';
import { SUPPORT_PHONE, SUPPORT_HOURS } from './TechnicalSupportModal';

export { SUPPORT_PHONE, SUPPORT_HOURS };

interface SystemErrorNoticeProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  showBackToLogin?: boolean;
}

export function SystemErrorNotice({
  title = 'تعذر إتمام العملية',
  message = 'حدث خطأ غير متوقع أثناء تنفيذ الطلب. يمكنك المحاولة مرة أخرى، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
  onRetry,
  compact = false,
  showBackToLogin = false,
}: SystemErrorNoticeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(SUPPORT_PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={compact ? '' : 'min-h-[320px] flex items-center justify-center p-4'}>
      <div className={`w-full ${compact ? '' : 'max-w-xl'} rounded-2xl border border-[#dfe6ee] bg-white overflow-hidden shadow-[0_16px_45px_rgba(23,32,51,0.08)]`}>
        {/* Top Sovereign Line */}
        <div className="h-1.5 bg-gradient-to-l from-[#087f78] via-[#56aaa5] to-[#18334f]" />

        <div className={compact ? 'p-4' : 'p-6 sm:p-7'}>
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-[#172033]">{title}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f4f7f9] border border-[#e1e7ed] text-[9px] font-extrabold text-slate-500">
                  <ShieldCheck className="w-3 h-3 text-[#087f78]" />
                  إشعار نظام
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-2">
                {message}
              </p>
            </div>
          </div>

          {/* Unified Tech Support Section */}
          <div className="mt-5 rounded-xl bg-[#f8fafc] border border-slate-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#eaf9f7] text-[#087f78] flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold text-[#172033]">الدعم الفني لمنظومة «مَسَار»</div>
                  <div className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-[#087f78]" />
                    <span>{SUPPORT_HOURS}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="h-8 px-3 rounded-lg bg-[#087f78] text-white text-[10px] font-extrabold flex items-center gap-1.5 hover:bg-[#066963] transition"
                >
                  <Phone className="w-3 h-3" />
                  <span dir="ltr" className="tabular-nums font-mono">{SUPPORT_PHONE}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 transition"
                  title="نسخ رقم الدعم الفني"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(onRetry || showBackToLogin) && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              {showBackToLogin && (
                <Link
                  href="/"
                  className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-extrabold flex items-center gap-1.5 transition"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>العودة للرئيسية</span>
                </Link>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="h-9 px-4 rounded-xl bg-[#087f78] hover:bg-[#066963] text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-[0.98]"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
