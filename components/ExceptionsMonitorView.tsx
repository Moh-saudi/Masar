'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { MasarService } from '@/lib/masar-service';
import { SAMPLE_GOVERNORATES } from '@/lib/constants';
import { 
  AlertTriangle, 
  RotateCcw, 
  Unlock, 
  Clock, 
  Search, 
  Filter, 
  Building, 
  ShieldAlert, 
  Eye, 
  CheckCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface ExceptionsMonitorViewProps {
  submissions: DailySubmission[];
  timeLock: TimeLockState;
  user: UserProfile;
  onSelectSubmission?: (sub: DailySubmission) => void;
}

export const ExceptionsMonitorView: React.FC<ExceptionsMonitorViewProps> = ({
  submissions,
  timeLock,
  user,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'delinquent' | 'returned' | 'override'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGov, setSelectedGov] = useState<string>('all');
  const [activeModalSub, setActiveModalSub] = useState<DailySubmission | null>(null);

  // 1. حصر الحالات الاستثنائية
  const delinquentDistricts = MasarService.getDelinquentDistricts(timeLock);
  
  const returnedList = submissions.filter(s => s.status === 'RETURNED');
  const overrideList = submissions.filter(s => 
    s.override_active && s.override_expires_at && new Date(s.override_expires_at).getTime() > Date.now()
  );

  // تجميع قائمة الاستثناءات الموحدة
  interface UnifiedException {
    id: string;
    type: 'delinquent' | 'returned' | 'override';
    type_label: string;
    district_id: string;
    district_name_ar: string;
    governorate_id: string;
    governorate_name_ar: string;
    completed_sections: number;
    actor_name?: string;
    actor_time?: string;
    reason_or_notes: string;
    submission?: DailySubmission;
  }

  const allExceptions: UnifiedException[] = [];

  // إضافة المتأخرة
  if (timeLock.is_district_locked) {
    submissions.forEach(sub => {
      const completed = Object.values(sub.sections).filter(s => s.status === 'completed').length;
      if (sub.status === 'DRAFT' || (sub.status !== 'APPROVED' && sub.status !== 'SUBMITTED_LOCKED' && completed < 12)) {
        allExceptions.push({
          id: `exc-del-${sub.id}`,
          type: 'delinquent',
          type_label: 'تأخر عن موعد 03:00 م',
          district_id: sub.district_id,
          district_name_ar: sub.district_name_ar,
          governorate_id: sub.governorate_id,
          governorate_name_ar: sub.governorate_name_ar,
          completed_sections: completed,
          reason_or_notes: 'لم تستكمل الإدارة رفع البيان قبل موعد إغلاق النافذة الرسمية (03:00 عصراً).',
          submission: sub,
        });
      }
    });
  }

  // إضافة المرجعة للتعديل
  returnedList.forEach(sub => {
    const completed = Object.values(sub.sections).filter(s => s.status === 'completed').length;
    allExceptions.push({
      id: `exc-ret-${sub.id}`,
      type: 'returned',
      type_label: 'مُرجع للتعديل من المديرية',
      district_id: sub.district_id,
      district_name_ar: sub.district_name_ar,
      governorate_id: sub.governorate_id,
      governorate_name_ar: sub.governorate_name_ar,
      completed_sections: completed,
      actor_name: sub.returned_by || 'مدير تنظيم الأسرة بالمديرية',
      actor_time: sub.returned_at || 'اليوم، 04:15 م',
      reason_or_notes: sub.returned_reason || 'ملاحظات فحص وتدقيق الكشوف',
      submission: sub,
    });
  });

  // إضافة الفتح المؤقت
  overrideList.forEach(sub => {
    const completed = Object.values(sub.sections).filter(s => s.status === 'completed').length;
    allExceptions.push({
      id: `exc-ovr-${sub.id}`,
      type: 'override',
      type_label: 'فتح مؤقت سارٍ (30 د)',
      district_id: sub.district_id,
      district_name_ar: sub.district_name_ar,
      governorate_id: sub.governorate_id,
      governorate_name_ar: sub.governorate_name_ar,
      completed_sections: completed,
      actor_name: sub.override_granted_by || 'وكيل الوزارة / مدير تنظيم الأسرة',
      actor_time: sub.override_granted_at || 'اليوم، 03:30 م',
      reason_or_notes: sub.override_reason || 'فتح مؤقت معتمد بقرار الجهة الأم',
      submission: sub,
    });
  });

  // الفلترة حسب النوع والبحث والمحافظة
  const filteredExceptions = allExceptions.filter(exc => {
    if (filterType !== 'all' && exc.type !== filterType) return false;
    if (selectedGov !== 'all' && exc.governorate_id !== selectedGov) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        exc.district_name_ar.toLowerCase().includes(q) ||
        exc.governorate_name_ar.toLowerCase().includes(q) ||
        exc.reason_or_notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* 1. ترويسة غرفة العمليات والرصد الاستثنائي */}
      <div className="gov-surface p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">
              غرفة الرصد والمتابعة الاستثنائية — ديوان عام الوزارة
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
              متابعة 260 إدارة صحية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل موحد لحصر كافة الاستثناءات الإدارية: التأخير عن موعد 03:00 م، قرارات الإرجاع، ورخص الفتح المؤقت.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">توقيت الحوكمة:</span>
          <span className="font-mono font-bold text-slate-900 px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
            {timeLock.current_time_str}
          </span>
          <span className={`px-2 py-1 rounded font-bold ${
            timeLock.is_district_locked ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {timeLock.is_district_locked ? 'تجاوز موعد 03:00 م' : 'قبل موعد الإغلاق'}
          </span>
        </div>
      </div>

      {/* 2. بطاقات إحصائيات الاستثناءات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* إجمالي الاستثناءات */}
        <button
          onClick={() => setFilterType('all')}
          className={`p-4 rounded-xl border text-right transition shadow-2xs ${
            filterType === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-400 mb-1">إجمالي الحالات الاستثنائية</div>
          <div className="text-2xl font-bold font-mono">
            {allExceptions.length}
          </div>
          <div className="text-[11px] opacity-70 mt-1">عبر كافة المحافظات</div>
        </button>

        {/* الإدارات المتأخرة */}
        <button
          onClick={() => setFilterType('delinquent')}
          className={`p-4 rounded-xl border text-right transition shadow-2xs ${
            filterType === 'delinquent'
              ? 'bg-rose-700 text-white border-rose-700'
              : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={filterType === 'delinquent' ? 'text-rose-100' : 'text-slate-500'}>
              متأخرة بعد 03:00 م
            </span>
            <AlertTriangle className={`w-4 h-4 ${filterType === 'delinquent' ? 'text-white' : 'text-rose-600'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${filterType === 'delinquent' ? 'text-white' : 'text-rose-700'}`}>
            {allExceptions.filter(e => e.type === 'delinquent').length}
          </div>
          <div className="text-[11px] opacity-70 mt-1">تجاوزت الموعد دون رفع كامل</div>
        </button>

        {/* بيانات تم إرجاعها للتعديل */}
        <button
          onClick={() => setFilterType('returned')}
          className={`p-4 rounded-xl border text-right transition shadow-2xs ${
            filterType === 'returned'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={filterType === 'returned' ? 'text-amber-100' : 'text-slate-500'}>
              بيانات مُرجعة للتعديل
            </span>
            <RotateCcw className={`w-4 h-4 ${filterType === 'returned' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${filterType === 'returned' ? 'text-white' : 'text-amber-700'}`}>
            {returnedList.length}
          </div>
          <div className="text-[11px] opacity-70 mt-1">بقرار تدقيق المديرية</div>
        </button>

        {/* فتح استثنائي مؤقت */}
        <button
          onClick={() => setFilterType('override')}
          className={`p-4 rounded-xl border text-right transition shadow-2xs ${
            filterType === 'override'
              ? 'bg-[#087f78] text-white border-sky-700'
              : 'bg-white text-slate-700 border-slate-200 hover:border-[#a8ddd7]'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={filterType === 'override' ? 'text-sky-100' : 'text-slate-500'}>
              فتح مؤقت سارٍ (30 د)
            </span>
            <Unlock className={`w-4 h-4 ${filterType === 'override' ? 'text-white' : 'text-[#087f78]'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${filterType === 'override' ? 'text-white' : 'text-[#087f78]'}`}>
            {overrideList.length}
          </div>
          <div className="text-[11px] opacity-70 mt-1">رخص الجهة الأم النشطة</div>
        </button>

      </div>

      {/* 3. شريط الفلترة والبحث المتقدم */}
      <div className="gov-surface p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* شريط البحث النصي */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالإدارة، المحافظة، أو الملاحظة..."
            className="w-full text-xs py-2 pr-9 pl-3 rounded-lg border border-slate-200 focus:border-[#087f78] focus:outline-none bg-slate-50 text-slate-800"
          />
        </div>

        {/* فلتر المحافظات */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">المحافظة:</span>
          <select
            value={selectedGov}
            onChange={(e) => setSelectedGov(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-[#087f78] font-semibold"
          >
            <option value="all">جميع المحافظات ({SAMPLE_GOVERNORATES.length})</option>
            {SAMPLE_GOVERNORATES.map(g => (
              <option key={g.id} value={g.id}>{g.name_ar}</option>
            ))}
          </select>
        </div>

      </div>

      {/* 4. الجدول التنفيذي الموحد لكافة الاستثناءات */}
      <div className="gov-surface overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
          <span>سجل الاستثناءات الميدانية ({filteredExceptions.length} حالة)</span>
          <span className="font-normal text-slate-400">تحديث فوري لفرق المتابعة المركزية</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-3 font-semibold">الإدارة الصحية</th>
                <th className="p-3 font-semibold">المحافظة</th>
                <th className="p-3 font-semibold">نوع الاستثناء</th>
                <th className="p-3 font-semibold">إنجاز الأقسام</th>
                <th className="p-3 font-semibold">المسؤول القائم بالإجراء</th>
                <th className="p-3 font-semibold">التوقيت والتاريخ</th>
                <th className="p-3 font-semibold">السبب والملاحظات</th>
                <th className="p-3 font-semibold text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExceptions.length > 0 ? (
                filteredExceptions.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-50 transition">
                    
                    {/* الإدارة */}
                    <td className="p-3 font-bold text-slate-900">
                      {exc.district_name_ar}
                    </td>

                    {/* المحافظة */}
                    <td className="p-3 text-slate-600 font-medium">
                      {exc.governorate_name_ar}
                    </td>

                    {/* نوع الاستثناء */}
                    <td className="p-3">
                      {exc.type === 'delinquent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>متأخرة بعد 03:00 م</span>
                        </span>
                      )}
                      {exc.type === 'returned' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <RotateCcw className="w-3 h-3 text-amber-600" />
                          <span>مُرجع للتعديل</span>
                        </span>
                      )}
                      {exc.type === 'override' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eef9f7] text-[#087f78] border border-[#ccebe7]">
                          <Unlock className="w-3 h-3 text-[#087f78]" />
                          <span>فتح مؤقت سارٍ</span>
                        </span>
                      )}
                    </td>

                    {/* إنجاز الأقسام */}
                    <td className="p-3 font-mono">
                      <span className={`font-bold ${exc.completed_sections === 12 ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {exc.completed_sections}
                      </span>
                      <span className="text-slate-400">/12</span>
                    </td>

                    {/* المسؤول */}
                    <td className="p-3 text-xs">
                      {exc.actor_name ? (
                        <span className="font-semibold text-slate-800">{exc.actor_name}</span>
                      ) : (
                        <span className="text-slate-400">النظام الآلي (قيد 03:00 م)</span>
                      )}
                    </td>

                    {/* التوقيت */}
                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      {exc.actor_time || timeLock.current_time_str}
                    </td>

                    {/* السبب والملاحظات */}
                    <td className="p-3 text-xs text-slate-600 max-w-[240px] truncate" title={exc.reason_or_notes}>
                      {exc.reason_or_notes}
                    </td>

                    {/* فحص البيان */}
                    <td className="p-3 text-center">
                      {exc.submission ? (
                        <button
                          onClick={() => setActiveModalSub(exc.submission!)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-[#087f78] font-semibold text-xs flex items-center justify-center mx-auto"
                          title="فحص تفاصيل البيان"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                    لا توجد استثناءات مسجلة مطابقة لمعايير البحث الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة تفاصيل فحص بيان الإدارة المستثناة */}
      {activeModalSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  تفاصيل استثناء: {activeModalSub.district_name_ar} ({activeModalSub.governorate_name_ar})
                </h3>
                <p className="text-xs text-slate-500">
                  حالة البيان: {activeModalSub.status} • تاريخ: {activeModalSub.submission_date}
                </p>
              </div>
              <button
                onClick={() => setActiveModalSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {activeModalSub.returned_reason && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <div className="font-bold text-amber-900">ملاحظات الإرجاع من المديرية:</div>
                  <p className="text-amber-800">{activeModalSub.returned_reason}</p>
                  <div className="text-[11px] text-amber-700 pt-1">
                    القائم بالإرجاع: {activeModalSub.returned_by} • {activeModalSub.returned_at}
                  </div>
                </div>
              )}

              {activeModalSub.override_reason && (
                <div className="p-3.5 rounded-xl bg-[#eef9f7] border border-[#ccebe7] space-y-1">
                  <div className="font-bold text-sky-900">بيانات الفتح الاستثنائي:</div>
                  <p className="text-[#066963]">{activeModalSub.override_reason}</p>
                  <div className="text-[11px] text-[#087f78] pt-1">
                    المانح للفتح: {activeModalSub.override_granted_by} • {activeModalSub.override_granted_at}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="font-bold text-slate-800">حالة إنجاز الأقسام الـ 12:</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(activeModalSub.sections).map(sec => (
                    <div key={sec.section_code} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="truncate">{sec.section_code}. {sec.section_name_ar}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        sec.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {sec.status === 'completed' ? 'مكتمل' : 'فارغ'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setActiveModalSub(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
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
