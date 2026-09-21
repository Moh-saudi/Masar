'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoginView } from '@/components/LoginView';
import { Header } from '@/components/Header';
import { TimeLockBar } from '@/components/TimeLockBar';
import { DistrictPortal } from '@/components/DistrictPortal';
import { DirectoratePortal } from '@/components/DirectoratePortal';
import { MinistryPortal } from '@/components/MinistryPortal';
import { ReportsCenterView } from '@/components/ReportsCenterView';
import { AdminUsersPortal } from '@/components/AdminUsersPortal';
import { AuditLogModal } from '@/components/AuditLogModal';
import { SystemErrorNotice } from '@/components/SystemErrorNotice';
import { MasarService } from '@/lib/masar-service';
import { fetchDailySubmissions } from '@/lib/services/submissions-client';
import { fetchAuditTrail } from '@/lib/services/audit-client';
import { DailySubmission, TimeLockState, AuditLog } from '@/lib/types';
import { 
  Building, 
  Building2, 
  LayoutDashboard, 
  FileSpreadsheet, 
  ShieldCheck, 
  Layers
} from 'lucide-react';

export default function MasarPlatformPage() {
  const { user, loading, configured } = useAuth();

  const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<'admin' | 'ministry' | 'directorate' | 'district' | 'reports'>('admin');
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  const [timeLock, setTimeLock] = useState<TimeLockState>({
    current_time_str: '11:30',
    is_district_locked: false,
    is_directorate_locked: false,
    is_ministry_locked: false,
    district_deadline: '15:00',
    directorate_deadline: '18:00',
    ministry_deadline: '22:00',
    has_active_override: false,
    override_minutes_remaining: 0,
  });

  // مزامنة البيانات
  const reloadData = useCallback(async () => {
    if (!configured || !user) return;

    try {
      const [subs, logs] = await Promise.all([
        fetchDailySubmissions(),
        fetchAuditTrail().catch(() => []),
      ]);

      if (subs.length > 0) {
        setSubmissions(subs);
      } else {
        MasarService.initialize();
        setSubmissions([...MasarService.getSubmissions()]);
      }

      setAuditLogs(logs.length > 0 ? logs : [...MasarService.getAuditLogs()]);
    } catch (error) {
      console.warn('Database load failed; using local fallback.', error);
      MasarService.initialize();
      setSubmissions([...MasarService.getSubmissions()]);
      setAuditLogs([...MasarService.getAuditLogs()]);
    }
  }, [configured, user]);

  useEffect(() => {
    if (configured && user) {
      reloadData();
    }
  }, [configured, user, reloadData]);

  // تحديث حالة الحوكمة الزمنية الحقيقية
  useEffect(() => {
    const updateLock = () => {
      let activeSub: DailySubmission | undefined;
      if (user?.district_id) {
        activeSub = submissions.find(s => s.district_id === user.district_id);
      } else {
        activeSub = submissions[0];
      }
      const lock = MasarService.getTimeLockState(activeSub);
      setTimeLock(lock);
    };

    updateLock();
    const interval = setInterval(updateLock, 1000);
    return () => clearInterval(interval);
  }, [submissions, user]);

  const handleSubmissionUpdated = (updatedSub: DailySubmission) => {
    setSubmissions(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
  };

  // 1. حالة التحميل الأولي
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-arabic">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold tracking-wide">جاري الاتصال بمنظومة «مَسَار»...</h2>
        <p className="text-xs text-slate-400 mt-1">التحقق من الشهادات الرقمية والحوكمة السيادية</p>
      </div>
    );
  }

  // 2. إذا لم تكن قاعدة البيانات مضبوطة في بيئة التشغيل
  if (!configured) {
    return (
      <main className="min-h-screen bg-[#f5f8fb] flex items-center justify-center px-4 py-10 font-arabic">
        <SystemErrorNotice
          title="المنظومة غير مرتبطة بقاعدة البيانات"
          message="إعدادات الاتصال الآمن بقاعدة البيانات غير مضافة في بيئة التشغيل الحالية. برجاء التواصل مع الدعم الفني لاستكمال إعداد المنظومة."
        />
      </main>
    );
  }

  // 3. إذا لم يكن مسجلاً، إظهار شاشة الدخول المعتمدة
  if (!user) {
    return <LoginView />;
  }

  // العثور على بيان الإدارة الخاصة بالمستخدم
  const userDistrictSubmission = submissions.find(s => s.district_id === user.district_id) || submissions[0];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-arabic">
      
      {/* 1. ترويسة الصفحة الرسمية الموحدة */}
      <Header
        currentProfile={user}
        onOpenAuditLogs={() => setShowAuditModal(true)}
      />

      {/* 2. شريط التوقيت والحوكمة السيادي الصارم */}
      <TimeLockBar
        timeLock={timeLock}
        simulatedTime={null}
        onOpenSimModal={() => {}}
        onRequestOverride={() => {}}
        canRequestOverride={false}
      />

      {/* 3. شريط التبديل بين مستويات المنظومة لمسؤول النظام العام */}
      {user.role === 'super_admin' && (
        <div className="bg-white/90 border-b border-[#e2e8ef]">
          <div className="gov-shell mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#087f78]" />
              <span>وضع مسؤول النظام العام</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium">التنقل بين مستويات التشغيل للمتابعة والإدارة</span>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#f2f5f8] border border-[#e1e7ed] rounded-xl text-[10px] font-extrabold">
              {[
                { id: 'admin', label: 'إدارة النظام', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                { id: 'ministry', label: 'ديوان الوزارة', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
                { id: 'directorate', label: 'المديرية', icon: <Building2 className="w-3.5 h-3.5" /> },
                { id: 'district', label: 'الإدارة الصحية', icon: <Building className="w-3.5 h-3.5" /> },
                { id: 'reports', label: 'التقارير', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setAdminActiveTab(item.id as typeof adminActiveTab)}
                  className={`h-8 px-3 rounded-lg transition flex items-center gap-1.5 ${
                    adminActiveTab === item.id
                      ? 'bg-white text-[#087f78] shadow-sm ring-1 ring-[#dce6eb]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. توجيه البوابات الحصري طبقاً لصلاحيات الحساب المسجل */}
      <div className="flex-1 gov-shell w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* أ. مستوى الإدارة الصحية (District Health Officer) */}
        {user.role === 'district_user' && userDistrictSubmission && (
          <DistrictPortal
            submission={userDistrictSubmission}
            user={user}
            timeLock={timeLock}
            onSubmissionUpdated={handleSubmissionUpdated}
          />
        )}

        {/* ب. مستوى مديرية الشئون الصحية بالمحافظة (Directorate Reviewer) */}
        {user.role === 'directorate_user' && (
          <DirectoratePortal
            submissions={submissions}
            user={user}
            timeLock={timeLock}
            onDataChanged={reloadData}
          />
        )}

        {/* ج. مستوى قيادات الوزارة والقطاع (Ministry & Sector Head) */}
        {(user.role === 'sector_head' || user.role === 'general_director' || user.role === 'central_admin') && (
          <MinistryPortal
            submissions={submissions}
            user={user}
            timeLock={timeLock}
            onDataChanged={reloadData}
          />
        )}

        {/* د. مسؤول النظام العام (Super Admin) - بناءً على التبويب المختار */}
        {user.role === 'super_admin' && (
          <>
            {adminActiveTab === 'admin' && (
              <AdminUsersPortal
                auditLogs={auditLogs}
                submissions={submissions}
                currentUser={user}
              />
            )}
            {adminActiveTab === 'ministry' && (
              <MinistryPortal
                submissions={submissions}
                user={user}
                timeLock={timeLock}
                onDataChanged={reloadData}
              />
            )}
            {adminActiveTab === 'directorate' && (
              <DirectoratePortal
                submissions={submissions}
                user={user}
                timeLock={timeLock}
                onDataChanged={reloadData}
              />
            )}
            {adminActiveTab === 'district' && userDistrictSubmission && (
              <DistrictPortal
                submission={userDistrictSubmission}
                user={user}
                timeLock={timeLock}
                onSubmissionUpdated={handleSubmissionUpdated}
              />
            )}
            {adminActiveTab === 'reports' && (
              <ReportsCenterView
                submissions={submissions}
                user={user}
              />
            )}
          </>
        )}

      </div>

      {/* نافذة سجل التدقيق المنبثقة */}
      {showAuditModal && (
        <AuditLogModal
          logs={auditLogs}
          onClose={() => setShowAuditModal(false)}
        />
      )}

    </main>
  );
}
