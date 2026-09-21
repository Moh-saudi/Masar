'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  tone = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  if (!open) return null;

  const toneClasses = {
    primary: {
      iconWrap: 'bg-[#eaf9f7] border-[#ccebe7] text-[#087f78]',
      button: 'bg-[#087f78] hover:bg-[#066963] text-white border-[#087f78]',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    success: {
      iconWrap: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      button: 'bg-[#147d64] hover:bg-[#0f6d57] text-white border-[#147d64]',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    warning: {
      iconWrap: 'bg-amber-50 border-amber-200 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    danger: {
      iconWrap: 'bg-rose-50 border-rose-200 text-rose-600',
      button: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  }[tone];

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-[#dfe6ee] rounded-2xl shadow-[0_20px_60px_rgba(23,32,51,0.16)] overflow-hidden">
        <div className="h-1 bg-gradient-to-l from-[#087f78] via-[#56aaa5] to-[#18334f]" />

        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${toneClasses.iconWrap}`}>
              {toneClasses.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-[#172033]">{title}</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-6 mt-2">{message}</p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-10 px-4 rounded-xl gov-btn-secondary text-[10px] font-extrabold disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`h-10 px-5 rounded-xl border text-[10px] font-extrabold transition disabled:opacity-50 ${toneClasses.button}`}
            >
              {loading ? 'جاري التنفيذ...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
