'use client';

import React from 'react';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';
import { SYSTEM_NAME, SYSTEM_FULL_NAME, MINISTRY_NAME, SECTOR_NAME } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import {
  Clock3,
  LogOut,
  Building,
  Building2,
  ShieldCheck,
  User,
  FileText,
  ChevronDown,
  CircleHelp
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
    if (confirmed) await logout();
  };

  const roleIcon =
    currentProfile.role === 'district_user' ? <Building className="w-4 h-4" /> :
    currentProfile.role === 'directorate_user' ? <Building2 className="w-4 h-4" /> :
    currentProfile.role === 'super_admin' ? <ShieldCheck className="w-4 h-4" /> :
    <User className="w-4 h-4" />;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#dde5ed]">
      <div className="gov-shell px-4 sm:px-6 lg:px-8">
        <div className="h-[76px] flex items-center justify-between gap-5">

          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-12 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="شعار وزارة الصحة والسكان"
                fill
                sizes="44px"
                className="object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] font-bold text-slate-500">{MINISTRY_NAME}</p>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-[10px] font-bold text-slate-500">{SECTOR_NAME}</p>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-[15px] sm:text-[17px] font-extrabold text-[#172033] leading-tight">
                  {SYSTEM_NAME}
                </h1>
                <span className="hidden md:inline text-xs text-slate-500 font-medium truncate max-w-[420px]">
                  {SYSTEM_FULL_NAME}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f6f9fb] border border-[#e2e8f0] text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#087f78]" />
            <span className="font-bold text-slate-700">بيئة تشغيل حكومية مؤمنة</span>
            <span className="text-slate-300">•</span>
            <span>الجلسة الحالية محمية بالصلاحيات المعتمدة</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="hidden lg:flex h-10 items-center gap-2 px-3 rounded-xl gov-btn-secondary text-xs font-bold"
              >
                <FileText className="w-4 h-4 text-[#087f78]" />
                <span>التقرير الرسمي</span>
              </button>
            )}

            {onOpenAuditLogs && (
              <button
                onClick={onOpenAuditLogs}
                className="hidden md:flex h-10 items-center gap-2 px-3 rounded-xl gov-btn-secondary text-xs font-bold"
              >
                <Clock3 className="w-4 h-4 text-slate-500" />
                <span>سجل التدقيق</span>
              </button>
            )}

            <button
              type="button"
              className="hidden sm:flex items-center gap-3 min-w-0 rounded-2xl border border-[#dce4ec] bg-white px-3 py-2 hover:bg-slate-50 transition"
            >
              <div className="w-9 h-9 rounded-xl bg-[#eaf9f7] text-[#087f78] flex items-center justify-center flex-shrink-0">
                {roleIcon}
              </div>
              <div className="text-right min-w-0">
                <div className="text-xs font-extrabold text-[#172033] truncate max-w-[190px]">
                  {currentProfile.full_name}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[210px] mt-0.5">
                  {currentProfile.role_title_ar}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </button>

            <button
              type="button"
              className="w-10 h-10 rounded-xl border border-[#dce4ec] bg-white flex items-center justify-center text-slate-500 hover:text-[#087f78] hover:bg-[#f7fbfb] transition"
              title="المساعدة"
            >
              <CircleHelp className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl border border-[#eadde1] bg-white flex items-center justify-center text-rose-600 hover:bg-rose-50 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
