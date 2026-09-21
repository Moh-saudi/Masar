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
  X,
  LockKeyhole,
  UserRound,
  Landmark
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center p-4 sm:p-6 font-arabic">
      <div className="w-full max-w-[1080px] grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] bg-white border border-[#dfe6ee] rounded-[26px] overflow-hidden shadow-[0_24px_70px_rgba(23,32,51,0.10)]">

        <section className="relative bg-[#f7fafb] border-b lg:border-b-0 lg:border-l border-[#e3e9ef] p-7 sm:p-9 lg:p-10 flex flex-col justify-between min-h-[290px] lg:min-h-[620px]">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-14">
                <Image
                  src="/logo.png"
                  alt="شعار وزارة الصحة والسكان"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500">جمهورية مصر العربية</p>
                <h1 className="text-sm font-extrabold text-[#172033] mt-0.5">وزارة الصحة والسكان</h1>
              </div>
            </div>

            <div className="mt-10 lg:mt-16">
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#eaf9f7] border border-[#ccebe7] text-[#087f78] text-[10px] font-extrabold">
                <Landmark className="w-3.5 h-3.5" />
                قطاع الرعاية الصحية وتنمية الأسرة
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] mt-5 leading-[1.35]">
                منظومة «مَسَار»
              </h2>

              <p className="text-sm text-slate-500 leading-7 mt-3 max-w-md">
                المنظومة الرقمية لتجميع وتحليل بيانات تنمية الأسرة، وربط مستويات الإدارة الصحية والمديرية وديوان عام الوزارة في مسار عمل موحد.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="rounded-xl bg-white border border-[#e2e8ee] p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#eef9f7] text-[#087f78] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-[#172033]">صلاحيات مؤسسية</div>
                <p className="text-[9px] text-slate-500 leading-5 mt-0.5">الوصول للبيانات والإجراءات مرتبط بدور المستخدم ونطاقه الإداري.</p>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#e2e8ee] p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f3f6f8] text-slate-600 flex items-center justify-center">
                <LockKeyhole className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-[#172033]">جلسات مؤمنة</div>
                <p className="text-[9px] text-slate-500 leading-5 mt-0.5">تسجيل الدخول وإدارة الجلسات عبر نظام المصادقة المركزي.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="p-7 sm:p-9 lg:p-12 flex flex-col justify-center">
          <div className="max-w-[430px] w-full mx-auto">
            <div className="mb-7">
              <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#f3f6f8] border border-[#e1e7ed] text-[9px] font-extrabold text-slate-500">
                بوابة الدخول الموحدة
              </span>
              <h2 className="text-2xl font-extrabold text-[#172033] mt-4">تسجيل الدخول</h2>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-6">
                استخدم بيانات الحساب المعتمدة للوصول إلى نطاق العمل الخاص بك.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-rose-800 leading-5">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="block text-[10px] font-extrabold text-slate-700 mb-1.5">البريد الإلكتروني أو اسم المستخدم</span>
                <div className="relative">
                  <UserRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="أدخل بيانات الحساب"
                    className="gov-input h-12 pr-10 pl-3 text-sm"
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-[10px] font-extrabold text-slate-700 mb-1.5">كلمة المرور</span>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="gov-input h-12 pr-10 pl-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between gap-3 text-[10px]">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="accent-[#087f78]"
                  />
                  تذكرني على هذا الجهاز
                </label>

                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="font-extrabold text-[#087f78] hover:underline"
                >
                  مساعدة في الدخول
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl gov-btn-primary text-sm font-extrabold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    دخول المنظومة
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-[9px] text-slate-400 leading-5">
              الدخول مخصص للمستخدمين المصرح لهم. يتم تطبيق سياسات الصلاحيات وسجل التدقيق على العمليات الحساسة داخل المنظومة.
            </div>
          </div>
        </section>
      </div>

      {showSupportModal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#dfe6ee] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#eaf9f7] text-[#087f78] flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#172033]">الدعم الفني وإعادة تعيين كلمة المرور</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">التواصل مع مسؤول النظام المعتمد</p>
                </div>
              </div>

              <button
                onClick={() => setShowSupportModal(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-xl bg-[#f7fafb] border border-[#e2e8ee] p-4">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#087f78] mt-0.5" />
                  <p className="text-[10px] text-slate-600 leading-6">
                    لإعادة تعيين كلمة المرور أو استعادة الحساب، تواصل مع مسؤول النظام أو الدعم الفني المعتمد في الجهة التابعة لك حتى يتم التحقق من الهوية والنطاق الإداري.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSupportModal(false)}
                className="w-full h-10 rounded-xl gov-btn-secondary text-[10px] font-extrabold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
