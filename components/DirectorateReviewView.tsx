'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { SECTIONS_DEFINITIONS } from '@/lib/constants';
import { MasarService } from '@/lib/masar-service';
import { persistDailySubmission, writeAuditEvent } from '@/lib/services/submissions-client';
import { 
  CheckCircle2, 
  RotateCcw, 
  Unlock, 
  Eye, 
  Search,
  Building,
  User,
  X,
  AlertCircle
} from 'lucide-react';

interface DirectorateReviewViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
  timeLock: TimeLockState;
  onDataChanged: () => void;
}

export const DirectorateReviewView: React.FC<DirectorateReviewViewProps> = ({
  submissions,
  user,
  timeLock,
  onDataChanged,
}) => {
  const [selectedSub, setSelectedSub] = useState<DailySubmission | null>(null);
  const [returnReason, setReturnReason] = useState<string>('');
  const [isReturning, setIsReturning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const govSubmissions = submissions.filter(
    s => !user.governorate_id || s.governorate_id === user.governorate_id
  ).filter(
    s => s.district_name_ar.includes(searchQuery)
  );

  const handleReturnSubmission = async (districtId: string) => {
    if (!returnReason.trim()) {
      alert('يرجى كتابة سبب إرجاع البيان بوضوح للإدارة الصحية.');
      return;
    }

    try {
      const updated = MasarService.returnSubmission(districtId, returnReason.trim(), user);
      const persisted = await persistDailySubmission(updated, user);
      await writeAuditEvent({
        user,
        action: 'SUBMISSION_RETURNED',
        entity: 'daily_submissions',
        entityId: persisted.id,
        metadata: {
          actor_name: user.full_name,
          actor_role: user.role_title_ar,
          description: `إرجاع بيان إدارة (${persisted.district_name_ar}) للتعديل - السبب: ${returnReason.trim()}`,
          target_district: persisted.district_name_ar,
        },
      });
      setIsReturning(false);
      setReturnReason('');
      onDataChanged();
      alert('تم إرجاع البيان بنجاح للإدارة الصحية للتعديل.');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const handleGrantOverride = async (districtId: string) => {
    const confirmed = window.confirm(
      'تأكيد منح فتح استثنائي مؤقت لمدة (30 دقيقة) للإدارة الصحية؟'
    );
    if (!confirmed) return;

    try {
      const updated = MasarService.grantOverride(districtId, user);
      const persisted = await persistDailySubmission(updated, user);
      await writeAuditEvent({
        user,
        action: 'OVERRIDE_GRANTED',
        entity: 'daily_submissions',
        entityId: persisted.id,
        metadata: {
          actor_name: user.full_name,
          actor_role: user.role_title_ar,
          description: `منح فتح استثنائي لمدة 30 دقيقة لإدارة (${persisted.district_name_ar})`,
          target_district: persisted.district_name_ar,
        },
      });
      onDataChanged();
      alert('تم منح فتح استثنائي للإدارة لمدة 30 دقيقة.');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const handleApproveSubmission = async (districtId: string) => {
    try {
      const updated = MasarService.approveDirectorateSubmission(districtId, user);
      const persisted = await persistDailySubmission(updated, user);
      await writeAuditEvent({
        user,
        action: 'DIRECTORATE_APPROVE',
        entity: 'daily_submissions',
        entityId: persisted.id,
        metadata: {
          actor_name: user.full_name,
          actor_role: user.role_title_ar,
          description: `اعتماد بيان إدارة (${persisted.district_name_ar}) من المديرية`,
          target_district: persisted.district_name_ar,
        },
      });
      onDataChanged();
      alert('تم اعتماد بيان الإدارة الصحية بنجاح.');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  return (
    <div className="space-y-5">
      
      {/* بطاقة الترويسة لمديرية المحافظة */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">
              مديرية الشئون الصحية — محافظة {user.governorate_name_ar || 'القاهرة'}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold border border-sky-200">
              مستوى المراجعة والتدقيق
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            المشرف المسؤول: <strong className="text-slate-800">{user.full_name}</strong> • نافذة الفحص متاحة حتى 06:00 م
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالإدارة الصحية..."
            className="w-full text-xs py-2 pr-9 pl-3 rounded-lg border border-slate-200 focus:border-sky-500 focus:outline-none bg-slate-50 text-slate-800"
          />
        </div>
      </div>

      {/* جدول إدارات المحافظة */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
          <span>الإدارات الصحية التابعة ({govSubmissions.length})</span>
          <span className="font-normal text-slate-400">تدقيق إحصائيات الأقسام الـ 12</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3 font-semibold">الإدارة الصحية</th>
                <th className="p-3 font-semibold">حالة الإدخال</th>
                <th className="p-3 font-semibold">الأقسام المكتملة</th>
                <th className="p-3 font-semibold">حالة المديرية</th>
                <th className="p-3 font-semibold">الفتح المؤقت</th>
                <th className="p-3 font-semibold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {govSubmissions.map((sub) => {
                const doneCount = Object.values(sub.sections).filter(s => s.status === 'completed').length;
                const hasOverride = sub.override_active && sub.override_expires_at && new Date(sub.override_expires_at).getTime() > Date.now();

                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">
                      {sub.district_name_ar}
                    </td>

                    <td className="p-3">
                      {sub.status === 'DRAFT' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          قيد الإدخال
                        </span>
                      )}
                      {sub.status === 'SUBMITTED_LOCKED' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          تم الرفع ومقفل
                        </span>
                      )}
                      {sub.status === 'RETURNED' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          مُرجع للتعديل
                        </span>
                      )}
                      {sub.status === 'APPROVED' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          معتمد
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono">
                      <strong className="text-slate-900">{doneCount}</strong>/12
                    </td>

                    <td className="p-3">
                      {sub.directorate_status === 'APPROVED' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>معتمد</span>
                        </span>
                      ) : sub.directorate_status === 'RETURNED' ? (
                        <span className="text-rose-600 font-bold">تم الإرجاع</span>
                      ) : (
                        <span className="text-slate-400">قيد المراجعة</span>
                      )}
                    </td>

                    <td className="p-3">
                      {hasOverride ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          مفتوح مؤقتاً
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>فحص</span>
                        </button>

                        <button
                          onClick={() => handleGrantOverride(sub.district_id)}
                          className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition"
                          title="منح فتح استثنائي مؤقت"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>فتح مؤقت</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setIsReturning(true);
                          }}
                          className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إرجاع</span>
                        </button>

                        <button
                          onClick={() => handleApproveSubmission(sub.district_id)}
                          className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                        >
                          <span>اعتماد</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة الفحص للأقسام الـ 12 */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  فحص بيان: {selectedSub.district_name_ar}
                </h3>
                <p className="text-xs text-slate-500">تاريخ: {selectedSub.submission_date}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedSub(null);
                  setIsReturning(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {isReturning && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>سبب إرجاع البيان للإدارة للتعديل:</span>
                  </div>
                  <textarea
                    rows={2}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="اكتب ملاحظات الفحص بوضوح..."
                    className="w-full text-xs p-2.5 rounded-lg border border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsReturning(false)}
                      className="px-3 py-1 text-xs text-slate-600"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={() => handleReturnSubmission(selectedSub.district_id)}
                      className="px-3.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-md hover:bg-rose-700"
                    >
                      تأكيد الإرجاع
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {SECTIONS_DEFINITIONS.map(def => {
                  const s = selectedSub.sections[def.code];
                  return (
                    <div key={def.code} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-2">
                        <span>{def.code}. {def.name_ar}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          s?.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {s?.status === 'completed' ? 'مكتمل' : 'فارغ'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white p-1.5 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-400 truncate">{def.field_1_label}</div>
                          <div className="font-bold text-slate-900 mt-0.5">{s?.field_1_value || 0}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-400 truncate">{def.field_2_label}</div>
                          <div className="font-bold text-sky-700 mt-0.5">{s?.field_2_value || 0}</div>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-400 truncate">{def.field_3_label}</div>
                          <div className="font-bold text-emerald-700 mt-0.5">{s?.field_3_value || 0}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
