'use client';

import React, { useMemo, useState } from 'react';
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
  X,
  AlertCircle,
  Filter,
  ClipboardCheck,
  Clock3,
  Building2
} from 'lucide-react';

interface DirectorateReviewViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
  timeLock: TimeLockState;
  onDataChanged: () => void;
}

type FilterState = 'all' | 'pending' | 'approved' | 'returned';

export const DirectorateReviewView: React.FC<DirectorateReviewViewProps> = ({
  submissions,
  user,
  timeLock,
  onDataChanged,
}) => {
  const [selectedSub, setSelectedSub] = useState<DailySubmission | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterState>('all');

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter(s => !user.governorate_id || s.governorate_id === user.governorate_id)
      .filter(s => s.district_name_ar.includes(searchQuery.trim()))
      .filter(s => {
        if (filter === 'pending') return s.status === 'SUBMITTED_LOCKED' && s.directorate_status === 'PENDING';
        if (filter === 'approved') return s.directorate_status === 'APPROVED';
        if (filter === 'returned') return s.status === 'RETURNED' || s.directorate_status === 'RETURNED';
        return true;
      });
  }, [submissions, user.governorate_id, searchQuery, filter]);

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
      setSelectedSub(null);
      onDataChanged();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إرجاع البيان');
    }
  };

  const handleGrantOverride = async (districtId: string) => {
    const confirmed = window.confirm('تأكيد منح فتح استثنائي مؤقت لمدة 30 دقيقة للإدارة الصحية؟');
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
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء منح الفتح المؤقت');
    }
  };

  const handleApproveSubmission = async (districtId: string) => {
    const confirmed = window.confirm('تأكيد اعتماد بيان الإدارة الصحية وإرساله للمستوى التالي؟');
    if (!confirmed) return;

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
      setSelectedSub(null);
      onDataChanged();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء اعتماد البيان');
    }
  };

  const statusBadge = (sub: DailySubmission) => {
    if (sub.directorate_status === 'APPROVED') {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold"><CheckCircle2 className="w-3 h-3" />معتمد</span>;
    }
    if (sub.status === 'RETURNED' || sub.directorate_status === 'RETURNED') {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-extrabold"><RotateCcw className="w-3 h-3" />مرجع للتعديل</span>;
    }
    if (sub.status === 'SUBMITTED_LOCKED') {
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eef9f7] border border-[#cae9e5] text-[#087f78] text-[9px] font-extrabold"><Clock3 className="w-3 h-3" />بانتظار المراجعة</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-bold">قيد الإدخال</span>;
  };

  return (
    <div className="space-y-4">
      <div className="gov-surface p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ClipboardCheck className="w-4 h-4 text-[#087f78]" />
              <h2 className="text-sm font-extrabold text-[#172033]">قائمة الإدارات الصحية للمراجعة</h2>
            </div>
            <p className="text-[10px] text-slate-500 leading-5">
              فحص اكتمال الأقسام، مراجعة القيم، ثم اعتماد البيان أو إرجاعه للتعديل.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 min-w-0 lg:min-w-[520px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الإدارة الصحية..."
                className="gov-input h-10 pr-9 pl-3 text-[11px]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#f2f5f8] border border-[#e1e7ed]">
              <Filter className="w-3.5 h-3.5 text-slate-400 mx-1" />
              {[
                ['all', 'الكل'],
                ['pending', 'للمراجعة'],
                ['approved', 'معتمد'],
                ['returned', 'مرجع'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id as FilterState)}
                  className={`h-8 px-2.5 rounded-lg text-[9px] font-extrabold transition ${filter === id ? 'bg-white text-[#087f78] shadow-sm' : 'text-slate-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="gov-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-[#172033]">
            الإدارات التابعة
          </span>
          <span className="text-[10px] text-slate-400 tabular-nums">
            {filteredSubmissions.length} إدارة
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredSubmissions.length === 0 && (
            <div className="py-12 text-center text-[11px] text-slate-400">
              لا توجد إدارات مطابقة للبحث أو الفلتر الحالي.
            </div>
          )}

          {filteredSubmissions.map(sub => {
            const doneCount = Object.values(sub.sections).filter(s => s.status === 'completed').length;
            const completion = Math.round((doneCount / 12) * 100);
            const hasOverride = Boolean(
              sub.override_active &&
              sub.override_expires_at &&
              new Date(sub.override_expires_at).getTime() > Date.now()
            );

            return (
              <div key={sub.id} className="px-4 py-4 sm:px-5 hover:bg-[#fbfcfd] transition">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1.2fr)_150px_160px_minmax(300px,1fr)] gap-4 items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#f1f6f7] text-[#087f78] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-extrabold text-[#172033]">{sub.district_name_ar}</h3>
                        <p className="text-[9px] text-slate-400 mt-1 tabular-nums">{sub.submission_date}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    {statusBadge(sub)}
                    {hasOverride && (
                      <div className="mt-1.5 text-[9px] font-bold text-amber-700">فتح استثنائي نشط</div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1.5">
                      <span>اكتمال الأقسام</span>
                      <span className="font-extrabold text-slate-700 tabular-nums">{doneCount}/12</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#087f78]"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedSub(sub);
                        setIsReturning(false);
                      }}
                      className="h-9 px-3 rounded-lg gov-btn-secondary text-[9px] font-extrabold flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      فحص البيان
                    </button>

                    <button
                      onClick={() => handleGrantOverride(sub.district_id)}
                      className="h-9 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold flex items-center gap-1.5 hover:bg-amber-100 transition"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      فتح مؤقت
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSub(sub);
                        setIsReturning(true);
                      }}
                      className="h-9 px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-extrabold flex items-center gap-1.5 hover:bg-rose-100 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      إرجاع
                    </button>

                    <button
                      onClick={() => handleApproveSubmission(sub.district_id)}
                      className="h-9 px-3.5 rounded-lg bg-[#147d64] border border-[#147d64] text-white text-[9px] font-extrabold flex items-center gap-1.5 hover:bg-[#0f6d57] transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      اعتماد
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedSub && (
        <div className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white border border-[#dce4ec] rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#fbfcfd]">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#087f78]" />
                  <h3 className="text-sm font-extrabold text-[#172033]">{selectedSub.district_name_ar}</h3>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  مراجعة البيان اليومي • <span className="tabular-nums">{selectedSub.submission_date}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSub(null);
                  setIsReturning(false);
                }}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              {isReturning && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-[11px] font-extrabold text-rose-900">إرجاع البيان للتعديل</h4>
                      <p className="text-[9px] text-rose-700 mt-1">اكتب سبب الإرجاع بصورة واضحة ليظهر لموظف الإدارة الصحية.</p>
                      <textarea
                        rows={3}
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                        placeholder="ملاحظات المراجعة وسبب الإرجاع..."
                        className="gov-input min-h-[88px] mt-3 px-3 py-2.5 text-[10px] resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SECTIONS_DEFINITIONS.map(def => {
                  const section = selectedSub.sections[def.code];
                  const completed = section?.status === 'completed';

                  return (
                    <div key={def.code} className="gov-surface-flat p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-2">
                          <span className="w-7 h-7 rounded-lg bg-[#f1f5f7] text-slate-500 flex items-center justify-center text-[9px] font-extrabold tabular-nums">
                            {String(def.code).padStart(2, '0')}
                          </span>
                          <div>
                            <h5 className="text-[10px] font-extrabold text-[#172033]">{def.name_ar}</h5>
                            <p className="text-[8px] text-slate-400 mt-1">{def.group_name_ar}</p>
                          </div>
                        </div>

                        <span className={`px-2 py-1 rounded-lg text-[8px] font-extrabold ${completed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                          {completed ? 'مكتمل' : 'فارغ'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          [def.field_1_label, section?.field_1_value || 0],
                          [def.field_2_label, section?.field_2_value || 0],
                          [def.field_3_label, section?.field_3_value || 0],
                        ].map(([label, value], index) => (
                          <div key={index} className="rounded-lg bg-[#f8fafb] border border-slate-100 p-2.5 text-center">
                            <div className="text-[8px] text-slate-400 truncate">{label}</div>
                            <div className="text-sm font-extrabold text-[#172033] mt-1 tabular-nums">{value}</div>
                          </div>
                        ))}
                      </div>

                      {section?.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-[9px] text-slate-500 leading-5">
                          {section.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-[#fbfcfd] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-[9px] text-slate-400">
                نافذة مراجعة المديرية حتى <strong className="text-slate-600 tabular-nums">{timeLock.directorate_deadline}</strong>
              </span>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setSelectedSub(null);
                    setIsReturning(false);
                  }}
                  className="h-9 px-4 rounded-lg gov-btn-secondary text-[9px] font-bold"
                >
                  إغلاق
                </button>

                {isReturning ? (
                  <button
                    onClick={() => handleReturnSubmission(selectedSub.district_id)}
                    className="h-9 px-4 rounded-lg bg-rose-600 text-white text-[9px] font-extrabold hover:bg-rose-700 transition"
                  >
                    تأكيد الإرجاع
                  </button>
                ) : (
                  <button
                    onClick={() => handleApproveSubmission(selectedSub.district_id)}
                    className="h-9 px-4 rounded-lg bg-[#147d64] text-white text-[9px] font-extrabold hover:bg-[#0f6d57] transition"
                  >
                    اعتماد البيان
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
