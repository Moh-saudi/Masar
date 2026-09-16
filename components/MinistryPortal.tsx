'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { NationalDashboardView } from './NationalDashboardView';
import { ExceptionsMonitorView } from './ExceptionsMonitorView';
import { ReportsCenterView } from './ReportsCenterView';
import { OfficialReportModal } from './OfficialReportModal';
import { OrganizationHierarchyView } from './OrganizationHierarchyView';
import { 
  Building, 
  LayoutDashboard, 
  ShieldAlert, 
  FileSpreadsheet, 
  Printer, 
  CheckCheck,
  Network
} from 'lucide-react';

interface MinistryPortalProps {
  submissions: DailySubmission[];
  user: UserProfile;
  timeLock: TimeLockState;
  onDataChanged: () => void;
}

export const MinistryPortal: React.FC<MinistryPortalProps> = ({
  submissions,
  user,
  timeLock,
  onDataChanged,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'national' | 'exceptions' | 'hierarchy' | 'reports'>('national');
  const [showOfficialReportModal, setShowOfficialReportModal] = useState<boolean>(false);

  const returnedCount = submissions.filter(s => s.status === 'RETURNED').length;
  const overrideCount = submissions.filter(s => s.override_active && s.override_expires_at && new Date(s.override_expires_at).getTime() > Date.now()).length;
  const totalExceptionsCount = returnedCount + overrideCount;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* ترويسة بوابة ديوان عام الوزارة والقطاع */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                بوابة قطاع الرعاية الصحية وتنمية الأسرة — ديوان عام الوزارة
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                الرصد القومي الاستراتيجي لكافة محافظات الجمهورية الـ 27 والإدارات الصحية الـ 260
              </span>
            </div>
          </div>
        </div>

        {/* أزرار التبديل الداخلية بين اللوحة القومية والاستثناءات والتقارير */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs">
            <button
              onClick={() => setActiveSubTab('national')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'national' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
              <span>اللوحة القومية للجمهورية</span>
            </button>

            <button
              onClick={() => setActiveSubTab('exceptions')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 relative ${
                activeSubTab === 'exceptions' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>غرفة الاستثناءات والرصد</span>
              {totalExceptionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white">
                  {totalExceptionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('hierarchy')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'hierarchy' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-purple-800'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-purple-600" />
              <span>الهيكل التنظيمي والمنشآت</span>
            </button>

            <button
              onClick={() => setActiveSubTab('reports')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'reports' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>مركز التقارير وتصدير Excel</span>
            </button>
          </div>

          <button
            onClick={() => setShowOfficialReportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>التقرير الوزاري A4</span>
          </button>
        </div>
      </div>

      {/* المحتوى الفعلي حسب التبويب */}
      {activeSubTab === 'national' && (
        <NationalDashboardView
          submissions={submissions}
          user={user}
          timeLock={timeLock}
          onDataChanged={onDataChanged}
          onOpenReport={() => setShowOfficialReportModal(true)}
        />
      )}

      {activeSubTab === 'exceptions' && (
        <ExceptionsMonitorView
          submissions={submissions}
          timeLock={timeLock}
          user={user}
        />
      )}

      {activeSubTab === 'hierarchy' && (
        <OrganizationHierarchyView
          user={user}
        />
      )}

      {activeSubTab === 'reports' && (
        <ReportsCenterView
          submissions={submissions}
          user={user}
        />
      )}

      {/* نافذة التقرير الوزاري الرسمي A4 للطباعة والتوقيع */}
      {showOfficialReportModal && submissions[0] && (
        <OfficialReportModal
          submission={submissions[0]}
          user={user}
          onClose={() => setShowOfficialReportModal(false)}
        />
      )}

    </div>
  );
};
