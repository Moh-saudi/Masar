'use client';

import { SystemErrorNotice } from '@/components/SystemErrorNotice';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f5f8fb] flex items-center justify-center px-4 py-10">
      <SystemErrorNotice
        title="حدث خطأ غير متوقع"
        message="تعذر تحميل هذا الجزء من المنظومة الآن. يمكنك إعادة المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني."
        onRetry={reset}
      />
    </main>
  );
}
