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
import { MasarService } from '@/lib/masar-service';
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
  const { user, loading } = useAuth();

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
  const reloadData = useCallback(() => {
    MasarService.initialize();
    const subs = MasarService.getSubmissions();
    setSubmissions([...subs]);
    setAuditLogs([...MasarService.getAuditLogs()]);
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

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

  // 2. إذا لم يكن مسجلاً، إظهار شاشة الدخول المعتمدة
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

      {/* 3. شريط التنقل الخاص بمسؤول النظام العام (Super Admin فقط) */}
      {user.role === 'super_admin' && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-purple-700 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>صلاحيات إدارة النظام الشاملة:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setAdminActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  adminActiveTab === 'admin' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>إدارة المستخدمين والرقابة</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('ministry')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  adminActiveTab === 'ministry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
                <span>بوابة الوزارة القومية</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('directorate')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  adminActiveTab === 'directorate' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>بوابة المديرية والمحافظة</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('district')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  adminActiveTab === 'district' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-sky-600" />
                <span>بوابة الإدارة الصحية</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  adminActiveTab === 'reports' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>مركز التقارير وExcel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. توجيه البوابات الحصري طبقاً لصلاحيات الحساب المسجل */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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
