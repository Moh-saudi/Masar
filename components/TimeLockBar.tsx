'use client';

import React from 'react';
import { TimeLockState } from '@/lib/types';
import { Clock3, LockKeyhole, UnlockKeyhole, ShieldCheck } from 'lucide-react';

interface TimeLockBarProps {
  timeLock: TimeLockState;
  simulatedTime: string | null;
  onOpenSimModal: () => void;
  onRequestOverride?: () => void;
  canRequestOverride?: boolean;
}

export const TimeLockBar: React.FC<TimeLockBarProps> = ({
  timeLock,
  onRequestOverride,
  canRequestOverride = false,
}) => {
  const locked = timeLock.is_district_locked && !timeLock.has_active_override;

  return (
    <div className="bg-white/90 border-b border-[#e2e8ef]">
      <div className="gov-shell px-4 sm:px-6 lg:px-8">
        <div className="min-h-[42px] py-2 flex flex-wrap items-center justify-between gap-2 text-[10px]">

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock3 className="w-3.5 h-3.5 text-[#087f78]" />
              <span className="font-bold">توقيت المنظومة</span>
              <span className="text-[12px] font-extrabold text-[#172033] tabular-nums">
                {timeLock.current_time_str}
              </span>
            </div>

            <span className="hidden sm:block w-px h-4 bg-slate-200" />

            <div
              className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold \${
                locked
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-[#eef9f6] text-[#147d64] border-[#cfece3]'
              }\`}
            >
              {locked
                ? <LockKeyhole className="w-3.5 h-3.5" />
                : <UnlockKeyhole className="w-3.5 h-3.5" />}
              <span>
                {locked
                  ? 'انتهت نافذة الإدخال'
                  : \`الإدخال متاح حتى \${timeLock.district_deadline}\`}
              </span>
            </div>

            {timeLock.has_active_override && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>فتح استثنائي</span>
                <span className="tabular-nums">{timeLock.override_minutes_remaining} دقيقة</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>
              مراجعة المديرية حتى <strong className="text-slate-700 tabular-nums">{timeLock.directorate_deadline}</strong>
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline">
              الاعتماد المركزي حتى <strong className="text-slate-700 tabular-nums">{timeLock.ministry_deadline}</strong>
            </span>

            {locked && canRequestOverride && onRequestOverride && (
              <button
                onClick={onRequestOverride}
                className="h-7 px-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 font-extrabold hover:bg-amber-100 transition"
              >
                طلب فتح
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
