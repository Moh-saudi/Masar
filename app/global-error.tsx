'use client';

import './globals.css';
import { SystemErrorNotice } from '@/components/SystemErrorNotice';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#f5f8fb] text-[#172033] font-arabic antialiased">
        <main className="min-h-screen flex items-center justify-center px-4 py-10">
          <SystemErrorNotice
            title="تعذر تشغيل المنظومة"
            message="حدث خطأ غير متوقع أثناء تشغيل منظومة «مَسَار». أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني."
            onRetry={reset}
          />
        </main>
      </body>
    </html>
  );
}
