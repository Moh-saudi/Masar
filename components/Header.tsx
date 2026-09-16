'use client';

import React from 'react';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';
import { SYSTEM_NAME, MINISTRY_NAME, SECTOR_NAME } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { 
  FileText, 
  Clock, 
  LogOut, 
  Building, 
  Building2, 
  ShieldCheck,
  User
} from 'lucide-react';

interface HeaderProps {
  currentProfile: UserProfile;
  onOpenReport?: () => void;
  onOpenAuditLogs?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  onOpenReport,
  onOpenAuditLogs,
}) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    const confirmed = window.confirm('تأكيد تسجيل الخروج من منظومة «مَسَار»؟');
    if (confirmed) {
      await logout();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* الجانب الأيمن: الشعار والاسم الرسمي بهوية خط المراعي */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-12 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="شعار وزارة الصحة والسكان"
                width={44}
                height={52}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  {MINISTRY_NAME}
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                  {SYSTEM_NAME}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {SECTOR_NAME} — المنظومة القومية لتجميع وتحليل البيانات
              </p>
            </div>
          </div>

          {/* الجانب الأيسر: بيانات المستخدم الفعلي وإجراءات الحساب */}
          <div className="flex items-center gap-2.5">
            
            {/* زر استخراج التقرير الرسمي */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition"
                title="معاينة وطباعة التقرير القومي المعتمد"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>التقرير الرسمي</span>
              </button>
            )}

            {/* سجل التدقيق */}
            {onOpenAuditLogs && (
              <button
                onClick={onOpenAuditLogs}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>سجل التدقيق</span>
              </button>
            )}

            {/* بطاقة المستخدم الفعلي الرسمية */}
            <div className="flex items-center gap-2.5 pl-2 border-r border-slate-200 mr-1">
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                {currentProfile.role === 'district_user' && <Building className="w-4 h-4 text-sky-600" />}
                {currentProfile.role === 'directorate_user' && <Building2 className="w-4 h-4 text-indigo-600" />}
                {currentProfile.role === 'super_admin' && <ShieldCheck className="w-4 h-4 text-purple-600" />}
                {(currentProfile.role === 'sector_head' || currentProfile.role === 'general_director' || currentProfile.role === 'central_admin') && (
                  <User className="w-4 h-4 text-emerald-600" />
                )}
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{currentProfile.full_name}</span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span className="font-semibold text-sky-700">{currentProfile.role_title_ar}</span>
                  {currentProfile.district_name_ar && (
                    <span className="text-slate-400 font-mono">• {currentProfile.district_name_ar}</span>
                  )}
                  {currentProfile.governorate_name_ar && !currentProfile.district_name_ar && (
                    <span className="text-slate-400 font-mono">• محافظة {currentProfile.governorate_name_ar}</span>
                  )}
                </div>
              </div>
            </div>

            {/* زر تسجيل الخروج */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
              title="تسجيل الخروج الآمن من المنظومة"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
