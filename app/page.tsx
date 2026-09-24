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
import { DailySubmissionsRegisterView } from '@/components/DailySubmissionsRegisterView';
import { AuditLogModal } from '@/components/AuditLogModal';
import { SystemErrorNotice } from '@/components/SystemErrorNotice';
import { OfficialFooter } from '@/components/OfficialFooter';
import { MasarService, getTodayDateString } from '@/lib/masar-service';
import { fetchDailySubmissions, fetchSubmissionPage } from '@/lib/services/submissions-client';
import { fetchAuditTrail } from '@/lib/services/audit-client';
import { DailySubmission, TimeLockState, AuditLog } from '@/lib/types';
import { 
  Building, 
  Building2, 
  LayoutDashboard, 
  FileSpreadsheet, 
  ShieldCheck, 
  ShieldAlert,
} from 'lucide-react';

export default function MasarPlatformPage() {
  const { user, loading, configured } = useAuth();

  const [submissions, setSubmissions] = useState<DailySubmission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<'admin' | 'daily_register' | 'ministry' | 'directorate' | 'reports'>('admin');
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

  // تحميل البيانات التشغيلية لليوم فقط. كل البوابات العليا تشترك في نفس النسخة بالذاكرة.
  const reloadData = useCallback(async () => {
    if (!configured || !user) return;

    try {
      const subs = await fetchDailySubmissions();
      let allSubs = [...subs];

      // إذا كان المستخدم إدارة صحية، نجلب أيضاً السجلات السابقة لإظهار أي بيانات مرجعة للتعديل (مثل الأمس)
      if (user.role === 'district_user' && user.district_id) {
        try {
          const past = await fetchSubmissionPage({
            districtId: user.district_id,
            pageSize: 15,
          });
          past.rows.forEach(p => {
            if (!allSubs.some(s => s.id === p.id)) {
              allSubs.push(p);
            }
          });
        } catch (e) {
          console.warn('Failed to load past district submissions', e);
        }
      }

      setSubmissions(allSubs);
      if (allSubs.length > 0) {
        MasarService.syncSubmissions(allSubs);
      }
    } catch (error) {
      console.error('Failed to load today submissions.', error);
      setSubmissions([]);
    }
  }, [configured, user]);

  // سجل التدقيق تحميل كسول عند فتحه بدل طلبه مع كل تحميل للصفحة.
  const loadAuditLogs = useCallback(async () => {
    if (!configured || !user) return;
    try {
      const logs = await fetchAuditTrail(100);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load audit trail.', error);
      setAuditLogs([]);
    }
  }, [configured, user]);

  const openAuditLogs = useCallback(async () => {
    setShowAuditModal(true);
    await loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    if (configured && user) {
      reloadData();
    }
  }, [configured, user, reloadData]);

  // تحديث حالة الحوكمة الزمنية الحقيقية
  useEffect(() => {
    const updateLock = () => {
      let activeSub: DailySubmission | undefined;
      const today = getTodayDateString();
      if (user?.district_id) {
        activeSub = submissions.find(s => s.district_id === user.district_id && s.submission_date === today) || MasarService.getSubmissionByDistrict(user.district_id, user);
      } else {
        activeSub = submissions[0];
      }
      const lock = MasarService.getTimeLockState(activeSub);
      setTimeLock(lock);
    };

    updateLock();
    const interval = setInterval(updateLock, 15_000);
    return () => clearInterval(interval);
  }, [submissions, user]);

  const handleSubmissionUpdated = (updatedSub: DailySubmission) => {
    setSubmissions(prev => {
      const index = prev.findIndex(
        s => s.id === updatedSub.id || (s.district_id === updatedSub.district_id && s.submission_date === updatedSub.submission_date)
      );
      if (index >= 0) {
        const next = [...prev];
        next[index] = updatedSub;
        return next;
      }
      return [updatedSub, ...prev];
    });
    MasarService.syncSubmissions([updatedSub]);
  };

  // دفاع إضافي بجانب RLS: أي حساب جغرافي ناقص النطاق يفشل مغلقًا ولا يرى سجلات.
  const scopedSubmissions = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'district_user') {
      if (!user.district_id) return [];
      return submissions.filter(s => s.district_id === user.district_id);
    }

    if (user.role === 'directorate_user') {
      if (!user.governorate_id) return [];
      return submissions.filter(s => s.governorate_id === user.governorate_id);
    }

    return submissions;
  }, [submissions, user?.role, user?.district_id, user?.governorate_id]);

  const userDistrictSubmission = React.useMemo(() => {
    if (user?.role !== 'district_user' || !user.district_id) return undefined;
    const today = getTodayDateString();
    const foundToday = scopedSubmissions.find(
      s => s.district_id === user.district_id && s.submission_date === today
    );
    if (foundToday) return foundToday;

    // إذا لم يكن هناك استمارة لليوم مسجلة مسبقاً في قاعدة البيانات، نجهز استمارة اليوم الافتراضية كمسودة نظيفة
    return MasarService.getSubmissionByDistrict(user.district_id, user);
  }, [user, scopedSubmissions]);

  // 1. حالة التحميل الأولي
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] flex flex-col items-center justify-center p-4 font-arabic">
        <div className="w-full max-w-sm rounded-3xl bg-white border border-[#dfe6ee] p-8 shadow-[0_20px_60px_rgba(23,32,51,0.06)] flex flex-col items-center text-center space-y-4">
          <div className="w-8 h-8 rounded-full border-3 border-[#087f78]/20 border-t-[#087f78] animate-spin" />
          <h2 className="text-sm font-extrabold text-[#172033]">جاري الاتصال بمنظومة «مَسَار»...</h2>
          <p className="text-[11px] text-slate-500">التحقق من بيانات الجلسة والصلاحيات المعتمدة</p>
        </div>
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

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-arabic">
      
      {/* 1. ترويسة الصفحة الرسمية الموحدة */}
      <Header
        currentProfile={user}
        onOpenAuditLogs={openAuditLogs}
      />

      {/* 2. شريط التوقيت والحوكمة الصارم */}
      <TimeLockBar
        timeLock={timeLock}
        userRole={user.role}
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
                { id: 'daily_register', label: 'سجلات اليوم (الإدارات)', icon: <Building className="w-3.5 h-3.5" /> },
                { id: 'ministry', label: 'ديوان الوزارة', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
                { id: 'directorate', label: 'المديرية', icon: <Building2 className="w-3.5 h-3.5" /> },
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
            submissions={scopedSubmissions}
            user={user}
            timeLock={timeLock}
            onSubmissionUpdated={handleSubmissionUpdated}
          />
        )}

        {user.role === 'district_user' && !user.district_id && (
          <div className="gov-surface p-8 max-w-lg mx-auto text-center my-12">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-amber-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-[#172033]">الحساب غير مرتبط بإدارة صحية محددة</h2>
            <p className="text-xs text-slate-500 mt-2 leading-6">
              تم تعيين دورك كمسؤول إدخال بيانات ولكن لم يتم تحديد نطاق الإدارة الصحية في ملف الحساب.
              يرجى مراجعة مسؤول النظام لربط الحساب بالإدارة التابع لها.
            </p>
          </div>
        )}

        {/* ب. مستوى مديرية الشئون الصحية بالمحافظة (Directorate Reviewer) */}
        {user.role === 'directorate_user' && (
          <DirectoratePortal
            submissions={scopedSubmissions}
            user={user}
            timeLock={timeLock}
            onDataChanged={reloadData}
          />
        )}

        {/* ج. مستوى قيادات الوزارة والقطاع (Ministry & Sector Head) */}
        {(user.role === 'sector_head' || user.role === 'general_director' || user.role === 'central_admin') && (
          <MinistryPortal
            submissions={scopedSubmissions}
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
                timeLock={timeLock}
                initialTab="users"
                onLoadAuditLogs={loadAuditLogs}
                onRefreshSubmissions={reloadData}
              />
            )}
            {adminActiveTab === 'daily_register' && (
              <AdminUsersPortal
                auditLogs={auditLogs}
                submissions={submissions}
                currentUser={user}
                timeLock={timeLock}
                initialTab="daily_register"
                onLoadAuditLogs={loadAuditLogs}
                onRefreshSubmissions={reloadData}
              />
            )}
            {adminActiveTab === 'ministry' && (
              <MinistryPortal
                submissions={scopedSubmissions}
                user={user}
                timeLock={timeLock}
                onDataChanged={reloadData}
              />
            )}
            {adminActiveTab === 'directorate' && (
              <DirectoratePortal
                submissions={scopedSubmissions}
                user={user}
                timeLock={timeLock}
                onDataChanged={reloadData}
              />
            )}
            {adminActiveTab === 'reports' && (
              <ReportsCenterView
                submissions={scopedSubmissions}
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

      {/* الفوتر الرسمي المعتمد لجميع الشاشات */}
      <OfficialFooter />

    </main>
  );
}
