import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'منظومة «مَسَار» | وزارة الصحة والسكان المصرية',
  description: 'المنظومة الرقمية لتجميع وتحليل بيانات تنمية الأسرة بوزارة الصحة والسكان — إدارة تنمية الأسرة',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-slate-50 text-slate-900 font-arabic antialiased selection:bg-sky-600 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
