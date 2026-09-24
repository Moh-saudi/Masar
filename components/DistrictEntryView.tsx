'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DailySubmission, TimeLockState, UserProfile } from '@/lib/types';
import { SECTION_GROUPS, SECTIONS_DEFINITIONS } from '@/lib/constants';
import { MasarService } from '@/lib/masar-service';
import { persistDailySubmission, writeAuditEvent } from '@/lib/services/submissions-client';
import { OperationFeedbackDialog } from './OperationFeedbackDialog';
import { ConfirmationDialog } from './ConfirmationDialog';
import {
  Save,
  Send,
  Lock,
  LayoutList,
  Table2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calculator,
  MessageSquareText,
  RefreshCw,
  ClipboardCheck,
  Clock3,
  AlertCircle
} from 'lucide-react';

interface DistrictEntryViewProps {
  submission: DailySubmission;
  user: UserProfile;
  timeLock: TimeLockState;
  onSubmissionUpdated: (updated: DailySubmission) => void;
  onRequestOverride: () => void;
}

type MatrixRow = {
  f1: number;
  f2: number;
  f3: number;
  notes: string;
};

export const DistrictEntryView: React.FC<DistrictEntryViewProps> = ({
  submission,
  user,
  timeLock,
  onSubmissionUpdated,
  onRequestOverride,
}) => {
  const [mode, setMode] = useState<'guided' | 'matrix'>('guided');
  const [activeGroup, setActiveGroup] = useState<1 | 2 | 3>(1);
  const [activeSectionCode, setActiveSectionCode] = useState(1);
  const [f1, setF1] = useState('0');
  const [f2, setF2] = useState('0');
  const [f3, setF3] = useState('0');
  const [notes, setNotes] = useState('');
  const [matrixValues, setMatrixValues] = useState<Record<number, MatrixRow>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<{ title: string; message: string } | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const isReturned =
    submission.status === 'RETURNED' || submission.directorate_status === 'RETURNED';
  const hasActiveOverride = Boolean(
    submission.override_active && 
    submission.override_expires_at && 
    new Date(submission.override_expires_at).getTime() > Date.now()
  );

  // البيان المرجع للتعديل بقرار المديرية مفتوح دائماً وفوراً للتعديل دون أي قفل
  // الاستثناء الساري يفتح التعديل فوراً
  // بيان المسودة يتيح التعديل والحفظ كمسودة في أي وقت
  // يقفل فقط إذا كان معتمداً (APPROVED) أو مرسلاً للمراجعة (SUBMITTED_LOCKED) بدون استثناء ساري
  const isLocked = !isReturned && (
    submission.status === 'APPROVED' || 
    (submission.status === 'SUBMITTED_LOCKED' && !hasActiveOverride)
  );

  const isBeforeOpeningHours = Boolean(
    timeLock.is_district_before_open && 
    submission.status === 'DRAFT' && 
    !hasActiveOverride && 
    !isReturned
  );
  const isSubmittedLocked = Boolean(submission.status === 'SUBMITTED_LOCKED' && !hasActiveOverride && !isReturned);

  const activeDefinition =
    SECTIONS_DEFINITIONS.find(def => def.code === activeSectionCode) ??
    SECTIONS_DEFINITIONS[0];

  const activeGroupSections = useMemo(
    () => SECTIONS_DEFINITIONS.filter(def => def.group_id === activeGroup),
    [activeGroup]
  );

  const completedSections = useMemo(
    () => Object.values(submission.sections).filter(sec => sec.status === 'completed').length,
    [submission.sections]
  );

  const emptySectionNames = useMemo(() => {
    return SECTIONS_DEFINITIONS.filter(def => {
      if (mode === 'matrix') {
        const row = matrixValues[def.code];
        return !row || ((row.f1 || 0) === 0 && (row.f2 || 0) === 0 && (row.f3 || 0) === 0);
      } else {
        if (def.code === activeSectionCode) {
          return (Number(f1) || 0) === 0 && (Number(f2) || 0) === 0 && (Number(f3) || 0) === 0;
        }
        const sec = submission.sections[def.code];
        return !sec || ((sec.field_1_value || 0) === 0 && (sec.field_2_value || 0) === 0 && (sec.field_3_value || 0) === 0);
      }
    }).map(def => def.name_ar);
  }, [mode, matrixValues, activeSectionCode, f1, f2, f3, submission.sections]);

  useEffect(() => {
    const section = submission.sections[activeSectionCode];
    setF1(String(section?.field_1_value ?? 0));
    setF2(String(section?.field_2_value ?? 0));
    setF3(String(section?.field_3_value ?? 0));
    setNotes(section?.notes ?? '');
  }, [activeSectionCode, submission]);

  useEffect(() => {
    const next: Record<number, MatrixRow> = {};
    SECTIONS_DEFINITIONS.forEach(def => {
      const section = submission.sections[def.code];
      next[def.code] = {
        f1: section?.field_1_value ?? 0,
        f2: section?.field_2_value ?? 0,
        f3: section?.field_3_value ?? 0,
        notes: section?.notes ?? '',
      };
    });
    setMatrixValues(next);
  }, [submission]);

  const showStatus = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveCurrentSection = async () => {
    if (isLocked || isSaving) return;

    setIsSaving(true);
    try {
      const updated = MasarService.updateSectionData(
        submission.district_id,
        activeSectionCode,
        {
          field_1_value: Number(f1) || 0,
          field_2_value: Number(f2) || 0,
          field_3_value: Number(f3) || 0,
          notes: notes.trim(),
        },
        user,
        submission.id
      );

      const persisted = await persistDailySubmission(updated, user);
      onSubmissionUpdated(persisted);
      const isZeroOnly = (Number(f1) || 0) === 0 && (Number(f2) || 0) === 0 && (Number(f3) || 0) === 0;
      showStatus(
        isZeroOnly
          ? 'تم حفظ القسم كمسودة عمل (قيم صفرية - غير مكتمل)'
          : 'تم حفظ بيانات القسم كمسودة عمل بنجاح'
      );
      return persisted;
    } catch {
      setOperationError({
        title: 'تعذر حفظ بيانات القسم',
        message: 'لم نتمكن من حفظ بيانات القسم الآن. تحقق من الاتصال وحاول مرة أخرى، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMatrix = async () => {
    if (isLocked || isSaving) return;

    setIsSaving(true);
    try {
      const payload: Record<number, {
        field_1_value: number;
        field_2_value: number;
        field_3_value: number;
        notes?: string;
      }> = {};

      Object.entries(matrixValues).forEach(([code, value]) => {
        payload[Number(code)] = {
          field_1_value: value.f1 || 0,
          field_2_value: value.f2 || 0,
          field_3_value: value.f3 || 0,
          notes: value.notes || '',
        };
      });

      const updated = MasarService.updateAllSectionsBulk(
        submission.district_id,
        payload,
        user,
        submission.id
      );
      const persisted = await persistDailySubmission(updated, user);
      onSubmissionUpdated(persisted);
      showStatus('تم حفظ جميع الأقسام كمسودة عمل بنجاح');
      return persisted;
    } catch {
      setOperationError({
        title: 'تعذر حفظ البيانات',
        message: 'لم نتمكن من حفظ بيانات الأقسام الآن. حاول مرة أخرى، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleSubmitReport = async () => {
    if (isLocked || isSaving) return;

    setIsSaving(true);
    try {
      if (mode === 'matrix') {
        const payload: Record<number, {
          field_1_value: number;
          field_2_value: number;
          field_3_value: number;
          notes?: string;
        }> = {};

        Object.entries(matrixValues).forEach(([code, value]) => {
          payload[Number(code)] = {
            field_1_value: value.f1 || 0,
            field_2_value: value.f2 || 0,
            field_3_value: value.f3 || 0,
            notes: value.notes || '',
          };
        });

        MasarService.updateAllSectionsBulk(submission.district_id, payload, user, submission.id);
      } else {
        MasarService.updateSectionData(
          submission.district_id,
          activeSectionCode,
          {
            field_1_value: Number(f1) || 0,
            field_2_value: Number(f2) || 0,
            field_3_value: Number(f3) || 0,
            notes: notes.trim(),
          },
          user,
          submission.id
        );
      }

      const submitted = MasarService.submitDistrictDailyReport(submission.district_id, user, submission.id);
      const persisted = await persistDailySubmission(submitted, user);

      await writeAuditEvent({
        user,
        action: 'DISTRICT_SUBMIT',
        entity: 'daily_submissions',
        entityId: persisted.id,
        metadata: {
          actor_name: user.full_name,
          actor_role: user.role_title_ar,
          description: `إرسال البيان اليومي لإدارة (${persisted.district_name_ar}) إلى المديرية للمراجعة`,
          target_district: persisted.district_name_ar,
        },
      });

      onSubmissionUpdated(persisted);
      showStatus('تم إرسال البيان للمراجعة');
    } catch {
      setOperationError({
        title: 'تعذر إرسال البيان',
        message: 'لم يتم إرسال البيان إلى المديرية. راجع الاتصال ثم أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const moveSection = async (direction: 'next' | 'prev') => {
    if (!isLocked) {
      await handleSaveCurrentSection();
    }
    const currentIndex = SECTIONS_DEFINITIONS.findIndex(def => def.code === activeSectionCode);
    const targetIndex = direction === 'next'
      ? Math.min(SECTIONS_DEFINITIONS.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

    const target = SECTIONS_DEFINITIONS[targetIndex];
    setActiveSectionCode(target.code);
    setActiveGroup(target.group_id);
  };

  const switchSection = async (targetCode: number) => {
    if (!isLocked && targetCode !== activeSectionCode) {
      await handleSaveCurrentSection();
    }
    const target = SECTIONS_DEFINITIONS.find(def => def.code === targetCode) ?? SECTIONS_DEFINITIONS[0];
    setActiveSectionCode(target.code);
    setActiveGroup(target.group_id);
  };

  const conversionRate = activeSectionCode === 12
    ? null
    : (Number(f1) || 0) > 0
      ? Math.round(((Number(f2) || 0) / (Number(f1) || 1)) * 100)
      : 0;

  return (
    <div className="space-y-4">

      <div className="gov-surface px-4 py-3 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#eaf9f7] text-[#087f78] flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#172033]">استمارة الإدخال اليومية</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              استخدم الإدخال الموجّه للمراجعة الدقيقة أو الجدول السريع لإدخال جميع الأقسام.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 rounded-xl bg-[#f2f5f8] border border-[#e1e7ed]">
            <button
              onClick={() => setMode('guided')}
              className={`h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${mode === 'guided' ? 'bg-white shadow-sm text-[#087f78]' : 'text-slate-500'}`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              إدخال موجّه
            </button>
            <button
              onClick={() => setMode('matrix')}
              className={`h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${mode === 'matrix' ? 'bg-white shadow-sm text-[#087f78]' : 'text-slate-500'}`}
            >
              <Table2 className="w-3.5 h-3.5" />
              الجدول الشامل
            </button>
          </div>

          {isLocked ? (
            <button
              onClick={onRequestOverride}
              className="h-10 px-4 rounded-xl bg-[#fff7e8] border border-[#f0d39b] text-[#93600d] text-[11px] font-extrabold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Lock className="w-4 h-4" />
              <span>طلب فتح للتعديل</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={mode === 'guided' ? handleSaveCurrentSection : handleSaveMatrix}
                disabled={isSaving}
                className="h-10 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-[11px] font-extrabold flex items-center gap-2 disabled:opacity-60 shadow-xs cursor-pointer"
                title="حفظ البيانات كمسودة عمل دون إرسالها للمديرية"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-600" /> : <Save className="w-4 h-4 text-amber-600" />}
                <span>حفظ كمسودة</span>
              </button>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSaving}
                className="h-10 px-4 rounded-xl gov-btn-primary text-[11px] font-extrabold flex items-center gap-2 disabled:opacity-60 shadow-xs cursor-pointer"
                title="إرسال البيان رسمياً إلى مديرية الشئون الصحية للمراجعة والاعتماد"
              >
                <Send className="w-4 h-4" />
                <span>إرسال للمديرية</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* تنبيه البيان المرجع للتعديل */}
      {isReturned && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3.5 text-xs text-rose-950 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-black text-sm text-rose-900">
                بيان يوم ({submission.submission_date}) مفتوح حالياً للتعديل والاستكمال بناءً على قرار الإرجاع من المديرية
              </p>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900">
                مُرجع للتعديل
              </span>
            </div>
            <p className="text-[11px] text-rose-800 mt-1.5 font-mono bg-white/90 p-2.5 rounded-lg border border-rose-200 leading-relaxed font-bold">
              سبب وملاحظات المديرية: "{submission.returned_reason || 'يرجى مراجعة وتدقيق الحقول واستكمالها'}"
            </p>
            <p className="text-[10px] text-rose-700 mt-1.5 font-bold">
              كافة حقول هذا البيان مفتوحة للتعديل الآن. يمكنك حفظ التعديلات كمسودة، ثم الضغط على «إرسال للمديرية» لإعادة تقديمه.
            </p>
          </div>
        </div>
      )}

      {/* تنبيه نافذة فتح الإدخال (09:00 ص) */}
      {isBeforeOpeningHours && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <Clock3 className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-black text-sm">نافذة تسجيل البيانات تبدأ في تمام الساعة 09:00 صباحاً</p>
            <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
              وفقاً لقواعد التشغيل والحوكمة المعتمدة، تبدأ الإدارة الصحية تسجيل وتعديل البيانات التجميعية من الساعة 09:00 ص وحتى 03:00 م. الحقول مقفلة مؤقتاً حتى موعد الفتح الرسمي.
            </p>
          </div>
        </div>
      )}

      {/* تنبيه البيان المرسل والمقفل */}
      {isSubmittedLocked && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-black">تم إرسال هذا البيان بنجاح إلى مديرية الشئون الصحية</p>
            <p className="text-[11px] text-blue-800 mt-1">
              البيان مقفل حالياً للمراجعة والاعتماد لدى المديرية. إذا كنت بحاجة لإجراء تعديل طارئ، يمكنك تقديم طلب فتح استثنائي مؤقت.
            </p>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 flex items-center gap-2 text-[11px] font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {mode === 'guided' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">

          <div className="gov-surface p-3 lg:sticky lg:top-[94px] self-start">
            <p className="text-[10px] font-extrabold text-slate-400 px-2 pt-1 pb-2">مجموعات البيان</p>

            <div className="space-y-1">
              {SECTION_GROUPS.map(group => {
                const groupSections = SECTIONS_DEFINITIONS.filter(def => def.group_id === group.id);
                const done = groupSections.filter(def => submission.sections[def.code]?.status === 'completed').length;

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveGroup(group.id);
                      setActiveSectionCode(groupSections[0].code);
                    }}
                    className="gov-nav-item"
                    data-active={activeGroup === group.id}
                  >
                    <span className="w-6 h-6 rounded-lg border border-current/15 bg-white/70 flex items-center justify-center text-[10px] tabular-nums">
                      {group.id}
                    </span>
                    <span className="flex-1 text-right leading-5">
                      {group.name_ar.replace(/^المجموعة [^:]+:\s*/, '')}
                    </span>
                    <span className="text-[9px] tabular-nums">{done}/{groupSections.length}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 mt-3 pt-3">
              <p className="text-[10px] font-extrabold text-slate-400 px-2 pb-2">أقسام المجموعة</p>
              <div className="space-y-1">
                {activeGroupSections.map(def => {
                  const complete = submission.sections[def.code]?.status === 'completed';
                  return (
                    <button
                      key={def.code}
                      onClick={() => switchSection(def.code)}
                      className={`w-full px-2.5 py-2 rounded-lg flex items-center gap-2 text-[10px] text-right transition ${activeSectionCode === def.code ? 'bg-[#f0f8f7] text-[#066963] font-extrabold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {complete
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        : <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                      <span className="flex-1 leading-5">{def.name_ar}</span>
                      <span className="text-[9px] tabular-nums text-slate-400">{String(def.code).padStart(2, '0')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="gov-surface overflow-hidden">
            <div className="px-5 py-4 sm:px-6 border-b border-slate-100 bg-gradient-to-l from-white to-[#fbfcfd]">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="h-6 min-w-6 px-2 rounded-lg bg-[#eaf9f7] text-[#087f78] flex items-center justify-center text-[10px] font-extrabold tabular-nums">
                      {String(activeDefinition.code).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{activeDefinition.group_name_ar}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#172033]">{activeDefinition.name_ar}</h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-6">{activeDefinition.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {submission.sections[activeSectionCode]?.status === 'completed' ? (
                    <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      مكتمل
                    </span>
                  ) : (
                    <span className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold">
                      غير مكتمل
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {isLocked && !isReturned && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-extrabold">التعديل غير متاح حاليًا</p>
                    <p className="mt-1 text-amber-700">يمكنك مراجعة البيانات الحالية أو طلب فتح استثنائي من المديرية.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: activeDefinition.field_1_label, value: f1, setter: setF1 },
                  { label: activeDefinition.field_2_label, value: f2, setter: setF2 },
                  { label: activeDefinition.field_3_label, value: f3, setter: setF3 },
                ].map((field, index) => (
                  <div key={index} className="block">
                    <span className="block text-[11px] font-extrabold text-slate-700 mb-2">{field.label}</span>
                    <input
                      type="number"
                      min="0"
                      disabled={isLocked}
                      value={field.value}
                      onFocus={e => e.target.select()}
                      onChange={e => field.setter(e.target.value)}
                      className="gov-input h-[58px] px-4 text-xl font-extrabold text-center tabular-nums"
                    />

                    {/* أزرار زيادة ونقصان القيمة بضغطة زر للمساعدة السريعة */}
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          const cur = Number(field.value) || 0;
                          field.setter(String(Math.max(0, cur - 5)));
                        }}
                        className="h-6 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-mono text-[10px] font-bold transition disabled:opacity-40 cursor-pointer"
                        title="إنقاص 5"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          const cur = Number(field.value) || 0;
                          field.setter(String(Math.max(0, cur - 1)));
                        }}
                        className="h-6 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-mono text-[10px] font-bold transition disabled:opacity-40 cursor-pointer"
                        title="إنقاص 1"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          const cur = Number(field.value) || 0;
                          field.setter(String(cur + 1));
                        }}
                        className="h-6 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#087f78] font-mono text-[10px] font-bold transition disabled:opacity-40 cursor-pointer"
                        title="زيادة 1"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          const cur = Number(field.value) || 0;
                          field.setter(String(cur + 5));
                        }}
                        className="h-6 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[#087f78] font-mono text-[10px] font-bold transition disabled:opacity-40 cursor-pointer"
                        title="زيادة 5"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* تنبيهات الاتساق المنطقي والسريري */}
              {activeSectionCode !== 12 && (Number(f2) || 0) > (Number(f1) || 0) && (Number(f1) || 0) > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 font-bold shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تنبيه منطقي: عدد التحويلات لتنظيم الأسرة ({Number(f2)}) أكبر من إجمالي المترددات الأساسية ({Number(f1)})</span>
                </div>
              )}
              {activeSectionCode !== 12 && (Number(f3) || 0) > (Number(f2) || 0) && (Number(f2) || 0) > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 font-bold shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تنبيه منطقي: عدد مستخدمات الوسائل طويلة المدى ({Number(f3)}) أكبر من إجمالي التحويلات ({Number(f2)})</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_210px] gap-4">
                <label className="block">
                  <span className="block text-[11px] font-extrabold text-slate-700 mb-2">ملاحظات القسم</span>
                  <textarea
                    disabled={isLocked}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="أضف ملاحظة تشغيلية عند الحاجة..."
                    rows={4}
                    className="gov-input min-h-[112px] px-4 py-3 text-xs resize-none leading-6"
                  />
                </label>

                <div className="rounded-xl border border-[#dfe7ed] bg-[#f8fbfc] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-4 h-4 text-[#087f78]" />
                    <span className="text-[11px] font-extrabold text-[#172033]">
                      {activeSectionCode === 12 ? 'ملخص القيم' : 'مؤشر التحويل'}
                    </span>
                  </div>

                  {activeSectionCode === 12 ? (
                    <>
                      <div className="text-2xl font-extrabold text-[#172033] tabular-nums">
                        {(Number(f1) || 0) + (Number(f2) || 0) + (Number(f3) || 0)}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-5">إجمالي الوسائل طويلة المدى المسجلة بالقسم.</p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-extrabold text-[#087f78] tabular-nums">{conversionRate}%</div>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-5">نسبة التحويلات إلى إجمالي القيمة الأساسية المسجلة.</p>
                    </>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5" />
                    {submission.sections[activeSectionCode]?.last_updated_at || 'لم يتم الحفظ بعد'}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 sm:px-6 border-t border-slate-100 bg-[#fbfcfd] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveSection('prev')}
                  disabled={activeSectionCode === 1 || isSaving}
                  className="h-9 px-3 rounded-lg gov-btn-secondary text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  السابق
                </button>
                <button
                  onClick={() => moveSection('next')}
                  disabled={activeSectionCode === 12 || isSaving}
                  className="h-9 px-3 rounded-lg gov-btn-secondary text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  التالي
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleSaveCurrentSection}
                disabled={isLocked || isSaving}
                className="h-10 px-5 rounded-xl gov-btn-primary text-[11px] font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ القسم كمسودة</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="gov-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#172033]">الجدول الشامل للأقسام</h3>
              <p className="text-[10px] text-slate-500 mt-1">مخصص للإدخال السريع والمراجعة الإجمالية قبل الإرسال.</p>
            </div>
            <button
              onClick={handleSaveMatrix}
              disabled={isLocked || isSaving}
              className="h-9 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-[10px] font-extrabold flex items-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-600" />
              حفظ الجدول كمسودة
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-right">
              <thead>
                <tr className="bg-[#f7f9fb] border-b border-slate-200 text-[10px] text-slate-500">
                  <th className="px-4 py-3 font-extrabold w-[250px]">القسم</th>
                  <th className="px-3 py-3 font-extrabold">القيمة الأولى</th>
                  <th className="px-3 py-3 font-extrabold">القيمة الثانية</th>
                  <th className="px-3 py-3 font-extrabold">القيمة الثالثة</th>
                  <th className="px-3 py-3 font-extrabold w-[230px]">ملاحظات</th>
                  <th className="px-3 py-3 font-extrabold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SECTIONS_DEFINITIONS.map(def => {
                  const current = matrixValues[def.code] || { f1: 0, f2: 0, f3: 0, notes: '' };
                  const completed = current.f1 > 0 || current.f2 > 0 || current.f3 > 0;

                  return (
                    <tr key={def.code} className="hover:bg-[#fbfcfd] transition">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="w-7 h-7 rounded-lg bg-[#f1f5f7] text-slate-500 flex items-center justify-center text-[10px] font-extrabold tabular-nums flex-shrink-0">
                            {String(def.code).padStart(2, '0')}
                          </span>
                          <div>
                            <div className="text-[11px] font-extrabold text-[#172033]">{def.name_ar}</div>
                            <div className="text-[9px] text-slate-400 mt-1">{def.group_name_ar}</div>
                          </div>
                        </div>
                      </td>

                      {(['f1', 'f2', 'f3'] as const).map(key => (
                        <td key={key} className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            disabled={isLocked}
                            value={current[key]}
                            onFocus={e => e.target.select()}
                            onChange={e => {
                              const value = Number(e.target.value) || 0;
                              setMatrixValues(prev => ({
                                ...prev,
                                [def.code]: { ...prev[def.code], [key]: value },
                              }));
                            }}
                            className="gov-input h-10 px-2 text-center text-sm font-extrabold tabular-nums"
                          />
                        </td>
                      ))}

                      <td className="px-3 py-3">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={current.notes}
                          onChange={e => {
                            const value = e.target.value;
                            setMatrixValues(prev => ({
                              ...prev,
                              [def.code]: { ...prev[def.code], notes: value },
                            }));
                          }}
                          placeholder="ملاحظة..."
                          className="gov-input h-10 px-3 text-[10px]"
                        />
                      </td>

                      <td className="px-3 py-3 text-center">
                        {completed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3" />
                            مكتمل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-500 text-[9px] font-bold">
                            <Circle className="w-3 h-3" />
                            فارغ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="gov-surface p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f2f6f8] text-slate-500 flex items-center justify-center flex-shrink-0">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-[#172033]">المراجعة قبل الإرسال</h3>
            <p className="text-[10px] text-slate-500 mt-1 leading-5">
              تم استكمال <strong className="text-[#087f78] tabular-nums">{completedSections}</strong> من أصل 12 قسمًا.
              راجع القيم والملاحظات قبل الإرسال النهائي للمديرية.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isLocked ? (
            <button
              onClick={onRequestOverride}
              className="h-11 px-5 rounded-xl bg-[#fff7e8] border border-[#f0d39b] text-[#93600d] text-[11px] font-extrabold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Lock className="w-4 h-4" />
              <span>طلب فتح للتعديل</span>
            </button>
          ) : (
            <>
              <button
                onClick={mode === 'guided' ? handleSaveCurrentSection : handleSaveMatrix}
                disabled={isSaving}
                className="h-11 px-5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-[11px] font-extrabold flex items-center gap-2 transition disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-600" /> : <Save className="w-4 h-4 text-amber-600" />}
                <span>حفظ كمسودة مؤقتة</span>
              </button>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSaving}
                className="min-w-[190px] h-11 px-5 rounded-xl bg-[#18334f] hover:bg-[#122a42] text-white text-[11px] font-extrabold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال البيان للمديرية</span>
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={showSubmitConfirm}
        title={emptySectionNames.length > 0 ? 'تأكيد إرسال البيان (يحتوي على أقسام صفرية)' : 'إرسال البيان اليومي'}
        message={
          emptySectionNames.length > 0
            ? `تنبيه: يحتوي البيان على (${emptySectionNames.length}) قسم بقيم صفرية (غير مكتملة):\n• ${emptySectionNames.slice(0, 5).join('\n• ')}${emptySectionNames.length > 5 ? `\n• وغيرها (${emptySectionNames.length - 5}) أقسام أخرى` : ''}\n\nهل تؤكد عدم وجود نشاط فعلي في هذه الأقسام وتريد إرسال البيان رسمياً للمديرية؟`
            : 'سيتم إرسال البيان إلى مديرية الشئون الصحية واعتماد كافة الأقسام (12 من 12). سيقفل التعديل لحين مراجعة واعتماد المديرية. هل تريد المتابعة؟'
        }
        confirmLabel={emptySectionNames.length > 0 ? 'تأكيد وإرسال البيان' : 'إرسال البيان'}
        tone={emptySectionNames.length > 0 ? 'warning' : 'primary'}
        loading={isSaving}
        onConfirm={async () => {
          setShowSubmitConfirm(false);
          await handleSubmitReport();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
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
