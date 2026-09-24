'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './globals.css';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Phone,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import { SUPPORT_PHONE, SUPPORT_HOURS, TechnicalSupportModal } from '@/components/TechnicalSupportModal';
import { MINISTRY_NAME, SECTOR_NAME, SYSTEM_NAME, SYSTEM_FULL_NAME } from '@/lib/constants';

export default function NotFoundPage() {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(SUPPORT_PHONE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="min-h-screen bg-[#f3f7fa] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-arabic text-slate-800 selection:bg-[#087f78]/20 selection:text-[#087f78]"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(8, 127, 120, 0.08) 0%, rgba(243, 247, 250, 0.95) 75%)',
        minHeight: '100vh',
        direction: 'rtl',
      }}
    >
      {/* ================= TOP GOVERNMENTAL BAR ================= */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-13 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-2xs">
            <Image
              src="/logo.png"
              alt="شعار وزارة الصحة والسكان"
              fill
              sizes="48px"
              className="object-contain p-1"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">{MINISTRY_NAME}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[11px] font-bold text-slate-500">{SECTOR_NAME}</span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#172033] mt-0.5">
              {SYSTEM_NAME} <span className="hidden sm:inline text-xs font-medium text-slate-400">| {SYSTEM_FULL_NAME}</span>
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#087f78]" />
          <span className="text-[11px] font-bold text-slate-600">منظومة إدارية حكومية مؤمنة</span>
        </div>
      </header>

      {/* ================= MAIN 404 SOVEREIGN CARD ================= */}
      <main className="w-full max-w-2xl mx-auto my-auto py-6 sm:py-8">
        <div 
          className="relative rounded-3xl bg-white border border-[#dce5ed] shadow-[0_24px_70px_rgba(23,32,51,0.09)] overflow-hidden"
          style={{
            boxShadow: '0 20px 60px -15px rgba(23, 32, 51, 0.12)',
          }}
        >
          {/* Sovereign Top Gradient Stripe */}
          <div className="h-2 bg-gradient-to-l from-[#087f78] via-[#3ca8a1] to-[#18334f]" />

          <div className="p-6 sm:p-10 text-center">
            {/* Visual Error Stamp Badge */}
            <div className="relative inline-flex items-center justify-center mb-6">
              {/* Soft ambient glow behind 404 */}
              <div className="absolute inset-0 rounded-3xl bg-[#087f78]/10 blur-xl scale-125 pointer-events-none" />
              
              <div className="relative flex items-center justify-center px-6 py-3 rounded-2xl bg-[#f0faf9] border border-[#c4eae5] text-[#087f78] shadow-xs">
                <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-[#087f78]">
                  404
                </span>
                <div className="mr-4 text-right border-r border-[#087f78]/25 pr-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#087f78]">رمز الخطأ الإداري</div>
                  <div className="text-xs font-bold text-slate-600">الصفحة غير موجودة</div>
                </div>
              </div>
            </div>

            {/* Error Titles */}
            <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
              الصفحة المطلوبة غير موجودة
            </h2>

            <p className="text-xs sm:text-[13px] text-slate-500 max-w-md mx-auto mt-2.5 leading-relaxed">
              عذرًا، الرابط الذي تحاول الوصول إليه غير متاح. يمكنك العودة مباشرة إلى البوابة الرئيسية للمنظومة.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link
                href="/"
                className="w-full sm:w-auto min-w-[200px] h-12 px-6 rounded-2xl bg-[#087f78] hover:bg-[#066963] text-white text-xs font-black flex items-center justify-center gap-2.5 shadow-[0_8px_20px_rgba(8,127,120,0.22)] transition active:scale-[0.98]"
              >
                <Compass className="w-4 h-4 text-emerald-200" />
                <span>العودة للبوابة الرئيسية</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </Link>

              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="w-full sm:w-auto h-12 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-2xs"
              >
                <Headphones className="w-4 h-4 text-[#087f78]" />
                <span>طلب الدعم الفني المباشر</span>
              </button>
            </div>

            {/* Hotline Strip */}
            <div className="mt-7 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-[#087f78]" />
                <span className="font-bold">الخط الساخن للدعم:</span>
                <a 
                  href={`tel:${SUPPORT_PHONE}`}
                  dir="ltr"
                  className="font-mono font-extrabold text-[#087f78] hover:underline"
                >
                  {SUPPORT_PHONE}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 flex items-center gap-1 transition"
                  title="نسخ رقم الدعم"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{copied ? 'تم نسخ الرقم' : 'نسخ الرقم'}</span>
                </button>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {SUPPORT_HOURS}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full max-w-4xl mx-auto pt-4 border-t border-slate-200/80 text-center sm:flex sm:items-center sm:justify-between text-[11px] text-slate-500">
        <div>
          جمهورية مصر العربية — {MINISTRY_NAME}
        </div>
        <div className="mt-1 sm:mt-0 font-medium">
          {SYSTEM_NAME} — جميع الحقوق محفوظة لقطاع الرعاية وتنمية الأسرة © {new Date().getFullYear()}
        </div>
      </footer>

      {/* Tech Support Modal */}
      <TechnicalSupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
}
