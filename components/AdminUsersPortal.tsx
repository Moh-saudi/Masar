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
  Database
} from 'lucide-react';

interface AdminUsersPortalProps {
  auditLogs: AuditLog[];
  submissions: DailySubmission[];
  currentUser: UserProfile;
}

type AdminTab = 'users' | 'hierarchy' | 'audit';
type AdminUser = UserProfile & { active?: boolean };

export const AdminUsersPortal: React.FC<AdminUsersPortalProps> = ({
  auditLogs,
  submissions,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);

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

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;

    return users.filter(u =>
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.national_id || '').includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role_title_ar || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const activeUsers = users.filter(u => u.active !== false).length;
  const inactiveUsers = users.length - activeUsers;
  const governorates = new Set(submissions.map(s => s.governorate_name_ar)).size;

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'users', label: 'الحسابات والمستخدمون', icon: <Users className="w-4 h-4" />, count: users.length },
    { id: 'hierarchy', label: 'الهيكل التنظيمي', icon: <Network className="w-4 h-4" /> },
    { id: 'audit', label: 'سجل التدقيق الرقمي', icon: <History className="w-4 h-4" />, count: auditLogs.length },
  ];

  const pageTitle =
    activeTab === 'users' ? 'إدارة الحسابات والصلاحيات' :
    activeTab === 'hierarchy' ? 'الهيكل التنظيمي والمنشآت' :
    'سجل التدقيق والرقابة الرقمية';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">

      <aside className="xl:sticky xl:top-[94px] space-y-4">
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
                إدارة الحسابات والنطاقات التنظيمية ومراجعة سجل الحركات الرقابي.
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

        {activeTab === 'users' && (
          <div className="gov-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#172033]">دليل الحسابات</h2>
                <p className="text-[10px] text-slate-500 mt-1">الحسابات المعرّفة في ملف المستخدمين ونطاقاتها الإدارية.</p>
              </div>

              <div className="relative w-full md:w-[330px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الرقم القومي أو البريد..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="gov-input h-10 pr-9 pl-3 text-[10px]"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-[11px] text-slate-400">لا توجد حسابات مطابقة للبحث.</div>
              )}

              {filteredUsers.map(u => {
                const isActive = u.active !== false;
                return (
                  <div key={u.id} className="px-5 py-4 hover:bg-[#fbfcfd] transition">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1.2fr)_190px_minmax(220px,1fr)_130px] gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#eaf9f7] text-[#087f78] flex items-center justify-center font-extrabold text-xs">
                          {(u.full_name || '?').slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-extrabold text-[#172033] truncate">{u.full_name}</div>
                          <div className="text-[9px] text-slate-400 mt-1 truncate">{u.email || u.national_id || '—'}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] text-slate-400 mb-1">الدور الوظيفي</div>
                        <div className="text-[10px] font-bold text-slate-700 leading-5">{u.role_title_ar}</div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mb-1">
                          <MapPin className="w-3 h-3" />
                          النطاق الإداري
                        </div>
                        <div className="text-[10px] font-bold text-slate-700 leading-5">
                          {u.district_name_ar
                            ? `${u.district_name_ar} — ${u.governorate_name_ar || ''}`
                            : u.governorate_name_ar
                              ? `محافظة ${u.governorate_name_ar}`
                              : 'ديوان عام الوزارة'}
                        </div>
                      </div>

                      <div className="lg:text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-extrabold ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                          {isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="gov-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#172033]">سجل الحركات والرقابة الرقمية</h2>
                <p className="text-[10px] text-slate-500 mt-1">أحدث الإجراءات المسجلة داخل المنظومة.</p>
              </div>
              <div className="text-[10px] text-slate-400 tabular-nums">{auditLogs.length} حركة</div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
              {auditLogs.length === 0 && (
                <div className="py-12 text-center text-[11px] text-slate-400">لا توجد حركات تدقيق مسجلة.</div>
              )}

              {auditLogs.map((log, idx) => (
                <div key={log.id} className="px-5 py-4 hover:bg-[#fbfcfd] transition">
                  <div className="grid grid-cols-1 lg:grid-cols-[80px_180px_170px_minmax(0,1fr)] gap-4 items-start">
                    <div className="text-[9px] text-slate-400 tabular-nums">#{String(idx + 1).padStart(3, '0')}</div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mb-1">
                        <Clock3 className="w-3 h-3" />
                        التوقيت
                      </div>
                      <div className="text-[10px] font-bold text-slate-700">{log.timestamp}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold text-[#172033]">{log.actor_name}</div>
                      <div className="text-[8px] text-slate-400 mt-1">{log.actor_role}</div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2 py-1 rounded-lg bg-[#eef9f7] text-[#087f78] text-[8px] font-extrabold">
                          {log.action_type}
                        </span>
                        {log.target_district && (
                          <span className="text-[8px] text-slate-400">{log.target_district}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-600 leading-5">{log.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <OrganizationHierarchyView user={currentUser} />
        )}
      </section>
    </div>
  );
};
