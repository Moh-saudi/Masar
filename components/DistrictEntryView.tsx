'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  DailySubmission, 
  UserProfile, 
  TimeLockState, 
  SectionHistoryEntry 
} from '@/lib/types';
import { 
  SECTIONS_DEFINITIONS, 
  SECTION_GROUPS 
} from '@/lib/constants';
import { MasarService } from '@/lib/masar-service';
import { 
  CheckCircle2, 
  Save, 
  Send, 
  Lock, 
  History, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  Building, 
  ChevronDown, 
  ChevronUp, 
  Table2, 
  LayoutList, 
  Calculator,
  Sparkles,
  Check,
  Edit3,
  Plus,
  Minus,
  PenLine,
  Keyboard,
  Pencil
} from 'lucide-react';

interface DistrictEntryViewProps {
  submission: DailySubmission;
  user: UserProfile;
  timeLock: TimeLockState;
  onSubmissionUpdated: (updated: DailySubmission) => void;
  onRequestOverride: () => void;
}

export const DistrictEntryView: React.FC<DistrictEntryViewProps> = ({
  submission,
  user,
  timeLock,
  onSubmissionUpdated,
  onRequestOverride,
}) => {
  const [entryMode, setEntryMode] = useState<'card' | 'matrix'>('card');
  const [activeSectionCode, setActiveSectionCode] = useState<number>(1);
  const [f1, setF1] = useState<string>('0');
  const [f2, setF2] = useState<string>('0');
  const [f3, setF3] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [focusedInput, setFocusedInput] = useState<1 | 2 | 3 | null>(null);

  const [matrixValues, setMatrixValues] = useState<Record<number, { f1: number; f2: number; f3: number; notes: string }>>({});

  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);
  const input3Ref = useRef<HTMLInputElement>(null);

  const activeDef = SECTIONS_DEFINITIONS.find(d => d.code === activeSectionCode) || SECTIONS_DEFINITIONS[0];
  const activeData = submission.sections[activeSectionCode] || {
    section_code: activeSectionCode,
    section_name_ar: activeDef.name_ar,
    field_1_value: 0,
    field_2_value: 0,
    field_3_value: 0,
    status: 'empty',
  };

  const isLocked = (timeLock.is_district_locked || submission.status === 'SUBMITTED_LOCKED') && !timeLock.has_active_override;

  // مزامنة الحقول
  useEffect(() => {
    const data = submission.sections[activeSectionCode];
    if (data) {
      setF1(data.field_1_value ? String(data.field_1_value) : '0');
      setF2(data.field_2_value ? String(data.field_2_value) : '0');
      setF3(data.field_3_value ? String(data.field_3_value) : '0');
      setNotes(data.notes || '');
    } else {
      setF1('0');
      setF2('0');
      setF3('0');
      setNotes('');
    }
  }, [activeSectionCode, submission]);

  // تهيئة جدول المصفوفة
  useEffect(() => {
    const initialMatrix: Record<number, { f1: number; f2: number; f3: number; notes: string }> = {};
    SECTIONS_DEFINITIONS.forEach(def => {
      const sec = submission.sections[def.code];
      initialMatrix[def.code] = {
        f1: sec?.field_1_value || 0,
        f2: sec?.field_2_value || 0,
        f3: sec?.field_3_value || 0,
        notes: sec?.notes || '',
      };
    });
    setMatrixValues(initialMatrix);
  }, [submission]);

  // حفظ قسم مفرد
  const handleSaveCurrentSection = () => {
    if (isLocked) return;

    try {
      const updatedSub = MasarService.updateSectionData(
        submission.district_id,
        activeSectionCode,
        {
          field_1_value: parseFloat(f1) || 0,
          field_2_value: parseFloat(f2) || 0,
          field_3_value: parseFloat(f3) || 0,
          notes: notes.trim(),
        },
        user
      );
      onSubmissionUpdated({ ...updatedSub });
      setSaveMessage('تم الحفظ بنجاح وتحديث الإحصائية');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  // حفظ الجدول السريع بالكامل
  const handleSaveMatrixBulk = () => {
    if (isLocked) return;

    try {
      const payload: Record<number, { field_1_value: number; field_2_value: number; field_3_value: number; notes?: string }> = {};
      Object.entries(matrixValues).forEach(([code, vals]) => {
        payload[parseInt(code)] = {
          field_1_value: vals.f1 || 0,
          field_2_value: vals.f2 || 0,
          field_3_value: vals.f3 || 0,
          notes: vals.notes || '',
        };
      });

      const updatedSub = MasarService.updateAllSectionsBulk(submission.district_id, payload, user);
      onSubmissionUpdated({ ...updatedSub });
      setSaveMessage('تم حفظ وتحديث كافة الأقسام الـ 12 بنجاح!');
      setTimeout(() => setSaveMessage(null), 2500);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentInput: 1 | 2 | 3) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentInput === 1) input2Ref.current?.focus();
      else if (currentInput === 2) input3Ref.current?.focus();
      else if (currentInput === 3) {
        handleSaveCurrentSection();
        if (activeSectionCode < 12) {
          setActiveSectionCode(prev => prev + 1);
        }
      }
    }
  };

  const handleSubmitDailyReport = () => {
    if (isLocked) return;

    const confirmed = window.confirm(
      'تأكيد إرسال البيان الإجمالي التجميعي للإدارة؟\nسيتم قفل التعديل وتحويل البيان فوراً لمديرية الشئون الصحية للفحص والاعتماد.'
    );
    if (!confirmed) return;

    try {
      if (entryMode === 'matrix') {
        handleSaveMatrixBulk();
      } else {
        handleSaveCurrentSection();
      }
      const updatedSub = MasarService.submitDistrictDailyReport(submission.district_id, user);
      onSubmissionUpdated({ ...updatedSub });
      alert('تم رفع البيان الإجمالي التجميعي بنجاح إلى مديرية الشئون الصحية!');
    } catch (err: any) {
      alert(err.message || 'فشل إرسال البيان');
    }
  };

  // زيادة ونقصان القيمة بضغطة زر للمساعدة السريعة
  const adjustValue = (fieldNum: 1 | 2 | 3, delta: number) => {
    if (isLocked) return;
    if (fieldNum === 1) {
      const current = parseFloat(f1) || 0;
      setF1(String(Math.max(0, current + delta)));
    } else if (fieldNum === 2) {
      const current = parseFloat(f2) || 0;
      setF2(String(Math.max(0, current + delta)));
    } else if (fieldNum === 3) {
      const current = parseFloat(f3) || 0;
      setF3(String(Math.max(0, current + delta)));
    }
  };

  const numF1 = parseFloat(f1) || 0;
  const numF2 = parseFloat(f2) || 0;
  const numF3 = parseFloat(f3) || 0;

  const isSection12 = activeSectionCode === 12;
  const isReferralExceeding = !isSection12 && numF2 > numF1 && numF1 > 0;
  const isLarcExceeding = !isSection12 && numF3 > numF2 && numF2 > 0;

  const convRate = numF1 > 0 ? Math.round((numF2 / numF1) * 100) : 0;
  const larcRate = numF2 > 0 ? Math.round((numF3 / numF2) * 100) : 0;

  let otherSectionsLarcTotal = 0;
  Object.values(submission.sections).forEach(sec => {
    if (sec.section_code !== 12) {
      otherSectionsLarcTotal += sec.field_3_value || 0;
    }
  });
  const section12TotalDispensed = isSection12 ? (numF1 + numF2 + numF3) : (
    (submission.sections[12]?.field_1_value || 0) +
    (submission.sections[12]?.field_2_value || 0) +
    (submission.sections[12]?.field_3_value || 0)
  );
  const larcDifference = section12TotalDispensed - otherSectionsLarcTotal;

  const completedCount = Object.values(submission.sections).filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / 12) * 100);
  const historyEntries: SectionHistoryEntry[] = submission.history_logs?.[activeSectionCode] || [];

  return (
    <div className="space-y-5">
      
      {/* 1. الترويسة الرئيسية للإدارة */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">{submission.district_name_ar}</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              محافظة {submission.governorate_name_ar}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>بيان: <strong>{submission.submission_date}</strong></span>
            <span>•</span>
            <span>المسجل: <strong>{user.full_name}</strong></span>
            <span>•</span>
            <span>الإنجاز: <strong className="text-slate-900">{completedCount} من 12 قسم</strong> ({progressPercent}%)</span>
          </p>
        </div>

        {/* أزرار اختيار نمط الإدخال */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setEntryMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                entryMode === 'card'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5 text-sky-600" />
              <span>إدخال مركز (قسم بقسم)</span>
            </button>

            <button
              onClick={() => setEntryMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                entryMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5 text-sky-600" />
              <span>جدول سريع (شامل)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. النمط الأول: الإدخال المركز (Master-Detail Card Mode)                    */}
      {/* ========================================================================= */}
      {entryMode === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* القائمة الجانبية للأقسام الـ 12 */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs">
            <div className="px-3 py-2 border-b border-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>أقسام البيان التجميعي (12)</span>
              <span className="text-[11px] font-normal text-slate-400 font-mono">{completedCount}/12</span>
            </div>

            <div className="mt-2 space-y-3">
              {SECTION_GROUPS.map((group) => {
                const groupSections = SECTIONS_DEFINITIONS.filter(s => s.group_id === group.id);

                return (
                  <div key={group.id} className="space-y-1">
                    <div className="px-3 pt-1 text-[11px] font-bold text-slate-400">
                      {group.name_ar}
                    </div>

                    <div className="space-y-0.5">
                      {groupSections.map((def) => {
                        const isCurrent = def.code === activeSectionCode;
                        const isDone = submission.sections[def.code]?.status === 'completed';

                        return (
                          <button
                            key={def.code}
                            onClick={() => setActiveSectionCode(def.code)}
                            className={`w-full text-right px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                              isCurrent
                                ? 'bg-sky-600 text-white font-bold shadow-xs'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                                isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {def.code}
                              </span>
                              <span className="truncate">{def.name_ar}</span>
                            </div>

                            <div>
                              {isDone ? (
                                <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} />
                              ) : (
                                <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white/40' : 'bg-slate-200'}`} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* استمارة القسم بحقول إدخال صريحة وواضحة جداً للكتابة */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative">
              
              {isLocked && (
                <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span>نافذة الإدخال مقفلة. أي تعديل يتطلب موافقة مديرية المحافظة.</span>
                  </div>
                  <button
                    onClick={onRequestOverride}
                    className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                  >
                    طلب فتح
                  </button>
                </div>
              )}

              {/* ترويسة القسم */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-sky-600">
                    القسم رقم ({activeDef.code}) من 12
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activeDef.name_ar}
                  </h3>
                  {activeDef.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{activeDef.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveSectionCode(prev => Math.max(1, prev - 1))}
                    disabled={activeSectionCode === 1}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition"
                  >
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => setActiveSectionCode(prev => Math.min(12, prev + 1))}
                    disabled={activeSectionCode === 12}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* حقول إدخال الأرقام المصممة بوضوح تام كـ حقول كتابة وتدوين تفاعلية          */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                
                {/* 1. الحقل الأول */}
                <div className={`rounded-2xl p-4 transition-all duration-200 border-2 shadow-xs ${
                  focusedInput === 1 
                    ? 'bg-sky-50/50 border-sky-600 ring-4 ring-sky-100' 
                    : numF1 > 0 
                      ? 'bg-white border-slate-300' 
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-bold font-mono">1</span>
                      <span>{activeDef.field_1_label}</span>
                    </label>
                    {focusedInput === 1 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white flex items-center gap-1 animate-pulse">
                        <Keyboard className="w-3 h-3" />
                        <span>جاري الكتابة</span>
                      </span>
                    ) : numF1 > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>تم التدوين</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Pencil className="w-2.5 h-2.5" />
                        <span>اكتب هنا</span>
                      </span>
                    )}
                  </div>

                  {/* صندوق الكتابة الظاهر والصريح */}
                  <div className={`relative flex items-center bg-white border-2 rounded-xl transition-all shadow-inner ${
                    focusedInput === 1 ? 'border-sky-600' : 'border-slate-300 hover:border-sky-400'
                  }`}>
                    <div className="pr-3 pl-1 text-slate-400 flex items-center">
                      <PenLine className="w-4 h-4 text-sky-600" />
                    </div>

                    <input
                      ref={input1Ref}
                      type="number"
                      min="0"
                      disabled={isLocked}
                      value={f1}
                      onChange={(e) => setF1(e.target.value)}
                      onFocus={(e) => {
                        setFocusedInput(1);
                        e.target.select();
                      }}
                      onBlur={() => setFocusedInput(null)}
                      onKeyDown={(e) => handleKeyDown(e, 1)}
                      className="w-full text-center text-3xl font-black font-mono py-2.5 px-2 bg-transparent border-none outline-none text-slate-900 focus:ring-0 select-all"
                      placeholder="0"
                    />

                    {/* أزرار زيادة ونقصان سريعة */}
                    <div className="flex items-center gap-1 pl-2">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => adjustValue(1, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition disabled:opacity-40"
                        title="إنقاص 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => adjustValue(1, 1)}
                        className="w-7 h-7 rounded-lg bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-800 font-bold transition disabled:opacity-40"
                        title="زيادة 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* توجيه كتابي ومؤشر تفاعلي أسفل الحقل */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/70 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Keyboard className="w-3 h-3 text-sky-600" />
                      <span>انقر للكتابة أو استخدم الأسهم</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Enter ↵</span>
                  </div>
                </div>

                {/* 2. الحقل الثاني */}
                <div className={`rounded-2xl p-4 transition-all duration-200 border-2 shadow-xs ${
                  focusedInput === 2 
                    ? 'bg-sky-50/50 border-sky-600 ring-4 ring-sky-100' 
                    : numF2 > 0 
                      ? 'bg-white border-slate-300' 
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[11px] font-bold font-mono">2</span>
                      <span>{activeDef.field_2_label}</span>
                    </label>
                    {focusedInput === 2 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white flex items-center gap-1 animate-pulse">
                        <Keyboard className="w-3 h-3" />
                        <span>جاري الكتابة</span>
                      </span>
                    ) : numF2 > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>تم التدوين</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Pencil className="w-2.5 h-2.5" />
                        <span>اكتب هنا</span>
                      </span>
                    )}
                  </div>

                  {/* صندوق الكتابة الظاهر والصريح */}
                  <div className={`relative flex items-center bg-white border-2 rounded-xl transition-all shadow-inner ${
                    focusedInput === 2 ? 'border-sky-600' : 'border-slate-300 hover:border-sky-400'
                  }`}>
                    <div className="pr-3 pl-1 text-slate-400 flex items-center">
                      <PenLine className="w-4 h-4 text-sky-600" />
                    </div>

                    <input
                      ref={input2Ref}
                      type="number"
                      min="0"
                      disabled={isLocked}
                      value={f2}
                      onChange={(e) => setF2(e.target.value)}
                      onFocus={(e) => {
                        setFocusedInput(2);
                        e.target.select();
                      }}
                      onBlur={() => setFocusedInput(null)}
                      onKeyDown={(e) => handleKeyDown(e, 2)}
                      className="w-full text-center text-3xl font-black font-mono py-2.5 px-2 bg-transparent border-none outline-none text-sky-800 focus:ring-0 select-all"
                      placeholder="0"
                    />

                    {/* أزرار زيادة ونقصان سريعة */}
                    <div className="flex items-center gap-1 pl-2">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => adjustValue(2, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition disabled:opacity-40"
                        title="إنقاص 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => adjustValue(2, 1)}
                        className="w-7 h-7 rounded-lg bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-800 font-bold transition disabled:opacity-40"
                        title="زيادة 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* توجيه كتابي ومؤشر تفاعلي أسفل الحقل */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/70 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Keyboard className="w-3 h-3 text-sky-600" />
                      <span>انقر للكتابة أو استخدم الأسهم</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Enter ↵</span>
                  </div>
                </div>

                {/* 3. الحقل الثالث */}
                <div className={`rounded-2xl p-4 transition-all duration-200 border-2 shadow-xs ${
                  focusedInput === 3 
                    ? 'bg-emerald-50/50 border-emerald-600 ring-4 ring-emerald-100' 
                    : numF3 > 0 
                      ? 'bg-white border-slate-300' 
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold font-mono">3</span>
                      <span>{activeDef.field_3_label}</span>
                    </label>
                    {focusedInput === 3 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 animate-pulse">
                        <Keyboard className="w-3 h-3" />
                        <span>جاري الكتابة</span>
                      </span>
                    ) : numF3 > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>تم التدوين</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <Pencil className="w-2.5 h-2.5" />
                        <span>اكتب هنا</span>
                      </span>
                    )}
                  </div>

                  {/* صندوق الكتابة الظاهر والصريح */}
                  <div className={`relative flex items-center bg-white border-2 rounded-xl transition-all shadow-inner ${
                    focusedInput === 3 ? 'border-emerald-600' : 'border-slate-300 hover:border-emerald-400'
                  }`}>
                    <div className="pr-3 pl-1 text-slate-400 flex items-center">
                      <PenLine className="w-4 h-4 text-emerald-600" />
                    </div>

                    <input
                      ref={input3Ref}
                      type="number"
                      min="0"
                      disabled={isLocked}
                      value={f3}
                      onChange={(e) => setF3(e.target.value)}
                      onFocus={(e) => {
                        setFocusedInput(3);
                        e.target.select();
                      }}
                      onBlur={() => setFocusedInput(null)}
                      onKeyDown={(e) => handleKeyDown(e, 3)}
                      className="w-full text-center text-3xl font-black font-mono py-2.5 px-2 bg-transparent border-none outline-none text-emerald-700 focus:ring-0 select-all"
                      placeholder="0"
                    />

                    {/* أزرار زيادة ونقصان سريعة */}
                    <div className="flex items-center gap-1 pl-2">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => adjustValue(3, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition disabled:opacity-40"
                        title="إنقاص 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => adjustValue(3, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold transition disabled:opacity-40"
                        title="زيادة 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* توجيه كتابي ومؤشر تفاعلي أسفل الحقل */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/70 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Keyboard className="w-3 h-3 text-emerald-600" />
                      <span>انقر للكتابة أو استخدم الأسهم</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Enter ↵</span>
                  </div>
                </div>

              </div>

              {/* التنبيهات المنطقية الذكية */}
              {(isReferralExceeding || isLarcExceeding) && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  {isReferralExceeding && (
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>تنبيه منطقي: عدد التحويلات ({numF2}) يتجاوز إجمالي عدد المترددين ({numF1})! يرجى التأكد من صحة الكشوف الورقية.</span>
                    </div>
                  )}
                  {isLarcExceeding && (
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>تنبيه منطقي: عدد مستخدمات LARC ({numF3}) يتجاوز عدد التحويلات لتنظيم الأسرة ({numF2})!</span>
                    </div>
                  )}
                </div>
              )}

              {/* الحاسبة التلقائية لمعدلات التحويل */}
              {!isSection12 && (numF1 > 0 || numF2 > 0) && (
                <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calculator className="w-4 h-4 text-sky-600" />
                    <span>معدلات القسم التلقائية:</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-700">
                      معدل التحويل للعيادات: <strong className="text-sky-700 font-mono">{convRate}%</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-700">
                      معدل تبني LARC: <strong className="text-emerald-700 font-mono">{larcRate}%</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* في القسم 12: مطابقة الحصيلة الكلية للوسائل المنصرفة */}
              {isSection12 && (
                <div className={`mb-5 p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                  larcDifference === 0 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>
                      إجمالي المنصرف بالقسم 12: <strong className="font-mono">{section12TotalDispensed}</strong> وسيلة | 
                      مجموع مستخدمات LARC المسجلة بالعيادات: <strong className="font-mono">{otherSectionsLarcTotal}</strong> حالة
                    </span>
                  </div>
                  <div>
                    {larcDifference === 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>الحصيلة متطابقة تماماً 100%</span>
                      </span>
                    ) : (
                      <span className="font-bold">
                        {larcDifference > 0 ? `فارق (+${larcDifference}) وسيلة منصرفة لم تقيد كحالات مستخدمات` : `عجز (${larcDifference}) وسيلة في المنصرف`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* حقل الملاحظات */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ملاحظات أو توضيحات خاصة بالقسم (اختياري):
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب أي ملاحظة تخص إحصائية هذا القسم..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-sky-500 focus:outline-none text-slate-800 disabled:bg-slate-50"
                />
              </div>

              {/* شريط الحفظ */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs">
                  {saveMessage ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{saveMessage}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      {activeData.last_updated_at ? `آخر تحديث: ${activeData.last_updated_at}` : 'لم تسجل بيانات لليوم بعد'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowHistory(prev => !prev)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>{showHistory ? 'إخفاء الأيام السابقة' : 'عرض الأيام السابقة'}</span>
                    {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCurrentSection}
                    disabled={isLocked}
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ بيانات القسم ({activeDef.code})</span>
                  </button>
                </div>
              </div>

              {/* سجل الأيام السابقة */}
              {showHistory && (
                <div className="mt-5 pt-4 border-t border-slate-100 animate-in fade-in">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">
                    سجل نشاط القسم في الأيام السابقة:
                  </h4>
                  {historyEntries.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-right">
                        <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                          <tr>
                            <th className="p-2 font-medium">التاريخ</th>
                            <th className="p-2 font-medium">{activeDef.field_1_label}</th>
                            <th className="p-2 font-medium">{activeDef.field_2_label}</th>
                            <th className="p-2 font-medium">{activeDef.field_3_label}</th>
                            <th className="p-2 font-medium">الملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {historyEntries.map((hist) => (
                            <tr key={hist.id}>
                              <td className="p-2 font-mono">{hist.date}</td>
                              <td className="p-2 font-bold font-mono">{hist.field_1_value}</td>
                              <td className="p-2 font-bold font-mono text-sky-700">{hist.field_2_value}</td>
                              <td className="p-2 font-bold font-mono text-emerald-700">{hist.field_3_value}</td>
                              <td className="p-2 text-slate-500 text-[11px]">{hist.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">لا توجد إحصائيات سابقة مسجلة.</p>
                  )}
                </div>
              )}

            </div>

            {/* بطاقة رفع البيان النهائي للإدارة */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">إرسال البيان اليومي للإدارة</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  عند الإرسال، يُقفل البيان وتتحول الصلاحية لمديرية الشئون الصحية للاعتماد.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmitDailyReport}
                disabled={isLocked || completedCount === 0}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-1.5 transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>رفع البيان الإجمالي ({completedCount}/12)</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. النمط الثاني: جدول الإدخال التجميعي السريع (Matrix Mode)                */}
      {/* ========================================================================= */}
      {entryMode === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Table2 className="w-4 h-4 text-sky-600" />
                <span>جدول الإدخال التجميعي السريع لكافة الأقسام الـ 12</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                حقول إدخال واضحة ومباشرة لكافة الأقسام، مع إمكانية التنقل بـ Tab أو Enter والحفظ الشامل.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveMatrixBulk}
                disabled={isLocked}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white flex items-center gap-1.5 shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ كافة الأقسام دفعة واحدة</span>
              </button>

              <button
                onClick={handleSubmitDailyReport}
                disabled={isLocked}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-1.5 shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>رفع البيان للمديرية</span>
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
                <tr>
                  <th className="p-2.5 w-10 text-center">م</th>
                  <th className="p-2.5 w-48">القسم التجميعي</th>
                  <th className="p-2.5 text-center">الحقل الأول (كتابة)</th>
                  <th className="p-2.5 text-center">الحقل الثاني (كتابة)</th>
                  <th className="p-2.5 text-center">الحقل الثالث (كتابة)</th>
                  <th className="p-2.5 text-center">معدل التحويل</th>
                  <th className="p-2.5">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {SECTIONS_DEFINITIONS.map((def) => {
                  const currentVals = matrixValues[def.code] || { f1: 0, f2: 0, f3: 0, notes: '' };
                  const f1Val = currentVals.f1;
                  const f2Val = currentVals.f2;
                  const f3Val = currentVals.f3;
                  const rowConvRate = f1Val > 0 ? Math.round((f2Val / f1Val) * 100) : 0;
                  const hasRowWarning = def.code !== 12 && f2Val > f1Val && f1Val > 0;

                  return (
                    <tr key={def.code} className="hover:bg-slate-50/70 transition">
                      <td className="p-2.5 text-center font-bold text-slate-400 font-mono">
                        {def.code}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        <div>{def.name_ar}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-[190px]">
                          {def.field_1_label} / {def.field_2_label} / {def.field_3_label}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          disabled={isLocked}
                          value={currentVals.f1}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMatrixValues(prev => ({
                              ...prev,
                              [def.code]: { ...prev[def.code], f1: val }
                            }));
                          }}
                          className="w-24 text-center font-mono font-bold py-1.5 px-2 bg-white border-2 border-slate-300 rounded-lg focus:border-sky-600 focus:ring-2 focus:ring-sky-100 outline-none transition shadow-2xs select-all"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          disabled={isLocked}
                          value={currentVals.f2}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMatrixValues(prev => ({
                              ...prev,
                              [def.code]: { ...prev[def.code], f2: val }
                            }));
                          }}
                          className={`w-24 text-center font-mono font-bold py-1.5 px-2 bg-white border-2 rounded-lg focus:border-sky-600 focus:ring-2 focus:ring-sky-100 outline-none transition shadow-2xs select-all ${
                            hasRowWarning ? 'border-rose-400 text-rose-700 bg-rose-50' : 'border-slate-300 text-sky-800'
                          }`}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          disabled={isLocked}
                          value={currentVals.f3}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setMatrixValues(prev => ({
                              ...prev,
                              [def.code]: { ...prev[def.code], f3: val }
                            }));
                          }}
                          className="w-24 text-center font-mono font-bold py-1.5 px-2 bg-white border-2 border-slate-300 rounded-lg focus:border-sky-600 focus:ring-2 focus:ring-sky-100 outline-none transition shadow-2xs text-emerald-700 select-all"
                        />
                      </td>
                      <td className="p-2 text-center font-mono text-xs">
                        {def.code !== 12 ? (
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            hasRowWarning ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rowConvRate}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">حصيلة LARC</span>
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={currentVals.notes}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMatrixValues(prev => ({
                              ...prev,
                              [def.code]: { ...prev[def.code], notes: val }
                            }));
                          }}
                          placeholder="ملاحظات..."
                          className="w-full py-1.5 px-2 text-xs bg-white border border-slate-300 rounded-md focus:border-sky-500 outline-none text-slate-700"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
