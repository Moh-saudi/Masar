'use client';

import React, { useState, useMemo } from 'react';
import { UserProfile, UserRole } from '@/lib/types';
import { SAMPLE_GOVERNORATES } from '@/lib/constants';
import {
  UserPlus,
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Building2,
  MapPin,
  RefreshCw,
  AlertCircle,
  Globe
} from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: UserProfile) => void;
}

const ROLE_OPTIONS: Array<{ role: UserRole; titleAr: string; levelAr: string }> = [
  { role: 'district_user', titleAr: 'مسؤول إدخال وتجميع - الإدارة الصحية', levelAr: 'الإدارة الصحية' },
  { role: 'directorate_user', titleAr: 'مسؤول ومراجع مديرية الشئون الصحية', levelAr: 'المديرية' },
  { role: 'general_director', titleAr: 'مدير عام تنمية الأسرة بديوان الوزارة', levelAr: 'ديوان الوزارة' },
  { role: 'central_admin', titleAr: 'رئيس الإدارة المركزية لتنظيم الأسرة', levelAr: 'ديوان الوزارة' },
  { role: 'sector_head', titleAr: 'رئيس قطاع الرعاية الصحية وتنمية الأسرة', levelAr: 'قيادة القطاع' },
  { role: 'super_admin', titleAr: 'مسؤول النظام العام وتكنولوجيا المعلومات', levelAr: 'الإدارة العامة للنظم' },
];

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [role, setRole] = useState<UserRole>('district_user');
  const [roleTitleAr, setRoleTitleAr] = useState('مسؤول إدخال وتجميع - الإدارة الصحية');
  const [governorateId, setGovernorateId] = useState(SAMPLE_GOVERNORATES[0]?.id || 'gov-01');
  const [districtId, setDistrictId] = useState(SAMPLE_GOVERNORATES[0]?.districts?.[0]?.id || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Masar@2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success view state
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    username: string;
    email: string;
    password: string;
    roleTitleAr: string;
    scopeAr: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');

  // Dynamically initialize loginUrl from env or current window origin
  React.useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl) {
      setLoginUrl(envUrl.replace(/\/$/, ''));
    } else if (typeof window !== 'undefined' && window.location) {
      setLoginUrl(window.location.origin);
    }
  }, []);

  // Available districts for the chosen governorate
  const currentGov = useMemo(() => {
    return SAMPLE_GOVERNORATES.find(g => g.id === governorateId) || SAMPLE_GOVERNORATES[0];
  }, [governorateId]);

  const currentDistrict = useMemo(() => {
    return currentGov.districts?.find(d => d.id === districtId) || currentGov.districts?.[0];
  }, [currentGov, districtId]);

  if (!isOpen) return null;

  // Handle Role Change
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

  // Generate a random strong password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = 'Masar@';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '2026';
    setPassword(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('الرجاء كتابة اسم الموظف بالكامل.');
      return;
    }

    if (!username.trim()) {
      setError('الرجاء تحديد اسم المستخدم أو البريد الإلكتروني.');
      return;
    }

    if (!password.trim()) {
      setError('الرجاء تحديد كلمة المرور الأولية.');
      return;
    }

    setIsSubmitting(true);

    try {
      const scopeGovName = (role === 'district_user' || role === 'directorate_user') ? currentGov.name_ar : null;
      const scopeGovId = (role === 'district_user' || role === 'directorate_user') ? currentGov.id : null;
      const scopeDistName = role === 'district_user' ? currentDistrict?.name_ar : null;
      const scopeDistId = role === 'district_user' ? currentDistrict?.id : null;

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          nationalId: nationalId.trim() || undefined,
          identifier: username.trim(),
          password: password.trim(),
          role,
          roleTitleAr: roleTitleAr.trim(),
          governorateId: scopeGovId,
          governorateNameAr: scopeGovName,
          districtId: scopeDistId,
          districtNameAr: scopeDistName,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'تعذر إنشاء الحساب');
      }

      onUserCreated(data.profile);

      const scopeText = role === 'district_user'
        ? `${currentDistrict?.name_ar || ''} — محافظة ${currentGov.name_ar}`
        : role === 'directorate_user'
          ? `محافظة ${currentGov.name_ar}`
          : 'ديوان عام وزارة الصحة والسكان';

      setCreatedCredentials({
        fullName: fullName.trim(),
        username: data.credentials.username,
        email: data.credentials.email,
        password: password.trim(),
        roleTitleAr: roleTitleAr.trim(),
        scopeAr: scopeText,
      });

      if (data.credentials?.loginUrl) {
        setLoginUrl(data.credentials.loginUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء المستخدم');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy official credential delivery slip
  const handleCopyCredentials = () => {
    if (!createdCredentials) return;

    const message = `جمهورية مصر العربية
وزارة الصحة والسكان — قطاع الرعاية وتنمية الأسرة
منظومة «مَسَار» الرقمية لإدارة بيانات تنمية الأسرة
----------------------------------------------
بيانات اعتماد الحساب الرسمي:
• الاسم: ${createdCredentials.fullName}
• المسمى الوظيفي: ${createdCredentials.roleTitleAr}
• النطاق الإداري: ${createdCredentials.scopeAr}
• اسم المستخدم: ${createdCredentials.username}
• البريد الإلكتروني: ${createdCredentials.email}
• كلمة المرور الأولية: ${createdCredentials.password}
• رابط الدخول للمنظومة: ${loginUrl || (typeof window !== 'undefined' ? window.location.origin : '')}
----------------------------------------------
تنبيه أمني: يتعين تسجيل الدخول وتغيير كلمة المرور فوراً لضمان السرية والمسؤولية الإدارية.`;

    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-[#dfe6ee] rounded-2xl max-w-xl w-full overflow-hidden shadow-[0_20px_60px_rgba(23,32,51,0.16)] flex flex-col my-8">
        
        {/* Top Gradient Identity Line */}
        <div className="h-1.5 bg-gradient-to-l from-[#087f78] via-[#56aaa5] to-[#18334f]" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-white to-[#fbfcfd]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eaf9f7] border border-[#ccebe7] text-[#087f78] flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#172033]">
                {createdCredentials ? 'بطاقة تسليم بيانات الدخول الرسمية' : 'إضافة مستخدم جديد واعتماد الصلاحيات'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                منظومة «مَسَار» — إدارة الحسابات والرقابة الرقمية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 2: CREDENTIALS DELIVERY VOUCHER */}
        {createdCredentials ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold">تم إنشاء الحساب واعتماده بنجاح</h4>
                <p className="text-[11px] text-emerald-700 mt-1 leading-5">
                  تم تسجيل الحساب في قاعدة البيانات ونظام المصادقة. يمكنك الآن تسليم بيانات الاعتماد للموظف عبر القنوات الرسمية.
                </p>
              </div>
            </div>

            {/* Credential Slip Card */}
            <div className="rounded-2xl border-2 border-slate-200 p-5 bg-[#fafcfd] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-[11px] font-extrabold text-[#172033]">بطاقة اعتماد مستخدم منظومة مسار</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-[#eaf9f7] text-[#087f78] font-bold border border-[#ccebe7]">
                  وثيقة تسليم رسمية
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 mb-0.5">اسم الموظف:</span>
                  <span className="font-extrabold text-[#172033]">{createdCredentials.fullName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 mb-0.5">الدور الوظيفي:</span>
                  <span className="font-bold text-slate-700">{createdCredentials.roleTitleAr}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-slate-400 mb-0.5">النطاق الإداري:</span>
                  <span className="font-bold text-slate-700">{createdCredentials.scopeAr}</span>
                </div>
              </div>

              {/* Login Fields */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">اسم المستخدم:</span>
                  <span className="font-mono text-xs font-extrabold text-[#087f78] select-all">
                    {createdCredentials.username}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">البريد الإلكتروني:</span>
                  <span className="font-mono text-[11px] text-slate-700 select-all">
                    {createdCredentials.email}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-[10px] text-slate-500 font-bold">كلمة المرور الأولية:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-600 select-all">
                      {showPassword ? createdCredentials.password : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-[#087f78]" />
                      رابط الدخول للمنظومة:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined') setLoginUrl(window.location.origin);
                        }}
                        className="text-[9px] text-[#087f78] hover:underline px-1.5 py-0.5 rounded bg-[#eaf9f7] font-bold"
                        title="استخدام رابط المتصفح الحالي"
                      >
                        الرابط الحالي
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginUrl('https://masar.gov.eg')}
                        className="text-[9px] text-slate-600 hover:underline px-1.5 py-0.5 rounded bg-slate-100 font-bold"
                        title="استخدام النطاق الحكومي الرسمي"
                      >
                        النطاق الرسمي
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={loginUrl}
                    onChange={e => setLoginUrl(e.target.value)}
                    dir="ltr"
                    placeholder="https://masar.gov.eg"
                    className="gov-input h-8 px-2.5 text-[11px] font-mono text-slate-800 w-full bg-slate-50/70 border-slate-200"
                  />
                  <p className="text-[9px] text-slate-400 leading-4">
                    رابط ديناميكي يطابق النطاق الفعلي للمنظومة تلقائياً، ويمكنك تعديله قبل النسخ عند الحاجة.
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-5">
                تنبيه أمني: يُلزم الموظف بتغيير كلمة المرور فور تسجيل الدخول الأول، وتعتبر البيانات مسؤولية شخصية للمستخدم.
              </div>
            </div>

            {/* Delivery Action Buttons */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-extrabold text-[#172033]">طرق إرسال وتسليم بيانات الدخول للموظف:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="h-10 px-4 rounded-xl bg-[#087f78] hover:bg-[#066963] text-white text-[11px] font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'تم النسخ للحافظة!' : 'نسخ رسالة الاعتماد للواتساب'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="h-10 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة بطاقة الاستلام والتسليم</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-6 rounded-xl gov-btn-secondary text-[11px] font-extrabold"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: USER FORM */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name & National ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-[#172033] mb-1.5">
                  اسم الموظف بالكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. حسام محمد فتحي"
                  value={fullName}
                  onChange={e => {
                    setFullName(e.target.value);
                    if (!username) {
                      // Suggest username from english transliteration or role
                    }
                  }}
                  className="gov-input h-10 px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#172033] mb-1.5">
                  الرقم القومي (اختياري)
                </label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="14 رقماً"
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value.replace(/\D/g, ''))}
                  className="gov-input h-10 px-3 text-xs font-mono"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#172033] mb-1.5">
                الدور الوظيفي والصلاحية <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={e => handleRoleChange(e.target.value as UserRole)}
                className="gov-input h-10 px-3 text-xs"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.role} value={opt.role}>
                    {opt.titleAr} ({opt.levelAr})
                  </option>
                ))}
              </select>
            </div>

            {/* Scope (Governorate & District) */}
            {(role === 'district_user' || role === 'directorate_user') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#087f78]" />
                    المحافظة التابع لها
                  </label>
                  <select
                    value={governorateId}
                    onChange={e => {
                      const newGovId = e.target.value;
                      setGovernorateId(newGovId);
                      const g = SAMPLE_GOVERNORATES.find(gov => gov.id === newGovId);
                      if (g && g.districts?.[0]) {
                        setDistrictId(g.districts[0].id);
                        if (role === 'district_user') {
                          setRoleTitleAr(`مسؤول إدخال البيانات - ${g.districts[0].name_ar}`);
                        } else {
                          setRoleTitleAr(`مسؤول ومراجع مديرية الشئون الصحية ب${g.name_ar}`);
                        }
                      }
                    }}
                    className="gov-input h-9 px-2.5 text-xs bg-white"
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
                    <label className="block text-[10px] font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#087f78]" />
                      الإدارة الصحية
                    </label>
                    <select
                      value={districtId}
                      onChange={e => {
                        const newDistId = e.target.value;
                        setDistrictId(newDistId);
                        const d = currentGov.districts?.find(dist => dist.id === newDistId);
                        if (d) {
                          setRoleTitleAr(`مسؤول إدخال البيانات - ${d.name_ar}`);
                        }
                      }}
                      className="gov-input h-9 px-2.5 text-xs bg-white"
                    >
                      {currentGov.districts?.map(dist => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Custom Role Title */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#172033] mb-1.5">
                المسمى الوظيفي في بطاقة الحساب
              </label>
              <input
                type="text"
                required
                value={roleTitleAr}
                onChange={e => setRoleTitleAr(e.target.value)}
                className="gov-input h-10 px-3 text-xs"
              />
            </div>

            {/* Username / Email & Initial Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-extrabold text-[#172033] mb-1.5">
                  اسم الدخول (Username) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="مثال: district.helwan"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="gov-input h-10 pr-3 pl-2 text-xs font-mono"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  البريد: {username ? `${username}@masar.gov.eg` : 'username@masar.gov.eg'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold text-[#172033]">
                    كلمة المرور الأولية <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-[#087f78] font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    توليد عشوائي
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="gov-input h-10 px-3 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  الافتراضية: <code className="font-bold text-slate-600">Masar@2026</code>
                </p>
              </div>
            </div>

            {/* Footer Form Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl gov-btn-secondary text-[11px] font-extrabold disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl bg-[#087f78] hover:bg-[#066963] text-white text-[11px] font-extrabold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>{isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب وتوليد الاعتماد'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
