'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { SystemErrorNotice } from './SystemErrorNotice';

interface OperationFeedbackDialogProps {
  open: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function OperationFeedbackDialog({
  open,
  type,
  title,
  message,
  onClose,
  onRetry,
}: OperationFeedbackDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 z-10 w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {type === 'error' ? (
          <SystemErrorNotice
            title={title}
            message={message}
            onRetry={onRetry}
          />
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-[0_16px_45px_rgba(23,32,51,0.10)]">
            <div className="h-1 bg-gradient-to-l from-[#087f78] to-[#147d64]" />
            <div className="p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#172033]">{title}</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-6 mt-2">{message}</p>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 rounded-xl gov-btn-primary text-[10px] font-extrabold"
                >
                  حسناً
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
