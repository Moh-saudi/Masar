'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Headphones, 
  Phone, 
  Mail, 
  X, 
  Shield
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true); // مفعل افتراضياً
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [supportModalTitle, setSupportModalTitle] = useState<string>('الدعم الفني وتغيير كلمة السر');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(identifier.trim(), password);
      if (!result.success) {
        setError(result.error || 'تعذر تسجيل الدخول. تحقق من بيانات الاعتماد وحاول مرة أخرى.');
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر تسجيل الدخول. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (accIdentifier: string) => {
    setIdentifier(accIdentifier);
    setPassword('');
    setError(null);
  };

  const handleOpenPasswordResetModal = () => {
    setSupportModalTitle('طلب تغيير / إعادة تعيين كلمة السر');
    setShowSupportModal(true);
  };

  const handleOpenGeneralSupportModal = () => {
    setSupportModalTitle('الدعم الفني المركزي لمنظومة «مَسَار»');
    setShowSupportModal(true);
  };

  return (
    <div className="min-h-screen bg-[#edf1f5] font-arabic text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 relative">
      
      {/* البطاقة الرئيسية العائمة المطابقة تماماً لنموذج التصميم المطلوب */}
      <div className="max-w-[960px] w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* ============================================================ */}
        {/* 1. القسم الأيمن (اللوحة الخضراء الداكنة الفاخرة ذات الشعار والعناوين) */}
        {/* ============================================================ */}
        <div className="w-full md:w-[48%] bg-gradient-to-b from-[#06292b] via-[#052224] to-[#03191a] p-8 md:p-10 flex flex-col justify-between items-center text-center relative overflow-hidden text-white">
          
          {/* خلفية جمالية طبية ناعمة */}
          <div className="absolute inset-0 bg-[radial-gradient(#0f4a4d_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* البادج العلوي */}
          <div className="relative z-10">
            <span className="inline-block text-[11px] sm:text-xs text-white/90 bg-white/10 px-4 py-1 rounded-full border border-white/15 font-medium shadow-xs">
              جمهورية مصر العربية • وزارة الصحة والسكان
            </span>
          </div>

          {/* الكتلة المركزية: شعار الوزارة والعناوين */}
          <div className="relative z-10 my-8 md:my-auto space-y-4 max-w-sm">
            
            {/* الشعار الوطني بإطار ذهبي أنيق */}
            <div className="inline-block">
              <div className="w-20 h-20 sm:w-22 sm:h-22 bg-[#0a3538]/90 border border-amber-400/50 rounded-2xl p-2.5 shadow-xl flex items-center justify-center mx-auto">
                <Image
                  src="/logo.png"
                  alt="شعار وزارة الصحة والسكان"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* العنوان الرئيسي */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-wide">
                قطاع الرعاية الصحية وتنمية الأسرة
              </h1>
              <div className="text-sm sm:text-base font-bold text-teal-200">
                منظومة «مَسَار» — الإدارة المركزية لتنظيم الأسرة
              </div>
            </div>

            {/* بادج المنظومة الرقمية */}
            <div className="pt-2">
              <span className="inline-block border border-teal-500/40 bg-teal-900/40 text-teal-200 text-[11px] sm:text-xs px-4 py-1.5 rounded-full font-medium shadow-xs">
                المنظومة الرقمية القومية لخدمات تنظيم الأسرة وصحة المرأة
              </span>
            </div>

          </div>

          {/* تذييل القسم الأيمن */}
          <div className="relative z-10 text-[10px] text-teal-300/60 font-mono">
            نظام رصد قومي سيادي موحد • MOHP-MASAR
          </div>

        </div>

        {/* ============================================================ */}
        {/* 2. القسم الأيسر (الفورم الأبيض النقي المريح للعين) */}
        {/* ============================================================ */}
        <div className="w-full md:w-[52%] bg-white p-7 sm:p-9 md:p-10 flex flex-col justify-between">
          
          <div>
            {/* الشريط العلوي في الفورم مطابق للصورة بدون أي أزرار مكررة */}
            <div className="flex items-center justify-between">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#e6f4f1] text-[#0d7a70] border border-[#b2e2d9]">
                بوابة الدخول الموحدة
              </span>
              <span className="text-xs text-slate-400 font-medium">
                نظام رسمي مؤمن
              </span>
            </div>

            {/* عنوان الفورم والوصف */}
            <div className="mt-5 mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                تسجيل الدخول للمنظومة
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                أدخل البريد الإلكتروني وكلمة المرور المسجلة بسجلات المنظومة
              </p>
            </div>

            {/* تنبيه حالة التطوير والدعم الفني */}
            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in leading-relaxed shadow-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950">تنبيه النظام:</div>
                  <div className="text-[12px] text-amber-900 mt-0.5">{error}</div>
                </div>
              </div>
            )}

            {/* فورم تسجيل الدخول */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* حقل البريد الإلكتروني */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                  البريد الإلكتروني المعتمد
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@moh.gov.eg"
                    dir="ltr"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 font-medium text-left placeholder:text-slate-300 focus:outline-none focus:border-[#0d7a70] focus:ring-1 focus:ring-[#0d7a70] transition"
                  />
                </div>
              </div>

              {/* حقل كلمة المرور */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    dir="ltr"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-3.5 py-2.5 pl-10 font-medium text-left placeholder:text-slate-300 focus:outline-none focus:border-[#0d7a70] focus:ring-1 focus:ring-[#0d7a70] transition"
                  />
                  {/* زر إظهار وإخفاء كلمة المرور */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* سطر: تذكرني على هذا الجهاز + نسيت كلمة المرور / الدعم الفني */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0d7a70] accent-[#0d7a70] focus:ring-[#0d7a70] cursor-pointer"
                  />
                  <span>تذكرني على هذا الجهاز</span>
                </label>

                <button
                  type="button"
                  onClick={handleOpenPasswordResetModal}
                  className="text-[#0d7a70] hover:text-[#0a5c54] font-bold hover:underline transition cursor-pointer flex items-center gap-1"
                >
                  <span>نسيت كلمة المرور؟ الدعم الفني</span>
                  <Headphones className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* زر الدخول الرئيسي */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0d7a70] hover:bg-[#0b655d] text-white font-bold text-sm transition shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>دخول المنظومة</span>
                  )}
                </button>
              </div>

            </form>

            {/* صندوق التأمين والتحذير الحكومي الرسمي */}
            <div className="mt-5 p-3.5 rounded-2xl bg-[#f4faf9] border border-[#ccebe5] flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-white text-[#0d7a70] border border-[#b8e4dc] shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">
                  منظومة حكومية رسمية مشفرة
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  الدخول مقصور على السادة الأعضاء والموظفين المصرح لهم رسمياً. كافة محاولات الدخول وأنشطة المستخدمين مسجلة ومراقبة أمنياً.
                </p>
              </div>
            </div>

          </div>

          {/* التذييل السفلي في بطاقة الفورم */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>منظومة إلكترونية موحدة ومؤمنة</span>
            <span className="font-mono">الإصدار 2.4</span>
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. شريط الحسابات التجريبية السريعة (مكتوبة تحت في الأسفل كما هي) */}
      {/* ============================================================ */}
      <div className="mt-5 max-w-[960px] w-full px-2 text-xs flex flex-wrap items-center justify-center gap-2">
        <span className="text-slate-500 font-bold ml-1">
          تسجيل دخول سريع للتجربة:
        </span>
        
        <button
          type="button"
          onClick={() => handleSelectQuickAccount('superadmin@masar.moh.gov.eg')}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0d7a70] hover:text-[#0d7a70] transition font-medium shadow-2xs"
        >
          السوبر أدمن
        </button>

        <button
          type="button"
          onClick={() => handleSelectQuickAccount('minister.office@masar.moh.gov.eg')}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0d7a70] hover:text-[#0d7a70] transition font-medium shadow-2xs"
        >
          رئيس القطاع
        </button>

        <button
          type="button"
          onClick={() => handleSelectQuickAccount('central.admin@masar.moh.gov.eg')}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0d7a70] hover:text-[#0d7a70] transition font-medium shadow-2xs"
        >
          رئيس الإدارة المركزية
        </button>

        <button
          type="button"
          onClick={() => handleSelectQuickAccount('gen.dir.fp@masar.moh.gov.eg')}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0d7a70] hover:text-[#0d7a70] transition font-medium shadow-2xs"
        >
          مدير عام تنظيم الأسرة
        </button>

        <button
          type="button"
          onClick={() => handleSelectQuickAccount('dir.cairo@masar.moh.gov.eg')}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0d7a70] hover:text-[#0d7a70] transition font-medium shadow-2xs"
        >
          مديرية القاهرة
        </button>

        <button
          type="button"
          onClick={() => handleSelectQuickAccount('dist.nasr.cairo@masar.moh.gov.eg')}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-[#0d7a70] hover:text-[#0d7a70] transition font-medium shadow-2xs"
        >
          إدارة مدينة نصر
        </button>
      </div>

      {/* ============================================================ */}
      {/* 4. نافذة بوب اب الدعم الفني وتغيير كلمة السر (بألوان فاتحة ومريحة) */}
      {/* ============================================================ */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-4 animate-in zoom-in-95">
            
            {/* زر الإغلاق */}
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute left-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-[#e6f4f1] text-[#0d7a70] flex items-center justify-center border border-[#b2e2d9]">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {supportModalTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  الإدارة العامة للتحول الرقمي والدعم الفني — ديوان عام الوزارة
                </p>
              </div>
            </div>

            {/* إرشادات أمنية */}
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#0d7a70]">
                <Shield className="w-4 h-4" />
                <span>إجراءات الأمان وإعادة تعيين الحساب:</span>
              </div>
              <p className="text-[11px] text-teal-800">
                حفاظاً على سرية البيانات القومية، يتم إعادة تعيين كلمات المرور حصراً عبر مسؤول النظام المركزي (Super Admin) أو مدير الدعم الفني بالمديرية بعد التحقق من بطاقة الرقم القومي.
              </p>
            </div>

            {/* قنوات التواصل الرسمية */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">الخط الساخن لوزارة الصحة:</span>
                </div>
                <span className="font-mono text-sm font-black text-emerald-700">15335</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#0d7a70]" />
                  <span className="font-bold text-slate-800">هاتف غرفة الدعم المركزي:</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-700 dir-ltr">02-27921000 (داخلي: 2026)</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">البريد الإلكتروني:</span>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-700">support@masar.moh.gov.eg</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
