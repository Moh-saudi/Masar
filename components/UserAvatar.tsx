'use client';

import React, { useState } from 'react';
import { UserRole } from '@/lib/types';
import {
  ShieldCheck,
  Building2,
  Building,
  Briefcase,
  Landmark,
  FileBadge,
  User,
  Stethoscope,
  Crown
} from 'lucide-react';

interface UserAvatarProps {
  role?: UserRole;
  name?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  role = 'district_user',
  name = '',
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Size dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-md text-[10px]',
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-8 h-8 rounded-xl text-sm',
    lg: 'w-10 h-10 rounded-xl text-base',
    xl: 'w-14 h-14 rounded-2xl text-xl',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-7 h-7',
  }[size];

  // If a valid custom photo is provided and hasn't failed to load
  if (avatarUrl && !imageFailed) {
    return (
      <div className={`relative overflow-hidden flex-shrink-0 border border-slate-200 shadow-2xs ${sizeClasses} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name || 'صورة الحساب'}
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Distinct Sovereign Role-Based Avatars (لا تظهر أي حروف، بل أيقونات معتمدة ذات ألوان وظيفية مخصصة)
  switch (role) {
    case 'super_admin':
      return (
        <div
          title="مسؤول النظام وتكنولوجيا المعلومات"
          className={`flex items-center justify-center flex-shrink-0 bg-[#18334f] text-emerald-400 border border-[#087f78]/30 shadow-2xs ${sizeClasses} ${className}`}
        >
          <ShieldCheck className={iconSizes} />
        </div>
      );

    case 'sector_head':
      return (
        <div
          title="رئيس قطاع الرعاية الصحية وتنمية الأسرة"
          className={`flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#18334f] to-[#087f78] text-amber-300 border border-amber-300/40 shadow-2xs ${sizeClasses} ${className}`}
        >
          <Crown className={iconSizes} />
        </div>
      );

    case 'central_admin':
      return (
        <div
          title="رئيس الإدارة المركزية"
          className={`flex items-center justify-center flex-shrink-0 bg-[#0f4c5c] text-teal-200 border border-teal-300/30 shadow-2xs ${sizeClasses} ${className}`}
        >
          <Landmark className={iconSizes} />
        </div>
      );

    case 'general_director':
      return (
        <div
          title="مدير عام تنمية الأسرة"
          className={`flex items-center justify-center flex-shrink-0 bg-[#087f78] text-white border border-[#066963] shadow-2xs ${sizeClasses} ${className}`}
        >
          <Briefcase className={iconSizes} />
        </div>
      );

    case 'directorate_user':
      return (
        <div
          title="مسؤول ومراجع مديرية الشئون الصحية"
          className={`flex items-center justify-center flex-shrink-0 bg-[#eaf8f3] text-[#147d64] border border-[#a8e5ce] shadow-2xs ${sizeClasses} ${className}`}
        >
          <Building2 className={iconSizes} />
        </div>
      );

    case 'district_user':
    default:
      return (
        <div
          title="مسؤول إدخال وتجميع الإدارة الصحية"
          className={`flex items-center justify-center flex-shrink-0 bg-[#eaf9f7] text-[#087f78] border border-[#bfebe5] shadow-2xs ${sizeClasses} ${className}`}
        >
          <Building className={iconSizes} />
        </div>
      );
  }
};
