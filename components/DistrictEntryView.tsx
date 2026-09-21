'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DailySubmission, TimeLockState, UserProfile } from '@/lib/types';
import { SECTION_GROUPS, SECTIONS_DEFINITIONS } from '@/lib/constants';
import { MasarService } from '@/lib/masar-service';
import { persistDailySubmission, writeAuditEvent } from '@/lib/services/submissions-client';
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
  Clock3
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

  const isLocked =
    (timeLock.is_district_locked || submission.status === 'SUBMITTED_LOCKED') &&
    !timeLock.has_active_override;

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
    window.setTimeout(() => setStatusMessage(null), 2600);
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
        user
      );

      const persisted = await persistDailySubmission(updated, user);
      onSubmissionUpdated(persisted);
      showStatus('تم حفظ بيانات القسم بنجاح');
      return persisted;
    } catch (error: any) {
      alert(error?.message || 'تعذر حفظ بيانات القسم');
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
        user
      );
      const persisted = await persistDailySubmission(updated, user);
      onSubmissionUpdated(persisted);
      showStatus('تم حفظ جميع الأقسام');
      return persisted;
    } catch (error: any) {
      alert(error?.message || 'تعذر حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (isLocked || isSaving) return;

    const confirmed = window.confirm(
      'هل تريد إرسال البيان اليومي إلى مديرية الشئون الصحية؟ بعد الإرسال سيتم إغلاق التعديل لحين المراجعة.'
    );
    if (!confirmed) return;

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

        MasarService.updateAllSectionsBulk(submission.district_id, payload, user);
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
          user
        );
      }

      const submitted = MasarService.submitDistrictDailyReport(submission.district_id, user);
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
    } catch (error: any) {
      alert(error?.message || 'تعذر إرسال البيان');
    } finally {
      setIsSaving(false);
    }
  };

  const moveSection = (direction: 'next' | 'prev') => {
    const currentIndex = SECTIONS_DEFINITIONS.findIndex(def => def.code === activeSectionCode);
    const targetIndex = direction === 'next'
      ? Math.min(SECTIONS_DEFINITIONS.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

    const target = SECTIONS_DEFINITIONS[targetIndex];
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
              className="h-10 px-4 rounded-xl bg-[#fff7e8] border border-[#f0d39b] text-[#93600d] text-[11px] font-extrabold flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              طلب فتح للتعديل
            </button>
          ) : (
            <button
              onClick={mode === 'guided' ? handleSaveCurrentSection : handleSaveMatrix}
              disabled={isSaving}
              className="h-10 px-4 rounded-xl gov-btn-primary text-[11px] font-extrabold flex items-center gap-2 disabled:opacity-60"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ البيانات
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 flex items-center gap-2 text-[11px] font-bold">
          <CheckCircle2 className="w-4 h-4" />
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
                      onClick={() => setActiveSectionCode(def.code)}
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
              {isLocked && (
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
                  <label key={index} className="block">
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
                  </label>
                ))}
              </div>

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
                  disabled={activeSectionCode === 1}
                  className="h-9 px-3 rounded-lg gov-btn-secondary text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  السابق
                </button>
                <button
                  onClick={() => moveSection('next')}
                  disabled={activeSectionCode === 12}
                  className="h-9 px-3 rounded-lg gov-btn-secondary text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-40"
                >
                  التالي
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleSaveCurrentSection}
                disabled={isLocked || isSaving}
                className="h-10 px-5 rounded-xl gov-btn-primary text-[11px] font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ القسم الحالي
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
              className="h-9 px-4 rounded-xl gov-btn-primary text-[10px] font-extrabold flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              حفظ الجدول
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

        <button
          onClick={handleSubmitReport}
          disabled={isLocked || isSaving}
          className="min-w-[210px] h-11 px-5 rounded-xl bg-[#18334f] hover:bg-[#122a42] text-white text-[11px] font-extrabold flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {isLocked ? 'البيان مغلق حاليًا' : 'إرسال البيان للمراجعة'}
        </button>
      </div>

    </div>
  );
};
