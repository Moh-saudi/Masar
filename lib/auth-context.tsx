'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// الحسابات الحكومية التأسيسية المعتمدة للمنظومة وفقاً لدليل الحسابات الرسمي (RBAC Matrix)
export const INITIAL_OFFICIAL_ACCOUNTS: UserProfile[] = [
  {
    id: 'user-super-admin',
    full_name: 'م. تامر الجوهري (إدارة تكنولوجيا المعلومات)',
    email: 'superadmin@masar.moh.gov.eg',
    national_id: '29005050501234',
    role: 'super_admin',
    role_title_ar: 'مدير عام البوابة والأنظمة الرقمية السيادية',
  },
  {
    id: 'user-ministry-sector-head',
    full_name: 'أ.د. حسام عبد الغفار / قيادات القطاع',
    email: 'minister.office@masar.moh.gov.eg',
    national_id: '27003030301234',
    role: 'sector_head',
    role_title_ar: 'رئيس قطاع الرعاية الصحية وتنمية الأسرة',
  },
  {
    id: 'user-central-admin',
    full_name: 'د. خالد عبد السميع عمران',
    email: 'central.admin@masar.moh.gov.eg',
    national_id: '27203030301234',
    role: 'central_admin',
    role_title_ar: 'رئيس الإدارة المركزية لتنظيم الأسرة',
  },
  {
    id: 'user-ministry-general-director',
    full_name: 'د. دعاء علي محمد',
    email: 'gen.dir.fp@masar.moh.gov.eg',
    national_id: '27504040401234',
    role: 'general_director',
    role_title_ar: 'مدير عام الإدارة العامة لتنظيم الأسرة',
  },
  {
    id: 'user-directorate-cairo',
    full_name: 'د. مروة عبد الرحمن السيد',
    email: 'dir.cairo@masar.moh.gov.eg',
    national_id: '27802020201234',
    role: 'directorate_user',
    role_title_ar: 'مدير إدارة تنظيم الأسرة بمديرية القاهرة',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
  },
  {
    id: 'user-directorate-alex',
    full_name: 'د. إيمان رفعت سلامة',
    email: 'dir.alex@masar.moh.gov.eg',
    national_id: '27802020205678',
    role: 'directorate_user',
    role_title_ar: 'مدير إدارة تنظيم الأسرة بمديرية الإسكندرية',
    governorate_id: 'gov-alex',
    governorate_name_ar: 'الإسكندرية',
  },
  {
    id: 'user-district-cairo-nasr',
    full_name: 'د. أسامة محمود الشريف',
    email: 'dist.nasr.cairo@masar.moh.gov.eg',
    national_id: '28501010101234',
    role: 'district_user',
    role_title_ar: 'مسؤول تنظيم الأسرة بإدارة مدينة نصر',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
    district_id: 'dist-cairo-nasr-city',
    district_name_ar: 'إدارة مدينة نصر الطبية',
  },
  {
    id: 'user-district-alex-west',
    full_name: 'د. أحمد سامي الجندي',
    email: 'dist.west.alex@masar.moh.gov.eg',
    national_id: '28501010105678',
    role: 'district_user',
    role_title_ar: 'مسؤول تنظيم الأسرة بإدارة وسط الإسكندرية',
    governorate_id: 'gov-alex',
    governorate_name_ar: 'الإسكندرية',
    district_id: 'dist-alex-west',
    district_name_ar: 'إدارة وسط الإسكندرية الطبية',
  }
];

const AUTH_STORAGE_KEY = 'masar_authenticated_user_v1';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // استعادة الجلسة عند بدء التشغيل
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Failed to load user session', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // تسجيل الدخول بالرقم القومي (14 رقماً) أو البريد الإلكتروني
  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim();

    if (!cleanId || !password) {
      return { success: false, error: 'يرجى إدخال الرقم القومي / البريد وكلمة المرور' };
    }

    // 1. محاولة تسجيل الدخول عبر Supabase Auth إذا كانت قاعدة البيانات مهيأة
    if (isSupabaseConfigured && supabase) {
      try {
        const isEmail = cleanId.includes('@');
        const emailToUse = isEmail ? cleanId : `${cleanId}@masar.gov.eg`;
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: password,
        });

        if (data?.user && !error) {
          // جلب بيانات الملف الشخصي من جدول profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            const mappedUser: UserProfile = {
              id: profile.id,
              full_name: profile.full_name,
              national_id: profile.national_id,
              role: profile.role,
              role_title_ar: getRoleTitle(profile.role),
              governorate_id: profile.governorate_id,
              district_id: profile.district_id,
            };
            setUser(mappedUser);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mappedUser));
            return { success: true };
          }
        }
      } catch (err) {
        console.warn('Supabase auth attempt failed, checking official directory...', err);
      }
    }

    // 2. التحقق من الدليل الحكومي التأسيسي للحسابات الرسمية
    const cleanLower = cleanId.toLowerCase();
    const matchedAccount = INITIAL_OFFICIAL_ACCOUNTS.find(acc => {
      const nationalIdMatch = acc.national_id === cleanId;
      const emailExactMatch = acc.email?.toLowerCase() === cleanLower;
      const emailUsernameMatch = acc.email?.toLowerCase().split('@')[0] === cleanLower;
      const emailPrefix = acc.role.replace('_', '');
      const roleMatch = cleanLower.startsWith(emailPrefix);
      return nationalIdMatch || emailExactMatch || emailUsernameMatch || roleMatch || cleanId === acc.id;
    });

    if (matchedAccount) {
      // كلمة المرور الافتراضية للحسابات التأسيسية
      if (password === 'Masar@2026' || password === '123456' || password === 'admin') {
        setUser(matchedAccount);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedAccount));
        return { success: true };
      } else {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
      }
    }

    return { 
      success: false, 
      error: 'بيانات الاعتماد غير مسجلة بالدليل الحكومي. يرجى مراجعة إدارة تكنولوجيا المعلومات بالوزارة.' 
    };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Sign out error', err);
      }
    }
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

function getRoleTitle(role: UserRole): string {
  switch (role) {
    case 'district_user': return 'مسؤول تنظيم الأسرة بالإدارة الصحية';
    case 'directorate_user': return 'مدير إدارة تنظيم الأسرة بالمديرية';
    case 'general_director': return 'مدير عام الإدارة العامة لتنظيم الأسرة';
    case 'central_admin': return 'رئيس الإدارة المركزية';
    case 'sector_head': return 'رئيس قطاع الرعاية الصحية وتنمية الأسرة';
    case 'super_admin': return 'مدير عام البوابة والأنظمة الرقمية السيادية';
    default: return 'مستخدم المنظومة';
  }
}
