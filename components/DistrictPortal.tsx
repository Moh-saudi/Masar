'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { DistrictEntryView } from './DistrictEntryView';
import { DistrictDashboardView } from './DistrictDashboardView';
import { GovernanceAlertBanner } from './GovernanceAlertBanner';
import { OverrideRequestModal } from './OverrideRequestModal';
import {
  Building2,
  ClipboardList,
  BarChart3,
  Clock3,
  CheckCircle2,
  CircleDot,
  CalendarDays,
  MapPin,
  FileCheck2,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface DistrictPortalProps {
  submission: DailySubmission;
  user: UserProfile;
  timeLock: TimeLockState;
  onSubmissionUpdated: (updated: DailySubmission) => void;
}

export const DistrictPortal: React.FC<DistrictPortalProps> = ({
  submission,
  user,
  timeLock,
  onSubmissionUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'entry' | 'dashboard'>('entry');
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const completedSections = Object.values(submission.sections).filter(s => s.status === 'completed').length;
  const completionRate = Math.round((completedSections / 12) * 100);
  const isLocked = (timeLock.is_district_locked || submission.status === 'SUBMITTED_LOCKED') && !timeLock.has_active_override;

  const statusLabel =
    submission.status === 'APPROVED' ? 'معتمد' :
    submission.status === 'SUBMITTED_LOCKED' ? 'مرسل للمراجعة' :
    submission.status === 'RETURNED' ? 'مرجع للتعديل' :
    'مسودة عمل';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">

      <aside className="xl:sticky xl:top-[94px] space-y-4">
        <div className="gov-surface p-3">
          <div className="px-2 py-2.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 mb-1">نطاق العمل الحالي</p>
            <h2 className="text-sm font-extrabold text-[#172033] leading-6">
              {user.district_name_ar || submission.district_name_ar}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>محافظة {user.governorate_name_ar || submission.governorate_name_ar}</span>
            </div>
          </div>

          <nav className="py-2 space-y-1">
            <button
              onClick={() => setActiveSubTab('entry')}
              className="gov-nav-item"
              data-active={activeSubTab === 'entry'}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="flex-1 text-right">الإدخال اليومي</span>
              <span className="text-[10px] tabular-nums">{completedSections}/12</span>
            </button>

            <button
              onClick={() => setActiveSubTab('dashboard')}
              className="gov-nav-item"
              data-active={activeSubTab === 'dashboard'}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="flex-1 text-right">مؤشرات الإدارة</span>
            </button>
          </nav>

          <div className="border-t border-slate-100 px-2 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500">اكتمال البيان</span>
              <span className="text-[11px] font-extrabold text-[#087f78] tabular-nums">{completionRate}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#087f78] rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="gov-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck2 className="w-4 h-4 text-[#087f78]" />
            <h3 className="text-xs font-extrabold text-[#172033]">حالة البيان</h3>
          </div>

          <dl className="space-y-3 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">الحالة</dt>
              <dd className="font-bold text-slate-800">{statusLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">التاريخ</dt>
              <dd className="font-bold text-slate-800 tabular-nums">{submission.submission_date}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">موعد الإغلاق</dt>
              <dd className="font-bold text-slate-800 tabular-nums">{timeLock.district_deadline}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">النافذة</dt>
              <dd className={`font-bold ${isLocked ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isLocked ? 'مغلقة' : 'متاحة'}
              </dd>
            </div>
          </dl>

          {isLocked && (
            <button
              onClick={() => setShowOverrideModal(true)}
              className="mt-4 w-full h-10 rounded-xl bg-[#fff7e8] border border-[#f2d49a] text-[#9a640f] text-[11px] font-extrabold flex items-center justify-center gap-2 hover:bg-[#fff2d5] transition"
            >
              <ShieldAlert className="w-4 h-4" />
              طلب فتح استثنائي
            </button>
          )}
        </div>
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="gov-surface px-5 py-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#087f78] mb-1.5">
                <Building2 className="w-4 h-4" />
                <span>بوابة الإدارة الصحية</span>
                <ArrowLeft className="w-3 h-3 text-slate-300" />
                <span className="text-slate-500">{activeSubTab === 'entry' ? 'الإدخال اليومي' : 'المؤشرات'}</span>
              </div>

              <h1 className="text-lg sm:text-xl font-extrabold text-[#172033]">
                {activeSubTab === 'entry' ? 'إدخال وتجميع البيان اليومي' : 'لوحة مؤشرات الإدارة الصحية'}
              </h1>

              <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-6">
                {activeSubTab === 'entry'
                  ? 'استكمال بيانات الأقسام المعتمدة ومراجعتها قبل الإرسال إلى مديرية الشئون الصحية.'
                  : 'متابعة المؤشرات التشغيلية وحالة اكتمال البيانات على مستوى الإدارة.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 min-w-[320px]">
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  مكتمل
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{completedSections}</div>
              </div>
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <CircleDot className="w-3.5 h-3.5 text-slate-400" />
                  متبقي
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{12 - completedSections}</div>
              </div>
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <Clock3 className="w-3.5 h-3.5 text-[#087f78]" />
                  الوقت
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{timeLock.current_time_str}</div>
              </div>
            </div>
          </div>
        </div>

        <GovernanceAlertBanner currentSubmission={submission} user={user} />

        {activeSubTab === 'entry' ? (
          <DistrictEntryView
            submission={submission}
            user={user}
            timeLock={timeLock}
            onSubmissionUpdated={onSubmissionUpdated}
            onRequestOverride={() => setShowOverrideModal(true)}
          />
        ) : (
          <DistrictDashboardView
            submission={submission}
            user={user}
            onNavigateToEntry={() => setActiveSubTab('entry')}
          />
        )}
      </section>

      {showOverrideModal && (
        <OverrideRequestModal
          submission={submission}
          user={user}
          onClose={() => setShowOverrideModal(false)}
          onRequestSubmitted={(updatedSub) => {
            onSubmissionUpdated(updatedSub);
            setShowOverrideModal(false);
          }}
        />
      )}
    </div>
  );
};
