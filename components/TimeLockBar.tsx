'use client';

import React from 'react';
import { TimeLockState, UserRole } from '@/lib/types';
import { BellRing, Clock3, LockKeyhole, UnlockKeyhole, ShieldCheck } from 'lucide-react';

interface TimeLockBarProps {
  timeLock: TimeLockState;
  userRole?: UserRole;
  simulatedTime: string | null;
  onOpenSimModal: () => void;
  onRequestOverride?: () => void;
  canRequestOverride?: boolean;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function roleDeadline(timeLock: TimeLockState, role?: UserRole) {
  if (role === 'district_user') return { time: timeLock.district_deadline, label: 'إغلاق الإدخال اليومي' };
  if (role === 'directorate_user') return { time: timeLock.directorate_deadline, label: 'إغلاق مراجعة المديرية' };
  return { time: timeLock.ministry_deadline, label: 'إغلاق الاعتماد المركزي' };
}

export const TimeLockBar: React.FC<TimeLockBarProps> = ({
  timeLock,
  userRole,
  onRequestOverride,
  canRequestOverride = false,
}) => {
  const locked = timeLock.is_district_locked && !timeLock.has_active_override;
  const deadline = roleDeadline(timeLock, userRole);
  const minutesRemaining = toMinutes(deadline.time) - toMinutes(timeLock.current_time_str);
  const showWarning = minutesRemaining > 0 && minutesRemaining <= 30;
  const critical = minutesRemaining <= 10;

  return (
    <div className="bg-white/90 border-b border-[#e2e8ef]">
      {showWarning && (
        <div aria-live="polite" className={`border-b ${critical ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <div className="gov-shell px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-[10px] font-extrabold">
            <BellRing className={`w-4 h-4 ${critical ? 'animate-pulse' : ''}`} />
            <span>تنبيه: متبقي {minutesRemaining} دقيقة على {deadline.label} في تمام {deadline.time}.</span>
          </div>
        </div>
      )}

      <div className="gov-shell px-4 sm:px-6 lg:px-8">
        <div className="min-h-[42px] py-2 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock3 className="w-3.5 h-3.5 text-[#087f78]" />
              <span className="font-bold">توقيت المنظومة</span>
              <span className="text-[12px] font-extrabold text-[#172033] tabular-nums">{timeLock.current_time_str}</span>
            </div>

            <span className="hidden sm:block w-px h-4 bg-slate-200" />

            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold ${locked ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-[#eef9f6] text-[#147d64] border-[#cfece3]'}`}>
              {locked ? <LockKeyhole className="w-3.5 h-3.5" /> : <UnlockKeyhole className="w-3.5 h-3.5" />}
              <span>{locked ? 'انتهت نافذة الإدخال' : `الإدخال متاح حتى ${timeLock.district_deadline}`}</span>
            </div>

            {timeLock.has_active_override && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>فتح استثنائي</span>
                <span className="tabular-nums">{timeLock.override_minutes_remaining} دقيقة</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>مراجعة المديرية حتى <strong className="text-slate-700 tabular-nums">{timeLock.directorate_deadline}</strong></span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline">الاعتماد المركزي حتى <strong className="text-slate-700 tabular-nums">{timeLock.ministry_deadline}</strong></span>

            {locked && canRequestOverride && onRequestOverride && (
              <button onClick={onRequestOverride} className="h-7 px-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 font-extrabold hover:bg-amber-100 transition">
                طلب فتح
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
