'use client';

import React from 'react';
import { TimeLockState } from '@/lib/types';
import { Clock, Lock, Unlock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TimeLockBarProps {
  timeLock: TimeLockState;
  simulatedTime: string | null;
  onOpenSimModal: () => void;
  onRequestOverride?: () => void;
  canRequestOverride?: boolean;
}

export const TimeLockBar: React.FC<TimeLockBarProps> = ({
  timeLock,
  simulatedTime,
  onOpenSimModal,
  onRequestOverride,
  canRequestOverride = false,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 text-xs py-2 px-4 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* معلومات الوقت والحالة بشكل هادئ وسلس */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>توقيت النظام:</span>
            <span className="font-mono font-bold text-slate-900 text-[13px] tabular-nums">
              {timeLock.current_time_str}
            </span>
            {simulatedTime && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                محاكاة
              </span>
            )}
          </div>

          <span className="text-slate-300">|</span>

          {/* حالة نافذة الإدخال للإدارة */}
          <div className="flex items-center gap-1.5">
            {timeLock.is_district_locked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3 text-rose-600" />
                <span>نافذة الإدخال: مقفلة (03:00 م)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Unlock className="w-3 h-3 text-emerald-600" />
                <span>نافذة الإدخال: مفتوحة حتى 03:00 م</span>
              </span>
            )}

            {timeLock.has_active_override && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                <ShieldCheck className="w-3 h-3" />
                <span>فتح استثنائي مؤقت: متبقي {timeLock.override_minutes_remaining} دقيقة</span>
              </span>
            )}
          </div>
        </div>

        {/* زر طلب الفتح وزر تغيير وقت التجربة */}
        <div className="flex items-center gap-3">
          {timeLock.is_district_locked && !timeLock.has_active_override && canRequestOverride && (
            <button
              onClick={onRequestOverride}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-md transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>طلب فتح استثنائي للجهة الأم</span>
            </button>
          )}

          <button
            onClick={onOpenSimModal}
            className="text-[11px] text-slate-500 hover:text-sky-700 underline font-medium transition"
          >
            تغيير التوقيت للتجربة
          </button>
        </div>

      </div>
    </div>
  );
};
