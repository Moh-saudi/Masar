'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile } from '@/lib/types';
import { LogOut, X, ShieldAlert, Building2, User } from 'lucide-react';

import { UserAvatar } from './UserAvatar';

interface LogoutConfirmationModalProps {
  open: boolean;
  user: UserProfile;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  open,
  user,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open || !mounted) return null;

  const scopeLabel = user.district_name_ar
    ? `${user.district_name_ar} — ${user.governorate_name_ar || ''}`
    : user.governorate_name_ar
      ? `مديرية الشئون الصحية ب${user.governorate_name_ar}`
      : 'ديوان عام وزارة الصحة والسكان';

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      className="fixed inset-0 z-[9999] bg-slate-950/50 backdrop-blur-[3px] flex items-center justify-center p-4 animate-in fade-in duration-150 font-arabic"
    >
      <div
        className="w-full max-w-md bg-white border border-[#dfe6ee] rounded-2xl shadow-[0_24px_70px_rgba(23,32,51,0.22)] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Sovereign Line */}
        <div className="h-1.5 bg-gradient-to-l from-[#087f78] via-[#56aaa5] to-[#18334f]" />

        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-white to-[#fbfcfd]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-[#172033] flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 id="logout-dialog-title" className="text-base font-extrabold text-[#172033]">
                تسجيل الخروج من المنظومة
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                منظومة «مَسَار» — قطاع الرعاية وتنمية الأسرة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="إلغاء وإغلاق"
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            هل تريد بالتأكيد إنهاء جلسة العمل الحالية وتسجيل الخروج؟ سيتم حفظ كافة الإجراءات والبيانات المسجلة بأمان في سجل التدقيق الرقمي.
          </p>

          {/* User Profile Card */}
          <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/80 flex items-center gap-3">
            <UserAvatar role={user.role} name={user.full_name} avatarUrl={user.avatar_url} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-extrabold text-[#172033] truncate">
                {user.full_name}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>{user.role_title_ar || user.role}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{scopeLabel}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition disabled:opacity-50"
            >
              إلغاء والعودة للعمل
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="h-10 px-5 rounded-xl bg-[#172033] hover:bg-[#0f172a] text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition disabled:opacity-50 active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>{loading ? 'جاري تسجيل الخروج...' : 'تأكيد تسجيل الخروج'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
