'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserRole } from '@/lib/types';
import { SAMPLE_GOVERNORATES } from '@/lib/constants';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  Pencil,
  X,
  ShieldCheck,
  Building2,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  CreditCard
} from 'lucide-react';

import type { AdminUser } from './AdminUsersPortal';

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: AdminUser) => void;
}

const ROLE_OPTIONS: Array<{ role: UserRole; titleAr: string; levelAr: string }> = [
  { role: 'district_user', titleAr: 'مسؤول إدخال وتجميع - الإدارة الصحية', levelAr: 'الإدارة الصحية' },
  { role: 'directorate_user', titleAr: 'مسؤول ومراجع مديرية الشئون الصحية', levelAr: 'المديرية' },
  { role: 'general_director', titleAr: 'مدير عام تنمية الأسرة بديوان الوزارة', levelAr: 'ديوان الوزارة' },
  { role: 'central_admin', titleAr: 'رئيس الإدارة المركزية لتنظيم الأسرة', levelAr: 'ديوان الوزارة' },
  { role: 'sector_head', titleAr: 'رئيس قطاع الرعاية الصحية وتنمية الأسرة', levelAr: 'قيادة القطاع' },
  { role: 'super_admin', titleAr: 'مسؤول النظام العام وتكنولوجيا المعلومات', levelAr: 'الإدارة العامة للنظم' },
];

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('district_user');
  const [roleTitleAr, setRoleTitleAr] = useState('');
  const [governorateId, setGovernorateId] = useState(SAMPLE_GOVERNORATES[0]?.id || 'gov-01');
  const [districtId, setDistrictId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state when user prop changes
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setNationalId(user.national_id || '');
      setEmail(user.email || '');
      setRole(user.role || 'district_user');
      setRoleTitleAr(user.role_title_ar || '');
      
      const matchedGov = SAMPLE_GOVERNORATES.find(
        g => g.id === user.governorate_id || g.name_ar === user.governorate_name_ar
      );
      if (matchedGov) {
        setGovernorateId(matchedGov.id);
        const matchedDist = matchedGov.districts?.find(
          d => d.id === user.district_id || d.name_ar === user.district_name_ar
        );
        setDistrictId(matchedDist?.id || matchedGov.districts?.[0]?.id || '');
      } else {
        setGovernorateId(SAMPLE_GOVERNORATES[0]?.id || 'gov-01');
        setDistrictId(SAMPLE_GOVERNORATES[0]?.districts?.[0]?.id || '');
      }

      setError(null);
      setSuccess(false);
    }
  }, [user, isOpen]);

  const currentGov = useMemo(() => {
    return SAMPLE_GOVERNORATES.find(g => g.id === governorateId) || SAMPLE_GOVERNORATES[0];
  }, [governorateId]);

  const currentDistrict = useMemo(() => {
    return currentGov?.districts?.find(d => d.id === districtId) || currentGov?.districts?.[0];
  }, [currentGov, districtId]);

  if (!isOpen || !user) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const opt = ROLE_OPTIONS.find(o => o.role === newRole);
    if (opt) {
      if (newRole === 'district_user' && currentDistrict) {
        setRoleTitleAr(`مسؤول إدخال البيانات - ${currentDistrict.name_ar}`);
      } else if (newRole === 'directorate_user' && currentGov) {
        setRoleTitleAr(`مسؤول ومراجع مديرية الشئون الصحية ب${currentGov.name_ar}`);
      } else {
        setRoleTitleAr(opt.titleAr);
      }
    }
  };

  const handleGovChange = (newGovId: string) => {
    setGovernorateId(newGovId);
    const gov = SAMPLE_GOVERNORATES.find(g => g.id === newGovId);
    const firstDist = gov?.districts?.[0];
    if (firstDist) {
      setDistrictId(firstDist.id);
      if (role === 'district_user') {
        setRoleTitleAr(`مسؤول إدخال البيانات - ${firstDist.name_ar}`);
      }
    }
    if (role === 'directorate_user' && gov) {
      setRoleTitleAr(`مسؤول ومراجع مديرية الشئون الصحية ب${gov.name_ar}`);
    }
  };

  const handleDistrictChange = (newDistId: string) => {
    setDistrictId(newDistId);
    const dist = currentGov?.districts?.find(d => d.id === newDistId);
    if (dist && role === 'district_user') {
      setRoleTitleAr(`مسؤول إدخال البيانات - ${dist.name_ar}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('الرجاء كتابة اسم الموظف بالكامل.');
      return;
    }

    if (!email.trim()) {
      setError('الرجاء تحديد البريد الإلكتروني أو اسم المستخدم.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || '';

      const scopeGovName = (role === 'district_user' || role === 'directorate_user') ? currentGov?.name_ar : null;
      const scopeGovId = (role === 'district_user' || role === 'directorate_user') ? currentGov?.id : null;
      const scopeDistName = role === 'district_user' ? currentDistrict?.name_ar : null;
      const scopeDistId = role === 'district_user' ? currentDistrict?.id : null;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update_profile',
          full_name: fullName.trim(),
          national_id: nationalId.trim() || undefined,
          email: email.trim(),
          role,
          role_title_ar: roleTitleAr.trim(),
          governorate_id: scopeGovId,
          governorate_name_ar: scopeGovName,
          district_id: scopeDistId,
          district_name_ar: scopeDistName,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'تعذر تحديث بيانات الحساب.');
      }

      setSuccess(true);
      onUserUpdated(data.profile as AdminUser);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error('Failed to update user', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#dfe6ee] shadow-[0_24px_80px_rgba(23,32,51,0.18)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#fcfdfe] border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eaf9f7] text-[#087f78] border border-[#c2ece6] flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5 text-[#087f78]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">تعديل بيانات الحساب والصلاحيات</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">تحديث النطاق الجغرافي والدور الوظيفي للموظف في المنظومة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-2xl p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-2xl p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>تم تحديث بيانات الحساب والصلاحيات بنجاح!</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-extrabold text-[#172033] flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-3.5 h-3.5 text-[#087f78]" />
              البيانات الشخصية والرقمية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  الاسم الرباعي للموظف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي إبراهيم"
                  className="gov-input h-10 px-3.5 text-xs w-full rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>الرقم القومي (14 رقم)</span>
                  <span className="text-[10px] text-slate-400 font-mono">{nationalId.length}/14</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={14}
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value.replace(/\D/g, ''))}
                    placeholder="14 رقم قومي رسمي"
                    className="gov-input h-10 pr-3.5 pl-9 text-xs w-full rounded-xl font-mono tracking-wider"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني / اسم الدخول <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="username@domain.gov.eg"
                  className="gov-input h-10 pr-3.5 pl-9 text-xs w-full rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Role and Administrative Level */}
          <div className="space-y-3.5 pt-2">
            <h3 className="text-xs font-extrabold text-[#172033] flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#087f78]" />
              المستوى التنظيمي والدور الوظيفي
            </h3>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                الدور الوظيفي المعتمد <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={e => handleRoleChange(e.target.value as UserRole)}
                className="gov-input h-10 px-3 text-xs w-full rounded-xl cursor-pointer"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.role} value={opt.role}>
                    {opt.titleAr} ({opt.levelAr})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                المسمى الوظيفي المخصص بالتقارير
              </label>
              <input
                type="text"
                value={roleTitleAr}
                onChange={e => setRoleTitleAr(e.target.value)}
                placeholder="المسمى العربي الرسمي"
                className="gov-input h-10 px-3.5 text-xs w-full rounded-xl"
              />
            </div>
          </div>

          {/* Section 3: Geographic Scope */}
          {(role === 'district_user' || role === 'directorate_user') && (
            <div className="space-y-3.5 pt-2">
              <h3 className="text-xs font-extrabold text-[#172033] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <MapPin className="w-3.5 h-3.5 text-[#087f78]" />
                النطاق الجغرافي والإشرافي
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    المحافظة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={governorateId}
                    onChange={e => handleGovChange(e.target.value)}
                    className="gov-input h-10 px-3 text-xs w-full rounded-xl cursor-pointer"
                  >
                    {SAMPLE_GOVERNORATES.map(gov => (
                      <option key={gov.id} value={gov.id}>
                        محافظة {gov.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                {role === 'district_user' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      الإدارة الصحية التابعة <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={districtId}
                      onChange={e => handleDistrictChange(e.target.value)}
                      className="gov-input h-10 px-3 text-xs w-full rounded-xl cursor-pointer"
                    >
                      {currentGov?.districts?.map(dist => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 rounded-xl gov-btn-primary text-xs font-extrabold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري حفظ التعديلات...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>اعتماد وحفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
