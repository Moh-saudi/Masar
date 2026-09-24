'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile, AuditLog, DailySubmission } from '@/lib/types';
import { createBrowserClient } from '@/lib/supabase/client';
import { OrganizationHierarchyView } from './OrganizationHierarchyView';
import {
  ShieldCheck,
  Users,
  History,
  Search,
  Network,
  UserCheck,
  UserX,
  MapPin,
  Clock3,
  Database,
  Eye,
  KeyRound,
  Power,
  PowerOff,
  X,
  RefreshCw,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Pencil,
  Building,
} from 'lucide-react';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { UserAvatar } from './UserAvatar';
import { DailySubmissionsRegisterView } from './DailySubmissionsRegisterView';
import { TimeLockState } from '@/lib/types';

export type AdminTab = 'daily_register' | 'users' | 'hierarchy' | 'audit';
export type AdminUser = UserProfile & { active?: boolean };

interface AdminUsersPortalProps {
  auditLogs: AuditLog[];
  submissions: DailySubmission[];
  currentUser: UserProfile;
  timeLock?: TimeLockState;
  initialTab?: AdminTab;
  onLoadAuditLogs?: () => Promise<void>;
  onRefreshSubmissions?: () => Promise<void> | void;
}

export const AdminUsersPortal: React.FC<AdminUsersPortalProps> = ({
  auditLogs,
  submissions,
  currentUser,
  timeLock,
  initialTab,
  onLoadAuditLogs,
  onRefreshSubmissions,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'daily_register');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState<AuditLog[]>([]);
  const [loadingUserLogs, setLoadingUserLogs] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [adminActionBusy, setAdminActionBusy] = useState(false);
  const [adminActionMessage, setAdminActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);

  const handleUserUpdated = (updatedUser: AdminUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    if (selectedUser?.id === updatedUser.id) {
      setSelectedUser(prev => prev ? { ...prev, ...updatedUser } : prev);
    }
    setAdminActionMessage({
      type: 'success',
      text: `تم تحديث بيانات وصلاحيات حساب (${updatedUser.full_name}) بنجاح.`,
    });
  };

  const handleUserCreated = (newUser: UserProfile) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === newUser.id);
      if (exists) {
        return prev.map(u => u.id === newUser.id ? { ...u, ...newUser, active: true } : u);
      }
      return [newUser as AdminUser, ...prev];
    });
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      void onLoadAuditLogs?.();
    }
  }, [activeTab, onLoadAuditLogs]);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, national_id, role, role_title_ar, active, governorate_id, governorate_name_ar, district_id, district_name_ar')
        .order('full_name', { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error('Failed to load user profiles', error);
        setUsers([]);
        return;
      }

      setUsers((data ?? []) as AdminUser[]);
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshUsers = async () => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, national_id, role, role_title_ar, active, governorate_id, governorate_name_ar, district_id, district_name_ar')
      .order('full_name', { ascending: true });

    if (error) throw error;
    setUsers((data ?? []) as AdminUser[]);
  };

  const getAccessToken = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  };

  const openUserDetails = async (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedUserLogs([]);
    setAdminActionMessage(null);
    setNewPassword('');
    setLoadingUserLogs(true);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/users/${user.id}/audit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'AUDIT_LOAD_FAILED');
      setSelectedUserLogs(payload.logs || []);
    } catch (error) {
      console.error('Failed to load user audit log', error);
      setSelectedUserLogs([]);
    } finally {
      setLoadingUserLogs(false);
    }
  };

  const updateAccountState = async (target: AdminUser, active: boolean) => {
    if (target.id === currentUser.id && !active) {
      setAdminActionMessage({ type: 'error', text: 'لا يمكن إيقاف حساب مسؤول النظام الحالي أثناء استخدامه.' });
      return;
    }

    setAdminActionBusy(true);
    setAdminActionMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/users/${target.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: active ? 'activate' : 'suspend' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'ACCOUNT_UPDATE_FAILED');

      await refreshUsers();
      setSelectedUser(prev => prev ? { ...prev, active } : prev);
      setAdminActionMessage({
        type: 'success',
        text: active ? 'تم إعادة تفعيل الحساب.' : 'تم إيقاف الحساب مؤقتًا.',
      });
      void openUserDetails({ ...target, active });
    } catch (error) {
      console.error('Failed to update account state', error);
      setAdminActionMessage({ type: 'error', text: 'تعذر تحديث حالة الحساب. أعد المحاولة.' });
    } finally {
      setAdminActionBusy(false);
    }
  };

  const changePassword = async () => {
    if (!selectedUser) return;
    if (newPassword.length < 8) {
      setAdminActionMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.' });
      return;
    }

    setAdminActionBusy(true);
    setAdminActionMessage(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'password', password: newPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'PASSWORD_UPDATE_FAILED');

      setNewPassword('');
      setAdminActionMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح.' });
      void openUserDetails(selectedUser);
    } catch (error) {
      console.error('Failed to change user password', error);
      setAdminActionMessage({ type: 'error', text: 'تعذر تغيير كلمة المرور. أعد المحاولة.' });
    } finally {
      setAdminActionBusy(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    if (statusFilter === 'active') {
      result = result.filter(u => u.active !== false);
    } else if (statusFilter === 'inactive') {
      result = result.filter(u => u.active === false);
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return result;

    return result.filter(u =>
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.national_id || '').includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role_title_ar || '').toLowerCase().includes(term) ||
      (u.district_name_ar || '').toLowerCase().includes(term) ||
      (u.governorate_name_ar || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredUsers.slice(from, from + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const activeUsers = users.filter(u => u.active !== false).length;
  const inactiveUsers = users.length - activeUsers;
  const governorates = new Set(submissions.map(s => s.governorate_name_ar)).size;

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'daily_register', label: 'سجلات اليوم', icon: <Building className="w-4 h-4" /> },
    { id: 'users', label: 'الحسابات والمستخدمون', icon: <Users className="w-4 h-4" />, count: users.length },
    { id: 'hierarchy', label: 'الهيكل التنظيمي', icon: <Network className="w-4 h-4" /> },
    { id: 'audit', label: 'سجل التدقيق الرقمي', icon: <History className="w-4 h-4" />, count: auditLogs.length },
  ];

  const pageTitle =
    activeTab === 'daily_register' ? 'سجلات اليوم' :
    activeTab === 'users' ? 'إدارة الحسابات والصلاحيات' :
    activeTab === 'hierarchy' ? 'الهيكل التنظيمي والمنشآت' :
    'سجل التدقيق والرقابة الرقمية';

  const pageSubtitle =
    activeTab === 'daily_register' ? 'متابعة الموقف التنفيذي وموقف تسجيل كافة الإدارات الصحية (+300 إدارة) على مستوى محافظات الجمهورية لحظة بلحظة.' :
    activeTab === 'users' ? 'إدارة الحسابات والنطاقات التنظيمية ومراجعة صلاحيات الدخول والتشغيل.' :
    activeTab === 'hierarchy' ? 'عرض وتحديث الهيكل الإداري للمحافظات والإدارات الصحية التابعة لها.' :
    'سجل الرقابة والتدقيق الرقمي لكافة العمليات والأنشطة المنفذة بالنظام.';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5">

      <aside className="space-y-4">
        <div className="gov-surface p-3">
          <div className="px-2 py-2.5 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 mb-1">إدارة النظام</p>
            <h2 className="text-sm font-extrabold text-[#172033] leading-6">
              مسؤول النظام العام
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>صلاحيات الإدارة والرقابة الشاملة</span>
            </div>
          </div>

          <nav className="py-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="gov-nav-item"
                data-active={activeTab === item.id}
              >
                {item.icon}
                <span className="flex-1 text-right">{item.label}</span>
                {typeof item.count === 'number' && (
                  <span className="text-[9px] text-slate-400 tabular-nums">{item.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="gov-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-[#087f78]" />
            <h3 className="text-xs font-extrabold text-[#172033]">ملخص المنظومة</h3>
          </div>

          <dl className="space-y-3 text-[11px]">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">إجمالي الحسابات</dt>
              <dd className="font-extrabold text-slate-900 tabular-nums">{users.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">حسابات نشطة</dt>
              <dd className="font-extrabold text-emerald-700 tabular-nums">{activeUsers}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">غير نشطة</dt>
              <dd className="font-extrabold text-rose-700 tabular-nums">{inactiveUsers}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">محافظات بالبيانات</dt>
              <dd className="font-extrabold text-slate-900 tabular-nums">{governorates}</dd>
            </div>
          </dl>
        </div>
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="gov-surface px-5 py-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#087f78] mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>لوحة إدارة النظام</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#172033]">{pageTitle}</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-6">
                {pageSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 min-w-[320px]">
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#087f78]" />
                  الحسابات
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{users.length}</div>
              </div>
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  نشط
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{activeUsers}</div>
              </div>
              <div className="gov-kpi">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  أحداث
                </div>
                <div className="font-extrabold text-base text-[#172033] tabular-nums">{auditLogs.length}</div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'daily_register' && (
          <DailySubmissionsRegisterView
            submissions={submissions}
            timeLock={timeLock || {
              current_time_str: '11:30',
              is_district_locked: false,
              is_directorate_locked: false,
              is_ministry_locked: false,
              district_deadline: '15:00',
              directorate_deadline: '18:00',
              ministry_deadline: '22:00',
              has_active_override: false,
              override_minutes_remaining: 0,
            }}
            user={currentUser}
            onRefreshData={onRefreshSubmissions}
          />
        )}

        {activeTab === 'users' && (
          <div className="gov-surface overflow-hidden border border-slate-200/80 shadow-sm rounded-2xl bg-white">
            {/* Header Row: Title & Description on Right, Add User Button on Left */}
            <div className="p-4 sm:px-6 sm:py-4.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-l from-white to-[#fbfcfd]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#172033]">دليل الحسابات والمستخدمين</h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold tabular-nums">
                    {filteredUsers.length} حساب
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">الحسابات المعرفة بالنظام، مستويات الصلاحيات، والنطاقات الجغرافية للإدخال والاعتماد.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                title="إنشاء حساب مستخدم جديد واعتماد الصلاحيات والنطاق الجغرافي"
                className="h-10 px-4 rounded-xl bg-[#087f78] hover:bg-[#066963] text-white text-[11px] font-extrabold flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.98] shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة مستخدم جديد</span>
              </button>
            </div>

            {/* Filter & Search Row: Search takes maximum space, Filter has fixed suitable width */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-[#fcfdfe] border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الرقم القومي أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="gov-input h-10 pr-10 pl-9 text-xs w-full rounded-xl border-slate-200 bg-white placeholder:text-slate-400 focus:border-[#087f78] transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
                    title="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="w-full sm:w-48 shrink-0">
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value as 'all' | 'active' | 'inactive'); setCurrentPage(1); }}
                  className="gov-input h-10 px-3 text-xs w-full rounded-xl border-slate-200 bg-white font-medium text-slate-700 cursor-pointer focus:border-[#087f78] transition"
                  title="تصفية الحسابات حسب الحالة"
                >
                  <option value="all">كافة الحالات ({users.length})</option>
                  <option value="active">الحسابات النشطة ({activeUsers})</option>
                  <option value="inactive">الموقوفة مؤقتًا ({inactiveUsers})</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-600 border-b border-slate-200 text-[11px] font-extrabold select-none">
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3 min-w-[220px]">المستخدم / الحساب</th>
                    <th className="px-4 py-3 min-w-[180px]">المستوى والدور الوظيفي</th>
                    <th className="px-4 py-3 min-w-[200px]">النطاق الجغرافي</th>
                    <th className="px-4 py-3 text-center min-w-[110px]">الحالة</th>
                    <th className="px-4 py-3 text-center min-w-[180px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400 text-xs">
                        لا توجد حسابات مطابقة للبحث أو التصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u, index) => {
                      const isActive = u.active !== false;
                      return (
                        <tr key={u.id} className="hover:bg-[#fbfcfd] transition-colors duration-150">
                          <td className="px-4 py-3 text-center text-slate-400 tabular-nums">
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar role={u.role} name={u.full_name} avatarUrl={u.avatar_url} size="md" />
                              <div className="min-w-0">
                                <div className="font-extrabold text-[#172033] leading-tight truncate">
                                  {u.full_name}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 truncate tabular-nums">
                                  {u.email || u.national_id || '—'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[11px] font-bold text-slate-700 leading-tight">
                              {u.role_title_ar || u.role}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#087f78] shrink-0" />
                              <span className="truncate">
                                {u.district_name_ar
                                  ? `${u.district_name_ar} — ${u.governorate_name_ar || ''}`
                                  : u.governorate_name_ar
                                    ? `محافظة ${u.governorate_name_ar}`
                                    : 'ديوان عام الوزارة'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-extrabold ${
                              isActive
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}>
                              {isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                              {isActive ? 'نشط' : 'موقوف'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setUserToEdit(u)}
                                className="h-7 px-2.5 rounded-lg border border-[#087f78]/30 bg-[#f0faf9] hover:bg-[#e4f7f5] text-[#087f78] text-[10px] font-extrabold inline-flex items-center gap-1 transition shadow-xs"
                                title="تعديل بيانات الحساب والصلاحيات"
                              >
                                <Pencil className="w-3 h-3 text-[#087f78]" />
                                تعديل
                              </button>
                              <button
                                onClick={() => void openUserDetails(u)}
                                className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold inline-flex items-center gap-1 transition shadow-xs"
                              >
                                <Eye className="w-3 h-3 text-slate-500" />
                                التفاصيل
                              </button>
                              <button
                                disabled={adminActionBusy || (u.id === currentUser.id && isActive)}
                                onClick={() => void updateAccountState(u, !isActive)}
                                className={`h-7 px-2.5 rounded-lg border text-[10px] font-extrabold inline-flex items-center gap-1 transition shadow-xs disabled:opacity-40 ${
                                  isActive
                                    ? 'bg-rose-50/70 border-rose-200 text-rose-700 hover:bg-rose-100/70'
                                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70'
                                }`}
                              >
                                {isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                                {isActive ? 'إيقاف' : 'تفعيل'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-[#fbfcfd] text-[11px]">
                <span className="text-slate-500 font-medium">
                  صفحة <span className="font-extrabold text-slate-800 tabular-nums">{currentPage}</span> من{' '}
                  <span className="font-extrabold text-slate-800 tabular-nums">{totalPages}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  إجمالي الحسابات: <span className="font-extrabold text-[#087f78] tabular-nums">{filteredUsers.length}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    السابق
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                  >
                    التالي
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="gov-surface overflow-hidden border border-slate-200/80 shadow-sm rounded-2xl bg-white">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#172033]">سجل الحركات والرقابة الرقمية</h2>
                <p className="text-[10px] text-slate-500 mt-1">أحدث الإجراءات المسجلة داخل المنظومة وفق التسلسل الزمني.</p>
              </div>
              <div className="text-[10px] text-slate-400 tabular-nums">{auditLogs.length} حركة</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-600 border-b border-slate-200 text-[11px] font-extrabold select-none">
                    <th className="px-4 py-3 text-center w-14">#</th>
                    <th className="px-4 py-3 min-w-[170px]">التوقيت</th>
                    <th className="px-4 py-3 min-w-[180px]">المستخدم المسؤول</th>
                    <th className="px-4 py-3 min-w-[140px]">نوع الإجراء</th>
                    <th className="px-4 py-3 min-w-[280px]">تفاصيل العملية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">لا توجد حركات تدقيق مسجلة.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={log.id} className="hover:bg-[#fbfcfd] transition">
                        <td className="px-4 py-3 text-center text-slate-400 tabular-nums">#{String(idx + 1).padStart(3, '0')}</td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1.5 text-slate-700 font-bold tabular-nums">
                            <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                            {log.timestamp}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-[#172033]">{log.actor_name}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{log.actor_role}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-md bg-[#eef9f7] border border-[#ccebe7] text-[#087f78] text-[9px] font-extrabold inline-block">
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 leading-relaxed">
                          {log.description}
                          {log.target_district && (
                            <span className="text-[9px] text-slate-400 block mt-0.5">النطاق: {log.target_district}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 z-[95] bg-slate-950/45 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-5" onClick={() => setSelectedUser(null)}>
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar role={selectedUser.role} name={selectedUser.full_name} avatarUrl={selectedUser.avatar_url} size="lg" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[#172033]">{selectedUser.full_name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{selectedUser.role_title_ar}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserToEdit(selectedUser)}
                    className="h-8 px-3 rounded-xl border border-[#087f78]/30 bg-[#f0faf9] hover:bg-[#e4f7f5] text-[#087f78] text-[10px] font-extrabold inline-flex items-center gap-1.5 transition"
                    title="تعديل بيانات وصلاحيات هذا الحساب"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#087f78]" />
                    <span>تعديل الحساب</span>
                  </button>
                  <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[78vh] p-5 space-y-5">
                {adminActionMessage && (
                  <div className={`rounded-xl px-3 py-2.5 border text-[10px] font-bold ${
                    adminActionMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {adminActionMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ['الاسم الكامل', selectedUser.full_name || '—'],
                    ['البريد الإلكتروني', selectedUser.email || '—'],
                    ['الرقم القومي', selectedUser.national_id || '—'],
                    ['الدور الوظيفي', selectedUser.role_title_ar || selectedUser.role],
                    ['المحافظة', selectedUser.governorate_name_ar || 'ديوان عام الوزارة'],
                    ['الإدارة الصحية', selectedUser.district_name_ar || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-[#fbfcfd] p-3">
                      <div className="text-[8px] text-slate-400 mb-1">{label}</div>
                      <div className="text-[10px] font-extrabold text-[#172033]">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <KeyRound className="w-4 h-4 text-[#087f78]" />
                      <h4 className="text-[11px] font-extrabold text-[#172033]">تغيير كلمة المرور</h4>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-5 mb-3">
                      يتم تغيير كلمة المرور من الخادم مباشرة. كلمة المرور الجديدة لا تُحفظ في سجل التدقيق.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="كلمة مرور جديدة - 8 أحرف على الأقل"
                        className="gov-input h-10 px-3 text-[10px] flex-1"
                      />
                      <button
                        disabled={adminActionBusy}
                        onClick={() => void changePassword()}
                        className="h-10 px-4 rounded-xl gov-btn-primary text-[9px] font-extrabold disabled:opacity-50"
                      >
                        تغيير
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <h4 className="text-[11px] font-extrabold text-[#172033]">حالة الحساب</h4>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-5 mb-3">
                      الإيقاف المؤقت يمنع الحساب من الوصول إلى بيانات المنظومة حتى إعادة تفعيله.
                    </p>
                    <button
                      disabled={adminActionBusy || (selectedUser.id === currentUser.id && selectedUser.active !== false)}
                      onClick={() => void updateAccountState(selectedUser, selectedUser.active === false)}
                      className={`h-10 px-4 rounded-xl border text-[9px] font-extrabold inline-flex items-center gap-2 disabled:opacity-40 ${
                        selectedUser.active === false
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      {selectedUser.active === false ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      {selectedUser.active === false ? 'إعادة تفعيل الحساب' : 'إيقاف الحساب مؤقتًا'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-[#f7f9fb] border-b border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-[11px] font-extrabold text-[#172033]">سجل الحساب</h4>
                      <p className="text-[8px] text-slate-400 mt-1">أحدث الإجراءات الإدارية المرتبطة بهذا الحساب.</p>
                    </div>
                    {loadingUserLogs && <RefreshCw className="w-4 h-4 text-[#087f78] animate-spin" />}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                    {!loadingUserLogs && selectedUserLogs.length === 0 && (
                      <div className="py-8 text-center text-[10px] text-slate-400">لا توجد حركات مسجلة لهذا الحساب حتى الآن.</div>
                    )}

                    {selectedUserLogs.map(log => (
                      <div key={log.id} className="px-4 py-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-[#eef9f7] text-[#087f78] text-[8px] font-extrabold">{log.action_type}</span>
                              <span className="text-[8px] text-slate-400">{log.timestamp}</span>
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1.5 leading-5">{log.description}</div>
                          </div>
                          <div className="text-[8px] text-slate-400 whitespace-nowrap">
                            بواسطة {log.actor_name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <OrganizationHierarchyView user={currentUser} />
        )}
      </section>

      {/* نافذة إنشاء واعتماد مستخدم جديد */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={handleUserCreated}
      />

      {/* نافذة تعديل بيانات الحساب والصلاحيات */}
      <EditUserModal
        isOpen={Boolean(userToEdit)}
        user={userToEdit}
        onClose={() => setUserToEdit(null)}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};
