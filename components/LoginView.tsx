'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth, AuthErrorCode } from '@/lib/auth-context';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  UserRound,
  Landmark,
  Phone,
  AlertTriangle,
  Activity,
  AlertCircle,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import { TechnicalSupportModal, SUPPORT_PHONE, SUPPORT_HOURS } from './TechnicalSupportModal';
import { OfficialFooter } from './OfficialFooter';

type SystemOperationalStatus = 'operational' | 'updating' | 'degraded';

interface ErrorDescriptor {
  title: string;
  message: string;
  tone: 'warning' | 'danger';
}

function getErrorMessage(code: AuthErrorCode): ErrorDescriptor {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return {
        title: 'تعذر تسجيل الدخول',
        message: 'بيانات الدخول غير صحيحة. يرجى مراجعة اسم المستخدم أو البريد الإلكتروني وكلمة المرور والمحاولة مرة أخرى.',
        tone: 'danger',
      };
    case 'ACCOUNT_SUSPENDED':
      return {
        title: 'الحساب موقوف مؤقتًا',
        message: 'هذا الحساب موقوف مؤقتًا بقرار إداري. يرجى مراجعة إدارة النظام المركزية أو التواصل مع الدعم الفني.',
        tone: 'danger',
      };
    case 'ACCOUNT_INACTIVE':
      return {
        title: 'الحساب غير مفعل',
        message: 'الحساب غير مفعل حاليًا للاستخدام. يرجى مراجعة المشرف الإداري المعتمد لتفعيل صلاحيات الدخول.',
        tone: 'warning',
      };
    case 'NETWORK_ERROR':
      return {
        title: 'مشكلة اتصال بالخدمة',
        message: 'تعذر الاتصال بخوادم المنظومة في الوقت الحالي. يرجى التحقق من اتصال الإنترنت، أو إعادة المحاولة بعد قليل.',
        tone: 'warning',
      };
    case 'SESSION_EXPIRED':
      return {
        title: 'انتهاء الجلسة',
        message: 'انتهت صلاحية جلسة العمل السابقة لدواعي الأمان والحوكمة. يرجى إعادة تسجيل الدخول لمتابعة العمل.',
        tone: 'warning',
      };
    case 'RATE_LIMITED':
      return {
        title: 'تم قفل المحاولات مؤقتًا',
        message: 'تم رصد عدة محاولات دخول غير صحيحة متتالية. لدواعي الأمان، تم إيقاف المحاولات لمدة دقيقة واحدة.',
        tone: 'danger',
      };
    case 'SYSTEM_NOT_CONFIGURED':
      return {
        title: 'المنظومة تحت التهيئة',
        message: 'إعدادات المنظومة قيد المراجعة الفنية من قبل مسؤولي النظام. يرجى التواصل مع الدعم الفني.',
        tone: 'warning',
      };
    default:
      return {
        title: 'تعذر تسجيل الدخول',
        message: 'تعذر تسجيل الدخول، يرجى مراجعة بيانات الدخول أو التواصل مع الدعم الفني.',
        tone: 'warning',
      };
  }
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

