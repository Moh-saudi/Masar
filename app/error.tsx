'use client';

import React, { useEffect } from 'react';
import { SystemErrorNotice } from '@/components/SystemErrorNotice';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error internally without exposing details to user
    console.error('Unhandled app error occurred:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#f4f7fa] flex items-center justify-center p-4 font-arabic">
      <SystemErrorNotice
        title="حدث خطأ غير متوقع"
        message="تعذر استكمال العملية الحالية في المنظومة. يمكنك إعادة المحاولة، أو العودة للصفحة الرئيسية، وفي حال استمرار المشكلة تواصل مع الدعم الفني."
        onRetry={reset}
        showBackToLogin={true}
      />
    </main>
  );
}
