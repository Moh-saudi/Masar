'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { NationalDashboardView } from './NationalDashboardView';
import { ExceptionsMonitorView } from './ExceptionsMonitorView';
import { ReportsCenterView } from './ReportsCenterView';
import { OfficialReportModal } from './OfficialReportModal';
import { OrganizationHierarchyView } from './OrganizationHierarchyView';
import {
  Landmark,
  LayoutDashboard,
  ShieldAlert,
  FileSpreadsheet,
  Printer,
  Network,
  CheckCircle2,
  RotateCcw,
  Clock3,
  Map
} from 'lucide-react';

interface MinistryPortalProps {
  submissions: DailySubmission[];
  user: UserProfile;
  timeLock: TimeLockState;
  onDataChanged: () => void;
}

type Tab = 'national' | 'exceptions' | 'hierarchy' | 'reports';

export const MinistryPortal: React.FC<MinistryPortalProps> = ({
  submissions,
  user,
  timeLock,
  onDataChanged,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<Tab>('national');
  const [showOfficialReportModal, setShowOfficialReportModal] = useState(false);

  const returnedCount = submissions.filter(s => s.status === 'RETURNED').length;
  const overrideCount = submissions.filter(
    s => s.override_active && s.override_expires_at && new Date(s.override_expires_at).getTime() > Date.now()
  ).length;
  const approvedCount = submissions.filter(s => s.ministry_status === 'APPROVED').length;
  const totalExceptionsCount = returnedCount + overrideCount;
  const governorateCount = new Set(submissions.map(s => s.governorate_name_ar)).size;

  const navItems: Array<{ id: Tab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'national', label: 'اللوحة القومية', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'exceptions', label: 'الاستثناءات والرصد', icon: <ShieldAlert className="w-4 h-4" />, count: totalExceptionsCount },
    { id: 'hierarchy', label: 'الهيكل التنظيمي', icon: <Network className="w-4 h-4" /> },
    { id: 'reports', label: 'التقارير والتصدير', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  const pageTitle =
    activeSubTab === 'national' ? 'المتابعة القومية لبيانات تنمية الأسرة' :
    activeSubTab === 'exceptions' ? 'غرفة الاستثناءات والرصد المركزي' :
    activeSubTab === 'hierarchy' ? 'الهيكل التنظيمي والمنشآت' :
    'مركز التقارير القومية';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">

      <aside className="xl:sticky xl:top-[94px] space-y-4">
        <div className="gov-surface p-3">
          <div className="px-2 py-2.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 mb-1">المستوى المركزي</p>
            <h2 className="text-sm font-extrabold text-[#172033] leading-6">
              ديوان عام الوزارة
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
              <Landmark className="w-3.5 h-3.5" />
              <span>قطاع الرعاية الصحية وتنمية الأسرة</span>
            </div>
          </div>

          <nav className="py-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className="gov-nav-item"
                data-active={activeSubTab === item.id}
              >
                {item.icon}
                <span className="flex-1 text-right">{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center tabular-nums">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-100 pt-3 px-2">
            <button
              onClick={() => setShowOfficialReportModal(true)}
              className="w-full h-10 rounded-xl gov-btn-secondary text-[10px] font-extrabold flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#087f78]" />
              التقرير الوزاري الرسمي
            </button>
          </div>
        </div>

        <div className="gov-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Map className="w-4 h-4 text-[#087f78]" />
            <h3 className="text-xs font-extrabold text-[#172033]">الموقف القومي</h3>
          </div>

          <dl className="space-y-3 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">المحافظات الظاهرة</dt>
              <dd className="font-extrabold text-slate-900 tabular-nums">{governorateCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">الإدارات الصحية</dt>
              <dd className="font-extrabold text-slate-900 tabular-nums">{submissions.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">اعتماد مركزي</dt>
              <dd className="font-extrabold text-emerald-700 tabular-nums">{approvedCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">استثناءات نشطة</dt>
              <dd className="font-extrabold text-rose-700 tabular-nums">{totalExceptionsCount}</dd>
            </div>
          </dl>
        </div>
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="gov-surface px-5 py-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#087f78] mb-1.5">
                <Landmark className="w-4 h-4" />
                <span>بوابة ديوان عام الوزارة</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#172033]">{pageTitle}</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-6">
                متابعة الموقف القومي، مؤشرات المحافظات، الاستثناءات، والتقارير المعتمدة على مستوى الجمهورية.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 min-w-[330px]">
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  معتمد
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{approvedCount}</div>
              </div>
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  مرجع
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{returnedCount}</div>
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
          <ExceptionsMonitorView submissions={submissions} timeLock={timeLock} user={user} />
        )}

        {activeSubTab === 'hierarchy' && (
          <OrganizationHierarchyView user={user} />
        )}

        {activeSubTab === 'reports' && (
          <ReportsCenterView submissions={submissions} user={user} />
        )}
      </section>

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
