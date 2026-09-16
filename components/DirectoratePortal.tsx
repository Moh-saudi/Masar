'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { DirectorateReviewView } from './DirectorateReviewView';
import { DirectorateDashboardView } from './DirectorateDashboardView';
import { ReportsCenterView } from './ReportsCenterView';
import { DirectoratePpfpReportView } from './DirectoratePpfpReportView';
import { 
  Building2, 
  FileCheck2, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldAlert,
  Download,
  Baby
} from 'lucide-react';

interface DirectoratePortalProps {
  submissions: DailySubmission[];
  user: UserProfile;
  timeLock: TimeLockState;
  onDataChanged: () => void;
}

export const DirectoratePortal: React.FC<DirectoratePortalProps> = ({
  submissions,
  user,
  timeLock,
  onDataChanged,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'dashboard' | 'ppfp' | 'reports'>('review');

  // حصر البيانات في محافظة المستخدم فقط
  const govName = user.governorate_name_ar || 'القاهرة';
  const govSubmissions = submissions.filter(s => s.governorate_name_ar === govName);

  const pendingReviewCount = govSubmissions.filter(s => s.status === 'SUBMITTED_LOCKED').length;
  const returnedCount = govSubmissions.filter(s => s.status === 'RETURNED').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* ترويسة بوابة مديرية الشئون الصحية */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                بوابة مديرية الشئون الصحية — محافظة {govName}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                إدارة تنظيم الأسرة وتنمية الأسرة • فحص وتدقيق واعتماد الإدارات الصحية
              </span>
            </div>
          </div>
        </div>

        {/* أزرار التبديل الداخلية بين المراجعة واللوحة والـ PPFP والتقارير */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs">
          <button
            onClick={() => setActiveSubTab('review')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 relative ${
              activeSubTab === 'review' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5 text-sky-600" />
            <span>تدقيق واعتماد الإدارات</span>
            {pendingReviewCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-600 text-white font-bold">
                {pendingReviewCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'dashboard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
            <span>مؤشرات المحافظة والمقارنة البينية</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ppfp')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'ppfp' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-indigo-800'
            }`}
          >
            <Baby className="w-3.5 h-3.5 text-indigo-600" />
            <span>مستشفيات الولادة والـ PPFP</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'reports' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>تقارير وتصدير Excel</span>
          </button>
        </div>
      </div>

      {/* المحتوى الفعلي حسب التبويب المختار */}
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
        <DirectoratePpfpReportView
          submissions={govSubmissions}
          user={user}
        />
      )}

      {activeSubTab === 'reports' && (
        <ReportsCenterView
          submissions={govSubmissions}
          user={user}
        />
      )}

    </div>
  );
};
