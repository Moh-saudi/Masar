'use client';

import React from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { AlertCircle, Unlock, UserCheck, Clock } from 'lucide-react';

interface GovernanceAlertBannerProps {
  currentSubmission?: DailySubmission;
  user: UserProfile;
}

export const GovernanceAlertBanner: React.FC<GovernanceAlertBannerProps> = ({
  currentSubmission,
  user,
}) => {
  // تقتصر هذه اللافتة حصراً على موظف الإدارة الصحية عندما يخص الإشعار إدارته فقط
  // (لتفادي إغراق الشاشات باللافتات لمستوى الوزارة والمديرية التي تخدم 260 إدارة)
  if (user.role !== 'district_user' || !currentSubmission) {
    return null;
  }

  const isReturned = currentSubmission.status === 'RETURNED';
  const hasActiveOverride = currentSubmission.override_active && 
    currentSubmission.override_expires_at && 
    new Date(currentSubmission.override_expires_at).getTime() > Date.now();

  if (!isReturned && !hasActiveOverride) {
    return null;
  }

  return (
    <div className="space-y-3 mb-5 animate-in fade-in">
      
      {/* إشعار إرجاع بيان الإدارة الحالية للتعديل */}
      {isReturned && (
        <div className="bg-rose-50 border-r-4 border-r-rose-600 border border-rose-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-900">
                  إشعار إرجاع البيان للتعديل — {currentSubmission.district_name_ar}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-rose-200 text-rose-800">
                  مُرجع للتعديل
                </span>
              </div>

              <p className="text-xs text-rose-800 font-medium leading-relaxed">
                <strong>ملاحظات المديرية وسبب الإرجاع: </strong> 
                "{currentSubmission.returned_reason || 'يرجى مراجعة وتدقيق أرقام الحقول ومطابقتها للكشوف'}"
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-rose-700 pt-1">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                  <span>القائم بالإرجاع: <strong>{currentSubmission.returned_by || 'مدير تنظيم الأسرة بالمديرية'}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>التوقيت: <strong>{currentSubmission.returned_at || 'اليوم، 04:15 م'}</strong></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* إشعار الفتح الاستثنائي المؤقت للإدارة الحالية */}
      {hasActiveOverride && (
        <div className="bg-amber-50 border-r-4 border-r-amber-500 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
              <Unlock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950">
                  تم منح رخصة فتح استثنائي مؤقت للإدارة (30 دقيقة)
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-200 text-amber-900 animate-pulse">
                  نافذة مفتوحة للتعديل
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-amber-800 pt-1">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>المسؤول المانح للفتح: <strong>{currentSubmission.override_granted_by || 'وكيل الوزارة / مدير تنظيم الأسرة بالمديرية'}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>التوقيت: <strong>{currentSubmission.override_granted_at || 'اليوم، 03:30 م'}</strong></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