export const LoginView: React.FC = () => {
  const { login, sessionError, clearSessionError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // System status indicator (defaults to operational)
  const [systemStatus] = useState<SystemOperationalStatus>('operational');

  // Rate Limiting Protection (Brute-force protection)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Sync external session error (e.g. revoked or expired while using system)
  useEffect(() => {
    if (sessionError) {
      setErrorCode(sessionError);
      clearSessionError();
    }
  }, [sessionError, clearSessionError]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    setErrorCode(null);
    setLoading(true);

    try {
      const result = await login(identifier.trim(), password);

      if (!result.success) {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        if (nextFailed >= MAX_FAILED_ATTEMPTS) {
          setLockoutRemaining(LOCKOUT_SECONDS);
          setErrorCode('RATE_LIMITED');
        } else {
          setErrorCode(result.error || 'INVALID_CREDENTIALS');
        }
      } else {
        setFailedAttempts(0);
      }
    } catch {
      setErrorCode('NETWORK_ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySupport = () => {
    navigator.clipboard.writeText(SUPPORT_PHONE);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const errorDetails = errorCode ? getErrorMessage(errorCode) : null;
  const isLocked = lockoutRemaining > 0;

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col justify-between font-arabic selection:bg-[#087f78]/20 selection:text-[#087f78]">
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 w-full">
        <div className="w-full max-w-[1040px] grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] bg-white border border-[#dfe6ee] rounded-3xl overflow-hidden shadow-[0_24px_70px_rgba(23,32,51,0.09)]">

        {/* ================= RIGHT PANEL: OFFICIAL SOVEREIGN IDENTITY ================= */}
        <section className="relative bg-[#f8fafc] border-b lg:border-b-0 lg:border-l border-[#e2e8ee] p-7 sm:p-9 lg:p-11 flex flex-col justify-between min-h-[300px] lg:min-h-[640px]">
          <div>
            {/* Header: Republic & Ministry */}
            <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-14 flex-shrink-0">
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
                <p className="text-[10px] font-bold text-slate-500 tracking-wide">جمهورية مصر العربية</p>
                <h1 className="text-sm font-extrabold text-[#172033] mt-0.5">وزارة الصحة والسكان</h1>
                <p className="text-[10px] text-[#087f78] font-bold mt-0.5">قطاع الرعاية الصحية وتنمية الأسرة</p>
              </div>
            </div>

            {/* Platform Branding */}
            <div className="mt-8 lg:mt-14">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#eaf9f7] border border-[#c4ebe6] text-[#087f78] text-[10px] font-extrabold">
                <Landmark className="w-3.5 h-3.5" />
                المنظومة الرقمية القومية
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] mt-4 leading-tight">
                منظومة «مَسَار»
              </h2>

              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mt-3 max-w-md">
                المنصة الموحدة لإدارة ومتابعة مؤشرات الرعاية الصحية وتنمية الأسرة وربط الوحدات والمراكز والإدارات الصحية ومديريات الشئون الصحية بديوان عام الوزارة.
              </p>
            </div>
          </div>

          {/* System Status & Institutional Trust Badge */}
          <div className="mt-8 space-y-3">
            {/* Live Operational Status Indicator */}
            <div className="rounded-2xl bg-white border border-[#e2e8ee] p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#087f78]" />
                  حالة المنظومة
                </span>

                {systemStatus === 'operational' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    المنظومة تعمل بكفاءة
                  </span>
                )}
                {systemStatus === 'updating' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    تحديثات تشغيلية مجدولة
                  </span>
                )}
                {systemStatus === 'degraded' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    عطل مؤقت تحت المعالجة
                  </span>
                )}
              </div>
            </div>

            {/* Quick Tech Support Bar */}
            <div className="rounded-2xl bg-[#eef8f7] border border-[#cbebe7] p-3 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#087f78]" />
                <span className="font-extrabold text-[#172033]">الدعم الفني:</span>
                <span dir="ltr" className="font-mono font-bold text-[#087f78]">{SUPPORT_PHONE}</span>
              </div>
              <button
                type="button"
                onClick={handleCopySupport}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#cbebe7] hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex items-center gap-1 transition"
                title="نسخ رقم الدعم الفني"
              >
                {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedPhone ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= LEFT PANEL: LOGIN FORM ================= */}
        <section className="p-7 sm:p-9 lg:p-12 flex flex-col justify-center">
          <div className="max-w-[400px] w-full mx-auto">
            <div className="mb-6">
              <span className="inline-flex px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                بوابة الدخول الموحدة
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-2">تسجيل الدخول</h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                استخدم بيانات الحساب الرسمية المعتمدة للوصول إلى نطاق عملك.
              </p>
            </div>

            {/* Clear, Non-Technical Arabic Error Notice */}
            {errorDetails && (
              <div className={`mb-4 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-150 ${
                errorDetails.tone === 'danger'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                {errorDetails.tone === 'danger' ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 text-right">
                  <div className="text-xs font-extrabold leading-snug">{errorDetails.title}</div>
                  <div className="text-[10px] sm:text-[11px] mt-1 leading-relaxed opacity-90">
                    {errorDetails.message}
                  </div>
                </div>
              </div>
            )}

            {/* Brute-force Lockout Notice */}
            {isLocked && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
                <span className="font-extrabold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  يرجى الانتظار لإعادة المحاولة:
                </span>
                <span className="font-mono font-black text-rose-700 tabular-nums text-sm">
                  00:{String(lockoutRemaining).padStart(2, '0')}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <label className="block">
                <span className="block text-[11px] font-extrabold text-slate-700 mb-1.5">
                  اسم المستخدم أو البريد الإلكتروني
                </span>
                <div className="relative">
                  <UserRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    disabled={isLocked || loading}
                    autoComplete="username"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="مثال: user@masar.gov.eg أو اسم الدخول"
                    className="gov-input h-11 pr-10 pl-3 text-xs w-full rounded-xl disabled:bg-slate-100 disabled:opacity-60"
                  />
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <span className="block text-[11px] font-extrabold text-slate-700 mb-1.5">
                  كلمة المرور
                </span>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLocked || loading}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="gov-input h-11 pr-10 pl-11 text-xs w-full rounded-xl disabled:bg-slate-100 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </label>

              {/* Options & Support link */}
              <div className="flex items-center justify-between gap-3 text-[11px] pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="accent-[#087f78] rounded"
                  />
                  <span>تذكرني على هذا الجهاز</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="font-extrabold text-[#087f78] hover:underline"
                >
                  مساعدة في الدخول
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full h-11 rounded-xl bg-[#087f78] hover:bg-[#066963] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60 active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>دخول المنظومة</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 pt-4 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed text-center">
              الدخول مخصص للموظفين المصرح لهم رسمياً. جميع العمليات مسجلة بسجل الرقابة والتدقيق الرقمي.
            </div>
          </div>
        </section>
        </div>
      </div>

      {/* Unified Technical Support Modal */}
      <TechnicalSupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        contextMessage={
          errorCode
            ? 'في حال مواجهة مشكلة متكررة في تسجيل الدخول أو إيقاف الحساب، تواصل مع فريق الدعم الفني لحل المشكلة فوراً.'
            : undefined
        }
      />

      {/* الفوتر الرسمي المعتمد لجميع الشاشات */}
      <OfficialFooter />
    </div>
  );
};
