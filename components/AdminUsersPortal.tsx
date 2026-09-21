'use client';

import React, { useEffect, useState } from 'react';
import { UserProfile, AuditLog, DailySubmission } from '@/lib/types';
import { createBrowserClient } from '@/lib/supabase/client';
import { OrganizationHierarchyView } from './OrganizationHierarchyView';
import { 
  ShieldCheck, 
  Users, 
  KeyRound, 
  History, 
  Plus, 
  Building2, 
  Building,
  CheckCircle2,
  Lock,
  Search,
  Network
} from 'lucide-react';

interface AdminUsersPortalProps {
  auditLogs: AuditLog[];
  submissions: DailySubmission[];
  currentUser: UserProfile;
}

export const AdminUsersPortal: React.FC<AdminUsersPortalProps> = ({
  auditLogs,
  submissions,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'hierarchy' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [users, setUsers] = useState<UserProfile[]>([]);

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

      setUsers((data ?? []) as UserProfile[]);
    }

    loadUsers();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.national_id && u.national_id.includes(searchTerm)) ||
    (u.role_title_ar || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* ترويسة إدارة المنظومة */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                لوحة إدارة النظام والحسابات السيادية (Super Admin)
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                إدارة الصلاحيات، الهيكل الهرمي، المنشآت الصحية، وسجلات الرقابة والتدقيق
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>الحسابات والمستخدمين ({INITIAL_OFFICIAL_ACCOUNTS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'hierarchy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-purple-600" />
            <span>الهيكل الهرمي والمنشآت</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-600" />
            <span>سجل التدقيق الرقمي ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* تبويب إدارة المستخدمين */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="بحث بالاسم أو الرقم القومي..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-2.5 pr-8 rounded-xl font-medium focus:outline-none focus:border-purple-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
            </div>

            <div className="text-xs text-slate-400">
              كلمة المرور الافتراضية لكافة الحسابات الأولية: <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Masar@2026</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
                <tr>
                  <th className="p-3">الاسم الكامل</th>
                  <th className="p-3">الرقم القومي</th>
                  <th className="p-3">الدور والصفة الرسمية</th>
                  <th className="p-3">النطاق الإداري</th>
                  <th className="p-3 text-center">حالة الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                        {u.full_name.slice(0, 1)}
                      </div>
                      <span>{u.full_name}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-600">
                      {u.national_id}
                    </td>
                    <td className="p-3 font-semibold text-purple-700">
                      {u.role_title_ar}
                    </td>
                    <td className="p-3 text-slate-600">
                      {u.district_name_ar ? `${u.district_name_ar} (${u.governorate_name_ar})` :
                       u.governorate_name_ar ? `محافظة ${u.governorate_name_ar}` : 'ديوان عام الوزارة'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        نشط ومُفعّل ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* تبويب سجل التدقيق الرقمي */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              سجل الحركات والرقابة الرقمية غير القابل للتعديل (Immutable Audit Logs)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              إجمالي الحركات: {auditLogs.length}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[500px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px] sticky top-0">
                <tr>
                  <th className="p-3 w-12 text-center">م</th>
                  <th className="p-3">التوقيت والتاريخ</th>
                  <th className="p-3">القائم بالعملية</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">الإدارة المعنية</th>
                  <th className="p-3">تفاصيل الإجراء والملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 text-center font-bold text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono text-slate-600 text-[11px]">{log.timestamp}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{log.actor_name}</div>
                        <div className="text-[10px] text-slate-400">{log.actor_role}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] font-bold text-sky-700">
                        {log.action_type}
                      </td>
                      <td className="p-3 text-slate-700">{log.target_district || '—'}</td>
                      <td className="p-3 text-slate-600 text-xs">{log.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      السجل نظيف. لم تُسجل أي حركات تدقيق بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* تبويب الهيكل الهرمي وإدارة المنشآت */}
      {activeTab === 'hierarchy' && (
        <OrganizationHierarchyView user={currentUser} />
      )}

    </div>
  );
};
