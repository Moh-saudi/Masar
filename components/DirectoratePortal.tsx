'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { DirectorateReviewView } from './DirectorateReviewView';
import { DirectorateDashboardView } from './DirectorateDashboardView';
import { ReportsCenterView } from './ReportsCenterView';
import { DirectoratePpfpReportView } from './DirectoratePpfpReportView';
import { DailySubmissionsRegisterView } from './DailySubmissionsRegisterView';
import {
  Building2,
  FileCheck2,
  BarChart3,
  FileSpreadsheet,
  Baby,
  MapPin,
  Clock3,
  CheckCircle2,
  RotateCcw,
  CircleDot,
  Building,
} from 'lucide-react';

interface DirectoratePortalProps {
  submissions: DailySubmission[];
  user: UserProfile;
  timeLock: TimeLockState;
  onDataChanged: () => void;
}

type Tab = 'daily_register' | 'review' | 'dashboard' | 'ppfp' | 'reports';

export const DirectoratePortal: React.FC<DirectoratePortalProps> = ({
  submissions,
  user,
  timeLock,
  onDataChanged,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<Tab>('daily_register');

  const govName = user.governorate_name_ar || 'القاهرة';
  const govSubmissions = submissions.filter(s => s.governorate_name_ar === govName);

  const pendingReviewCount = govSubmissions.filter(s => s.status === 'SUBMITTED_LOCKED').length;
  const returnedCount = govSubmissions.filter(s => s.status === 'RETURNED').length;
  const approvedCount = govSubmissions.filter(s => s.directorate_status === 'APPROVED').length;

  const navItems: Array<{
    id: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    { id: 'daily_register', label: 'سجلات اليوم', icon: <Building className="w-4 h-4" /> },
    { id: 'review', label: 'مراجعة واعتماد الإدارات', icon: <FileCheck2 className="w-4 h-4" />, count: pendingReviewCount },
    { id: 'dashboard', label: 'مؤشرات المحافظة', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'ppfp', label: 'مستشفيات الولادة والـ PPFP', icon: <Baby className="w-4 h-4" /> },
    { id: 'reports', label: 'التقارير والتصدير', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  const pageTitle =
    activeSubTab === 'daily_register' ? 'سجلات اليوم' :
    activeSubTab === 'review' ? 'مراجعة واعتماد بيانات الإدارات الصحية' :
    activeSubTab === 'dashboard' ? 'مؤشرات الأداء على مستوى المحافظة' :
    activeSubTab === 'ppfp' ? 'تقرير مستشفيات الولادة والـ PPFP' :
    'التقارير والتصدير';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">

      <aside className="xl:sticky xl:top-[94px] space-y-4">
        <div className="gov-surface p-3">
          <div className="px-2 py-2.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 mb-1">نطاق المديرية</p>
            <h2 className="text-sm font-extrabold text-[#172033] leading-6">
              مديرية الشئون الصحية
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>محافظة {govName}</span>
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
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#087f78] text-white text-[9px] font-extrabold flex items-center justify-center tabular-nums">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="gov-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock3 className="w-4 h-4 text-[#087f78]" />
            <h3 className="text-xs font-extrabold text-[#172033]">موقف المراجعة</h3>
          </div>

          <dl className="space-y-3 text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">إجمالي الإدارات</dt>
              <dd className="font-extrabold text-slate-900 tabular-nums">{govSubmissions.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">بانتظار المراجعة</dt>
              <dd className="font-extrabold text-[#087f78] tabular-nums">{pendingReviewCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">معتمد</dt>
              <dd className="font-extrabold text-emerald-700 tabular-nums">{approvedCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">مرجع للتعديل</dt>
              <dd className="font-extrabold text-rose-700 tabular-nums">{returnedCount}</dd>
            </div>
          </dl>
        </div>
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="gov-surface px-5 py-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#087f78] mb-1.5">
                <Building2 className="w-4 h-4" />
                <span>بوابة مديرية الشئون الصحية</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#172033]">{pageTitle}</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-6">
                متابعة الإدارات التابعة، مراجعة البيانات، وإدارة إجراءات الاعتماد ضمن صلاحيات المديرية.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 min-w-[320px]">
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <CircleDot className="w-3.5 h-3.5 text-[#087f78]" />
                  للمراجعة
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{pendingReviewCount}</div>
              </div>
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
            </div>
          </div>
        </div>

        {activeSubTab === 'daily_register' && (
          <DailySubmissionsRegisterView
            submissions={submissions}
            timeLock={timeLock}
            user={user}
            onRefreshData={onDataChanged}
          />
        )}

        {activeSubTab === 'review' && (
          <DirectorateReviewView
            submissions={govSubmissions}
            user={user}
            timeLock={timeLock}
            onDataChanged={onDataChanged}
          />
        )}

        {activeSubTab === 'dashboard' && (
          <DirectorateDashboardView
            submissions={govSubmissions}
            user={user}
            onNavigateToReview={() => setActiveSubTab('review')}
          />
        )}

        {activeSubTab === 'ppfp' && (
          <DirectoratePpfpReportView submissions={govSubmissions} user={user} />
        )}

        {activeSubTab === 'reports' && (
          <ReportsCenterView submissions={govSubmissions} user={user} />
        )}
      </section>
    </div>
  );
};
