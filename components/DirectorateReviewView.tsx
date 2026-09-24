'use client';

import React, { useMemo, useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { SECTIONS_DEFINITIONS } from '@/lib/constants';
import {
  approveDirectorateSubmission,
  returnDirectorateSubmission,
  writeAuditEvent,
} from '@/lib/services/submissions-client';
import { OperationFeedbackDialog } from './OperationFeedbackDialog';
import { ConfirmationDialog } from './ConfirmationDialog';
import { SubmissionMonitoringTable } from './SubmissionMonitoringTable';
import {
  CheckCircle2,
  RotateCcw,
  Search,
  X,
  AlertCircle,
  Filter,
  ClipboardCheck,
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
  const [operationError, setOperationError] = useState<{ title: string; message: string } | null>(null);
  const [confirmation, setConfirmation] = useState<{ type: 'approve'; districtId: string } | null>(null);

  const filteredSubmissions = useMemo(() => {
    if (!user.governorate_id) return [];

    return submissions
      .filter(s => s.governorate_id === user.governorate_id)
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
      setOperationError({
        title: 'سبب الإرجاع مطلوب',
        message: 'اكتب سبب إرجاع البيان بصورة واضحة حتى يظهر لموظف الإدارة الصحية قبل تأكيد الإرجاع.',
      });
      return;
    }

    try {
      const currentSubmission = user.governorate_id
        ? submissions.find(
            s => s.district_id === districtId && s.governorate_id === user.governorate_id
          )
        : undefined;
      if (!currentSubmission) throw new Error('SUBMISSION_NOT_FOUND');
      const persisted = await returnDirectorateSubmission(
        currentSubmission.id,
        returnReason.trim(),
        user
      );
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
    } catch (error) {
      console.error('Failed to return directorate submission.', error);
      setOperationError({
        title: 'تعذر إرجاع البيان',
        message: 'لم نتمكن من إرجاع البيان للإدارة الصحية الآن. أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
      });
    }
  };

  const handleApproveSubmission = async (districtId: string) => {
    try {
      const currentSubmission = user.governorate_id
        ? submissions.find(
            s => s.district_id === districtId && s.governorate_id === user.governorate_id
          )
        : undefined;
      if (!currentSubmission) throw new Error('SUBMISSION_NOT_FOUND');
      const persisted = await approveDirectorateSubmission(currentSubmission.id);
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
    } catch (error) {
      console.error('Failed to approve directorate submission.', error);
      setOperationError({
        title: 'تعذر اعتماد البيان',
        message: 'لم يتم اعتماد البيان في الوقت الحالي. أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
      });
    }
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

      <SubmissionMonitoringTable
        submissions={filteredSubmissions}
        title="الإدارات التابعة"
        description="صف واحد لكل إدارة صحية، مع وقت التسجيل والاكتمال. فتح التفاصيل لا ينفذ طلبًا جديدًا."
        onView={(sub) => {
          setSelectedSub(sub);
          setIsReturning(false);
        }}
        renderActions={(sub) => {
          const canReview =
            sub.status === 'SUBMITTED_LOCKED' &&
            sub.directorate_status === 'PENDING';

          if (!canReview) {
            return (
              <span className="h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[8px] font-extrabold inline-flex items-center">
                {sub.status === 'RETURNED' || sub.directorate_status === 'RETURNED'
                  ? 'بانتظار إعادة الإرسال'
                  : sub.directorate_status === 'APPROVED'
                    ? 'تمت المراجعة'
                    : 'غير جاهز للمراجعة'}
              </span>
            );
          }

          return (
            <>
              <div className="relative group">
                <button
                  onClick={() => { setSelectedSub(sub); setIsReturning(true); }}
                  className="h-8 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[8px] font-extrabold inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> إرجاع
                </button>
                <div className="pointer-events-none absolute z-50 bottom-full right-1/2 translate-x-1/2 mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <div className="rounded-xl bg-slate-900 text-white px-3 py-2.5 shadow-xl text-[9px] leading-5">
                    <div className="font-extrabold mb-0.5">إرجاع البيان للتعديل</div>
                    <div className="text-slate-300">
                      يعاد البيان للإدارة الصحية صاحبة البيانات لتصحيحه. بعد إعادة الإرسال يعود تلقائيًا لقائمة المراجعة.
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 mx-auto -mt-1.5" />
                </div>
              </div>

              <div className="relative group">
                <button
                  onClick={() => setConfirmation({ type: 'approve', districtId: sub.district_id })}
                  className="h-8 px-2.5 rounded-lg bg-[#147d64] border border-[#147d64] text-white text-[8px] font-extrabold inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> اعتماد
                </button>
                <div className="pointer-events-none absolute z-50 bottom-full right-1/2 translate-x-1/2 mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                  <div className="rounded-xl bg-slate-900 text-white px-3 py-2.5 shadow-xl text-[9px] leading-5">
                    <div className="font-extrabold mb-0.5">اعتماد البيان</div>
                    <div className="text-slate-300">
                      يعتمد البيان كما أرسلته الإدارة الصحية دون تعديل قيمه، ثم ينتقل للمستوى التالي.
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 mx-auto -mt-1.5" />
                </div>
              </div>
            </>
          );
        }}
      />

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
                    onClick={() => setConfirmation({ type: 'approve', districtId: selectedSub.district_id })}
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
      <ConfirmationDialog
        open={Boolean(confirmation)}
        title="اعتماد البيان"
        message="سيتم اعتماد بيان الإدارة الصحية كما أرسلته الجهة صاحبة البيانات وإرساله للمستوى التالي. هل تريد المتابعة؟"
        confirmLabel="اعتماد البيان"
        tone="success"
        onConfirm={async () => {
          const current = confirmation;
          setConfirmation(null);
          if (!current) return;
          await handleApproveSubmission(current.districtId);
        }}
        onCancel={() => setConfirmation(null)}
      />

      <OperationFeedbackDialog
        open={Boolean(operationError)}
        type="error"
        title={operationError?.title || 'تعذر إتمام العملية'}
        message={operationError?.message || 'حدث خطأ غير متوقع.'}
        onClose={() => setOperationError(null)}
        onRetry={() => setOperationError(null)}
      />

    </div>
  );
};
