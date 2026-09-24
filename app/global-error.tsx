'use client';

import React, { useEffect } from 'react';
import './globals.css';
import { SystemErrorNotice } from '@/components/SystemErrorNotice';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled global application error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#f4f7fa] text-[#172033] font-arabic antialiased selection:bg-[#087f78]/20 selection:text-[#087f78]">
        <main className="min-h-screen flex items-center justify-center p-4">
          <SystemErrorNotice
            title="تعذر تشغيل المنظومة"
            message="حدث خطأ غير متوقع أثناء تشغيل منظومة «مَسَار». يرجى إعادة المحاولة، وفي حال استمرار العطل تواصل مباشرة مع فريق الدعم الفني."
            onRetry={reset}
            showBackToLogin={true}
          />
        </main>
      </body>
    </html>
  );
}
