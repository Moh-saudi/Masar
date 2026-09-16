'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { DistrictEntryView } from './DistrictEntryView';
import { DistrictDashboardView } from './DistrictDashboardView';
import { GovernanceAlertBanner } from './GovernanceAlertBanner';
import { OverrideRequestModal } from './OverrideRequestModal';
import { 
  Building, 
  FileSpreadsheet, 
  BarChart3, 
  Clock, 
  Send, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
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
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);

  const completedSections = Object.values(submission.sections).filter(s => s.status === 'completed').length;
  const isLocked = (timeLock.is_district_locked || submission.status === 'SUBMITTED_LOCKED') && !timeLock.has_active_override;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* ترويسة بوابة الإدارة الصحية الرسمية */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                بوابة الإدخال والرصد — {user.district_name_ar || submission.district_name_ar}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                مديرية الشئون الصحية بمحافظة {user.governorate_name_ar || submission.governorate_name_ar}
              </span>
            </div>
          </div>
        </div>

        {/* أزرار التبديل الداخلية بين التدوين ولوحة المؤشرات */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs">
            <button
              onClick={() => setActiveSubTab('entry')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'entry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
              <span>استمارة التدوين (12 قسم)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {completedSections}/12
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'dashboard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
              <span>لوحة مؤشرات وجرافات الإدارة</span>
            </button>
          </div>

          {isLocked && (
            <button
              onClick={() => setShowOverrideModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition shadow-xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>طلب استثناء (30 دقيقة)</span>
            </button>
          )}
        </div>
      </div>

      {/* شريط تنبيهات الحوكمة الخاص بالإدارة (إرجاع، استثناء، إغلاق) */}
      <GovernanceAlertBanner
        currentSubmission={submission}
        user={user}
      />

      {/* المحتوى الفعلي حسب التبويب المختار */}
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

      {/* نافذة طلب الاستثناء */}
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
