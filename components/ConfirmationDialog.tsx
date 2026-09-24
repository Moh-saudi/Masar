'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !mounted) return null;

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
      iconWrap: 'bg-amber-50 border-amber-200 text-amber-700',
      button: 'bg-[#172033] hover:bg-[#0f172a] text-white border-[#172033]',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    danger: {
      iconWrap: 'bg-rose-50 border-rose-200 text-rose-600',
      button: 'bg-rose-700 hover:bg-rose-800 text-white border-rose-700',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  }[tone];

  const dialog = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-[3px] flex items-center justify-center p-4 animate-in fade-in duration-150 font-arabic"
    >
      <div
        className="w-full max-w-lg bg-white border border-[#dfe6ee] rounded-2xl shadow-[0_24px_70px_rgba(23,32,51,0.22)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-l from-[#087f78] via-[#56aaa5] to-[#18334f]" />

        <div className="p-6">
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${toneClasses.iconWrap}`}>
              {toneClasses.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-[#172033]">{title}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-2 whitespace-pre-line">{message}</p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`h-10 px-5 rounded-xl border text-xs font-extrabold transition disabled:opacity-50 shadow-xs active:scale-[0.98] ${toneClasses.button}`}
            >
              {loading ? 'جاري التنفيذ...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
