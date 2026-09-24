'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { DistrictEntryView } from './DistrictEntryView';
import { DistrictDashboardView } from './DistrictDashboardView';
import { ReportsCenterView } from './ReportsCenterView';
import { DistrictExceptionsLogView } from './DistrictExceptionsLogView';
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
  FileSpreadsheet,
  ShieldAlert,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface DistrictPortalProps {
  submission: DailySubmission;
  submissions?: DailySubmission[];
  user: UserProfile;
  timeLock: TimeLockState;
  onSubmissionUpdated: (updated: DailySubmission) => void;
}

export const DistrictPortal: React.FC<DistrictPortalProps> = ({
  submission,
  submissions,
  user,
  timeLock,
  onSubmissionUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'entry' | 'dashboard' | 'reports' | 'exceptions'>('entry');
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const districtSubs = React.useMemo(() => {
    const list = submissions && submissions.length > 0 ? [...submissions] : [submission];
    if (!list.some(s => s.id === submission.id || s.submission_date === submission.submission_date)) {
      list.unshift(submission);
    }
    return list.sort((a, b) => b.submission_date.localeCompare(a.submission_date));
  }, [submissions, submission]);

  const returnedSub = React.useMemo(() => {
    return districtSubs.find(s => s.status === 'RETURNED');
  }, [districtSubs]);

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>(submission.id);

  React.useEffect(() => {
    // إذا لم يكن المعرف المختار موجوداً بالقائمة، يعود لبيان اليوم
    if (selectedSubmissionId && !districtSubs.some(s => s.id === selectedSubmissionId)) {
      setSelectedSubmissionId(submission.id);
    }
  }, [districtSubs, selectedSubmissionId, submission.id]);

  const currentActiveSub = districtSubs.find(s => s.id === selectedSubmissionId) || submission;

  const completedSections = Object.values(currentActiveSub.sections).filter(s => s.status === 'completed').length;
  const completionRate = Math.round((completedSections / 12) * 100);
  
  const isReturned = currentActiveSub.status === 'RETURNED';
  const hasOverride = Boolean(
    currentActiveSub.override_active &&
    currentActiveSub.override_expires_at &&
    new Date(currentActiveSub.override_expires_at).getTime() > Date.now()
  );
  const isLocked = !isReturned && !hasOverride && (
    currentActiveSub.status === 'APPROVED' || 
    currentActiveSub.status === 'SUBMITTED_LOCKED'
  );

  const statusLabel =
    currentActiveSub.status === 'APPROVED' ? 'معتمد' :
    currentActiveSub.status === 'SUBMITTED_LOCKED' ? 'مرسل للمراجعة' :
    currentActiveSub.status === 'RETURNED' ? 'مرجع للتعديل' :
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

          {districtSubs.length > 1 && (
            <div className="px-2 py-2 border-b border-slate-100 bg-[#f8fafc]">
              <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                <span>تاريخ البيان المعروض</span>
                {returnedSub && (
                  <span className="text-[9px] text-rose-600 font-extrabold bg-rose-100 px-1.5 py-0.5 rounded">
                    يوجد بيان مُرجع
                  </span>
                )}
              </label>
              <select
                value={currentActiveSub.id}
                onChange={(e) => setSelectedSubmissionId(e.target.value)}
                className="gov-input h-8 text-[11px] font-bold w-full bg-white text-slate-800"
              >
                {districtSubs.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.submission_date} ({s.status === 'RETURNED' ? '⚠️ مُرجع للتعديل' : s.status === 'APPROVED' ? 'معتمد' : s.status === 'SUBMITTED_LOCKED' ? 'مرفوع' : 'مسودة'})
                  </option>
                ))}
              </select>
            </div>
          )}

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

            <button
              onClick={() => setActiveSubTab('reports')}
              className="gov-nav-item"
              data-active={activeSubTab === 'reports'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="flex-1 text-right">التقارير والسجل</span>
            </button>

            <button
              onClick={() => setActiveSubTab('exceptions')}
              className="gov-nav-item"
              data-active={activeSubTab === 'exceptions'}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span className="flex-1 text-right">سجل الاستثناءات والإرجاعات</span>
              {returnedSub && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                  مُرجع
                </span>
              )}
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
              <dd className="font-bold text-slate-800 tabular-nums">{currentActiveSub.submission_date}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">موعد الإغلاق</dt>
              <dd className="font-bold text-slate-800 tabular-nums">{timeLock.district_deadline}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">النافذة</dt>
              <dd className={`font-bold ${isLocked ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isReturned
                  ? 'مفتوحة للتعديل (مُرجع)'
                  : hasOverride
                    ? 'مفتوحة باستثناء'
                    : isLocked
                      ? 'مغلقة'
                      : timeLock.is_district_before_open
                        ? 'تفتح 09:00 ص'
                        : 'متاحة'}
              </dd>
            </div>
          </dl>

          {isLocked && !isReturned && (
            <button
              onClick={() => setShowOverrideModal(true)}
              className="mt-4 w-full h-10 rounded-xl bg-[#fff7e8] border border-[#f2d49a] text-[#9a640f] text-[11px] font-extrabold flex items-center justify-center gap-2 hover:bg-[#fff2d5] transition cursor-pointer"
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
                <span className="text-slate-500">
                  {activeSubTab === 'entry' ? 'الإدخال اليومي' : activeSubTab === 'dashboard' ? 'المؤشرات' : activeSubTab === 'reports' ? 'التقارير' : 'سجل الاستثناءات'}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-extrabold text-[#172033]">
                {activeSubTab === 'entry'
                  ? `إدخال وتجميع البيان (تاريخ ${currentActiveSub.submission_date})`
                  : activeSubTab === 'dashboard'
                    ? 'لوحة مؤشرات الإدارة الصحية'
                    : activeSubTab === 'reports'
                      ? 'تقارير وسجل الإدارة الصحية'
                      : 'سجل الاستثناءات والبيانات المُرجعة للتعديل'}
              </h1>

              <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-6">
                {activeSubTab === 'entry'
                  ? 'استكمال بيانات الأقسام المعتمدة وحفظها كمسودة أو مراجعتها وإرسالها للمديرية.'
                  : activeSubTab === 'dashboard'
                    ? 'متابعة المؤشرات التشغيلية وحالة اكتمال البيانات على مستوى الإدارة.'
                    : activeSubTab === 'reports'
                      ? 'البحث في السجلات اليومية والتقارير التاريخية الخاصة بهذه الإدارة فقط.'
                      : 'سجل شامل لكافة البيانات المُرجعة للتعديل وطلبات الفتح الاستثنائي وتتبع قرارات المديرية.'}
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
                  <BarChart3 className="w-3.5 h-3.5 text-[#087f78]" />
                  نسبة الإنجاز
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{completionRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* تنبيه مدمج ومرتب للبيانات المرجعة بدلاً من اللافتات العريضة المتكدسة */}
        {returnedSub && (
          <div className="bg-rose-50 border border-rose-200/90 rounded-xl p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-rose-900 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>يوجد بيان مُرجع للتعديل من المديرية ليوم ({returnedSub.submission_date})</span>
              <span className="text-[11px] font-normal text-rose-700 hidden sm:inline">— {returnedSub.returned_reason}</span>
            </div>
            <div className="flex items-center gap-1.5 mr-auto">
              {currentActiveSub.id !== returnedSub.id && (
                <button
                  onClick={() => setSelectedSubmissionId(returnedSub.id)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] transition cursor-pointer"
                >
                  فتح للتعديل
                </button>
              )}
              <button
                onClick={() => setActiveSubTab('exceptions')}
                className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 rounded-lg font-bold text-[10px] hover:bg-rose-50 transition cursor-pointer"
              >
                عرض في سجل الاستثناءات
              </button>
            </div>
          </div>
        )}

        {/* تنبيه واضح عند استعراض أو تعديل بيان يوم سابق أو مُرجع بدلاً من بيان اليوم */}
        {currentActiveSub.id !== submission.id && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold">
              <CalendarDays className="w-4 h-4 text-amber-700 shrink-0" />
              <span>أنت تستعرض حالياً بيان يوم ({currentActiveSub.submission_date}) {isReturned ? '— مُرجع للتعديل' : ''}</span>
            </div>
            <button
              onClick={() => setSelectedSubmissionId(submission.id)}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>العودة لبيان اليوم ({submission.submission_date})</span>
            </button>
          </div>
        )}

        {activeSubTab === 'entry' && (
          <DistrictEntryView
            key={currentActiveSub.id}
            submission={currentActiveSub}
            user={user}
            timeLock={timeLock}
            onSubmissionUpdated={onSubmissionUpdated}
            onRequestOverride={() => setShowOverrideModal(true)}
          />
        )}

        {activeSubTab === 'dashboard' && (
          <DistrictDashboardView
            submission={currentActiveSub}
            user={user}
            onNavigateToEntry={() => setActiveSubTab('entry')}
          />
        )}

        {activeSubTab === 'reports' && (
          <ReportsCenterView
            submissions={districtSubs}
            user={user}
            onOpenSubmission={(sub) => {
              setSelectedSubmissionId(sub.id);
              setActiveSubTab('entry');
            }}
          />
        )}

        {activeSubTab === 'exceptions' && (
          <DistrictExceptionsLogView
            submissions={districtSubs}
            currentSubmission={currentActiveSub}
            user={user}
            timeLock={timeLock}
            onSelectSubmissionToEdit={(subId) => {
              setSelectedSubmissionId(subId);
              setActiveSubTab('entry');
            }}
            onRequestOverride={() => setShowOverrideModal(true)}
          />
        )}
      </section>

      {showOverrideModal && (
        <OverrideRequestModal
          submission={currentActiveSub}
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
