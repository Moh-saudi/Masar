'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';
import { SYSTEM_NAME, SYSTEM_FULL_NAME, MINISTRY_NAME, SECTOR_NAME } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';
import { TechnicalSupportModal } from './TechnicalSupportModal';
import {
  Clock3,
  LogOut,
  Building,
  Building2,
  ShieldCheck,
  User,
  FileText,
  ChevronDown,
  CircleHelp,
  MapPin,
  Mail,
  Shield
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setShowUserMenu(false);
    await logout();
  };

  // إغلاق قائمة المستخدم عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleIcon =
    currentProfile.role === 'district_user' ? <Building className="w-4 h-4 text-[#087f78]" /> :
    currentProfile.role === 'directorate_user' ? <Building2 className="w-4 h-4 text-[#087f78]" /> :
    currentProfile.role === 'super_admin' ? <ShieldCheck className="w-4 h-4 text-[#087f78]" /> :
    <User className="w-4 h-4 text-[#087f78]" />;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#dde5ed] shadow-2xs">
      <div className="gov-shell px-4 sm:px-6 lg:px-8">
        <div className="h-[74px] flex items-center justify-between gap-4">

          {/* الجانب الأيمن: الهوية والشعار الرسمي */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-11 h-12 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="شعار وزارة الصحة والسكان"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-500">{MINISTRY_NAME}</p>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-[10px] font-bold text-slate-500">{SECTOR_NAME}</p>
              </div>
              <div className="flex items-center gap-2.5 mt-0.5">
                <h1 className="text-[16px] sm:text-[18px] font-extrabold text-[#172033] leading-tight">
                  {SYSTEM_NAME}
                </h1>
                <span className="hidden lg:inline text-xs text-slate-400 font-medium truncate max-w-[420px]">
                  {SYSTEM_FULL_NAME}
                </span>
              </div>
            </div>
          </div>

          {/* الجانب الأيسر: الإجراءات وملف المستخدم */}
          <div className="flex items-center gap-2.5">
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="hidden lg:flex h-10 items-center gap-2 px-3.5 rounded-xl gov-btn-secondary text-xs font-bold transition"
              >
                <FileText className="w-4 h-4 text-[#087f78]" />
                <span>التقرير الرسمي</span>
              </button>
            )}

            {/* قائمة ملف المستخدم التفاعلية (User Profile Dropdown) */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(prev => !prev)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-1.5 transition select-none ${
                  showUserMenu
                    ? 'border-[#087f78] bg-[#f7fbfb] ring-2 ring-[#087f78]/10'
                    : 'border-[#dce4ec] bg-white hover:bg-slate-50/80 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#eaf9f7] text-[#087f78] flex items-center justify-center flex-shrink-0 border border-[#087f78]/15">
                  {roleIcon}
                </div>
                <div className="text-right min-w-0">
                  <div className="text-xs font-extrabold text-[#172033] truncate max-w-[170px] sm:max-w-[200px]">
                    {currentProfile.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[170px] sm:max-w-[200px] mt-0.5">
                    {currentProfile.role_title_ar}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${showUserMenu ? 'rotate-180 text-[#087f78]' : ''}`} />
              </button>

              {/* القائمة المنسدلة لبروفايل المستخدم */}
              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-[#dce4ec] shadow-[0_16px_40px_rgba(23,32,51,0.12)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  
                  {/* ترويسة بيانات المستخدم */}
                  <div className="px-3 py-2.5 rounded-xl bg-[#f8fafc] border border-slate-100 mb-1.5">
                    <div className="text-xs font-extrabold text-[#172033]">
                      {currentProfile.full_name}
                    </div>
                    <div className="text-[10px] text-[#087f78] font-bold mt-0.5">
                      {currentProfile.role_title_ar}
                    </div>
                    {currentProfile.email && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1.5 truncate dir-ltr text-right">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{currentProfile.email}</span>
                      </div>
                    )}
                    {(currentProfile.district_name_ar || currentProfile.governorate_name_ar) && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{currentProfile.district_name_ar || currentProfile.governorate_name_ar}</span>
                      </div>
                    )}
                  </div>

                  {/* عناصر القائمة */}
                  <div className="space-y-0.5">
                    {onOpenAuditLogs && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuditLogs();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#087f78] hover:bg-[#eaf9f7]/60 transition text-right"
                      >
                        <Clock3 className="w-4 h-4 text-[#087f78]" />
                        <span className="flex-1">سجل الرقابة والتدقيق (Audit Trail)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowSupportModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#087f78] hover:bg-[#eaf9f7]/60 transition text-right"
                    >
                      <CircleHelp className="w-4 h-4 text-slate-500" />
                      <span className="flex-1">الدعم الفني والمساعدة</span>
                    </button>
                  </div>

                  <div className="my-1.5 border-t border-slate-100" />

                  {/* زر تسجيل الخروج داخل القائمة */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-rose-700 hover:bg-rose-50 transition text-right"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>تسجيل الخروج من المنظومة</span>
                  </button>
                </div>
              )}
            </div>

            {/* زر الدعم الفني السريع */}
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="w-10 h-10 rounded-xl border border-[#dce4ec] bg-white flex items-center justify-center text-slate-500 hover:text-[#087f78] hover:bg-[#f7fbfb] transition"
              title="الدعم الفني والمساعدة"
            >
              <CircleHelp className="w-4 h-4" />
            </button>

            {/* زر تسجيل الخروج السريع */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              title="تسجيل الخروج وإنهاء الجلسة الرسمية"
              className="h-10 px-3 sm:px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50/70 hover:border-rose-200 text-slate-700 hover:text-rose-700 text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-600 transition" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>

        </div>
      </div>

      <LogoutConfirmationModal
        open={showLogoutConfirm}
        user={currentProfile}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <TechnicalSupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </header>
  );
};

