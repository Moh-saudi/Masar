'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  UserCheck, 
  ArrowLeft, 
  FileText,
  Calendar,
  Unlock,
  RefreshCw,
  Info
} from 'lucide-react';

interface DistrictExceptionsLogViewProps {
  submissions: DailySubmission[];
  currentSubmission: DailySubmission;
  user: UserProfile;
  timeLock: TimeLockState;
  onSelectSubmissionToEdit: (submissionId: string) => void;
  onRequestOverride: () => void;
}

export const DistrictExceptionsLogView: React.FC<DistrictExceptionsLogViewProps> = ({
  submissions,
  currentSubmission,
  user,
  timeLock,
  onSelectSubmissionToEdit,
  onRequestOverride,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'returned' | 'overrides'>('all');

  // استخراج كافة البيانات المرجعة للتعديل الخاصة بهذه الإدارة
  const returnedSubmissions = React.useMemo(() => {
    return submissions.filter(s => s.status === 'RETURNED' || Boolean(s.returned_reason));
  }, [submissions]);

  // استخراج كافة السجلات التي لها استثناءات نشطة أو سابقة
  const overrideSubmissions = React.useMemo(() => {
    return submissions.filter(s => s.override_active || Boolean(s.override_granted_at));
  }, [submissions]);

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* 1. الترويسة وبطاقة الملخص */}
      <div className="gov-surface p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#172033]">
                سجل الاستثناءات والإرجاعات الرسمية
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                أرشيف وسجل تتبعي لكافة طلبات الفتح الاستثنائي والبيانات المُرجعة من المديرية لـ ({user.district_name_ar || currentSubmission.district_name_ar})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRequestOverride}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-2 transition shadow-xs cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>تقديم طلب فتح استثنائي</span>
          </button>
        </div>
      </div>

      {/* 2. شريط التصفية والتبويب */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            كافة السجلات ({returnedSubmissions.length + overrideSubmissions.length})
          </button>

          <button
            onClick={() => setFilterType('returned')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'returned' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-rose-700'
            }`}
          >
            <span>البيانات المُرجعة للتعديل</span>
            {returnedSubmissions.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-[10px] flex items-center justify-center font-bold">
                {returnedSubmissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterType('overrides')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'overrides' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500 hover:text-amber-800'
            }`}
          >
            <span>رخص الفتح الاستثنائي</span>
            {overrideSubmissions.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-[10px] flex items-center justify-center font-bold">
                {overrideSubmissions.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>يتم توثيق كل إجراء تلقائياً بسجل التدقيق الإلكتروني التابع للوزارة</span>
        </div>
      </div>

      {/* 3. قائمة البيانات المرجعة من المديرية للتعديل */}
      {(filterType === 'all' || filterType === 'returned') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>البيانات المُرجعة من المديرية للتعديل والاستكمال</span>
          </div>

          {returnedSubmissions.length === 0 ? (
            <div className="gov-surface p-6 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 stroke-1" />
              <p className="font-bold text-slate-700">لا توجد أي بيانات مُرجعة للتعديل حالياً</p>
              <p className="text-[11px] text-slate-400 mt-1">كافة البيانات المرسلة للمديرية معتمدة أو قيد الفحص النظامي.</p>
            </div>
          ) : (
            returnedSubmissions.map((sub) => (
              <div 
                key={`ret-${sub.id}`}
                className="bg-white border-2 border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs transition hover:border-rose-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-rose-100">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                      <AlertCircle className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          بيان يوم ({sub.submission_date})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          مُرجع للتعديل
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sub.district_name_ar} — مديرية الشئون الصحية بمحافظة {sub.governorate_name_ar}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectSubmissionToEdit(sub.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 transition shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <span>فتح البيان للتعديل واستكماله</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl p-3.5 text-xs text-rose-950">
                  <div className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                    <span>ملاحظات المديرية وسبب الإرجاع:</span>
                  </div>
                  <p className="font-mono text-[12px] bg-white p-2.5 rounded-lg border border-rose-200/70 text-rose-900 leading-relaxed font-bold">
                    "{sub.returned_reason || 'يرجى مراجعة وتدقيق أرقام الحقول ومطابقتها للكشوف الورقية المعتمدة'}"
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-rose-200/60 text-[11px] text-rose-800">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-rose-600" />
                      <span>القائم بالإرجاع: <strong>{sub.returned_by || 'مدير تنظيم الأسرة بالمديرية'}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>توقيت الإرجاع: {sub.returned_at || sub.updated_at}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. قائمة رخص الفتح الاستثنائي (Overrides) */}
      {(filterType === 'all' || filterType === 'overrides') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-900">
            <Unlock className="w-4 h-4 text-amber-600" />
            <span>سجل رخص وطلبات الفتح الاستثنائي</span>
          </div>

          {overrideSubmissions.length === 0 ? (
            <div className="gov-surface p-6 text-center text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-1" />
              <p className="font-bold text-slate-600">لا توجد طلبات فتح استثنائي مسجلة</p>
              <p className="text-[11px] text-slate-400 mt-1">يتم تقديم الطلبات إلى المديرية في حال الحاجة لتعديل بيان بعد الإغلاق.</p>
            </div>
          ) : (
            overrideSubmissions.map((sub) => {
              const isActive = sub.override_active && sub.override_expires_at && new Date(sub.override_expires_at).getTime() > Date.now();

              return (
                <div 
                  key={`ovr-${sub.id}`}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition ${
                    isActive ? 'border-2 border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`p-2 rounded-xl ${isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        <Unlock className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            فتح استثنائي لبيان يوم ({sub.submission_date})
                          </span>
                          {isActive ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                              مفتوح للتعديل الآن
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              منتهي الصلاحية
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          رخصة مؤقتة للتعديل صادرة بقرار مديرية الشئون الصحية
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <button
                        onClick={() => onSelectSubmissionToEdit(sub.id)}
                        className="px-4 py-2 rounded-xl bg-[#087f78] hover:bg-[#066963] text-white text-xs font-black flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                      >
                        <span>متابعة الإدخال والتعديل</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3.5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>المسؤول المانح للفتح: <strong>{sub.override_granted_by || 'وكيل الوزارة / مدير تنظيم الأسرة بالمديرية'}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>توقيت المنح: {sub.override_granted_at || 'مسجل'}</span>
                      </div>
                    </div>

                    {isActive && sub.override_expires_at && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-amber-800 text-[11px] font-bold flex items-center justify-between">
                        <span>موعد انتهاء الفتح المؤقت:</span>
                        <span className="font-mono text-xs">{new Date(sub.override_expires_at).toLocaleTimeString('ar-EG')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};
