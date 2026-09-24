import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col items-center justify-center p-4 font-arabic">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-[#dfe6ee] p-8 shadow-[0_20px_60px_rgba(23,32,51,0.06)] flex flex-col items-center text-center space-y-4">
        {/* Ministry Crest */}
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
          <h2 className="text-base font-extrabold text-[#172033]">منظومة «مَسَار»</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">وزارة الصحة والسكان — قطاع الرعاية وتنمية الأسرة</p>
        </div>

        {/* Sovereign Teal Spinner */}
        <div className="py-2 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-3 border-[#087f78]/20 border-t-[#087f78] animate-spin" />
        </div>

        <p className="text-xs text-slate-600 font-medium">
          جاري تحميل البيانات وتجهيز واجهة العمل...
        </p>
      </div>
    </div>
  );
}
