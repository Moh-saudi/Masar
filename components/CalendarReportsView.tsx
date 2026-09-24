'use client';

import React, { useState, useMemo } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SAMPLE_GOVERNORATES, SECTIONS_DEFINITIONS } from '@/lib/constants';
import { getCairoDateString } from '@/lib/date';
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Unlock,
  Eye,
  X,
  Search,
  Filter,
  Download,
  Printer,
  Calendar as CalendarIcon,
  Sparkles,
  Info,
} from 'lucide-react';
import { exportToStyledExcel } from '@/lib/excel-export';
import { OfficialRegisterReportModal } from './OfficialRegisterReportModal';

interface CalendarReportsViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
  onOpenSubmission?: (submission: DailySubmission) => void;
}

interface DayAggregate {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  totalDistrictsExpected: number;
  totalSubmissions: number;
  completedCount: number;
  inProgressCount: number;
  lateCount: number;
  returnedCount: number;
  overrideCount: number;
  completionRate: number; // 0 to 100
  submissions: DailySubmission[];
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const WEEKDAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export const CalendarReportsView: React.FC<CalendarReportsViewProps> = ({
  submissions,
  user,
  onOpenSubmission,
}) => {
  const isDistrictUser = user.role === 'district_user';
  const isDirectorateUser = user.role === 'directorate_user';
  const directorateGovName = user.governorate_name_ar;

  // Compute expected districts for the scoped user
  const expectedDistricts = useMemo(() => {
    const targetGovs = (isDirectorateUser && directorateGovName)
      ? SAMPLE_GOVERNORATES.filter(g => g.name_ar === directorateGovName || g.id === user.governorate_id)
      : SAMPLE_GOVERNORATES;

    const list: { id: string; name_ar: string; code: string; governorate_name_ar: string }[] = [];
    targetGovs.forEach(gov => {
      (gov.districts || []).forEach(dist => {
        list.push({
          id: dist.id,
          name_ar: dist.name_ar,
          code: dist.code,
          governorate_name_ar: gov.name_ar,
        });
      });
    });
    return list;
  }, [isDirectorateUser, directorateGovName, user.governorate_id]);

  const totalDistrictsExpected = expectedDistricts.length || 300;

  // Active viewing month & year (Defaults to current date)
  const todayStr = getCairoDateString();
  const initialDate = new Date();
  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth()); // 0-11

  // Selected Day for Detail Modal
  const [selectedDayModal, setSelectedDayModal] = useState<DayAggregate | null>(null);
  const [showPrintRegisterModal, setShowPrintRegisterModal] = useState<boolean>(false);
  const [daySearchQuery, setDaySearchQuery] = useState('');
  const [dayStatusFilter, setDayStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'late' | 'returned' | 'not_started'>('all');

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Group all submissions by date
  const submissionsByDate = useMemo(() => {
    const map = new Map<string, DailySubmission[]>();
    submissions.forEach(sub => {
      if (!sub.submission_date) return;
      // Filter by directorate if applicable
      if (isDirectorateUser && directorateGovName && sub.governorate_name_ar !== directorateGovName) {
        return;
      }
      const existing = map.get(sub.submission_date) || [];
      existing.push(sub);
      map.set(sub.submission_date, existing);
    });
    return map;
  }, [submissions, isDirectorateUser, directorateGovName]);

  // Build Calendar Matrix (6 rows x 7 cols = 42 cells)
  const calendarCells = useMemo(() => {
    const cells: DayAggregate[] = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Weekday of the first day: 0=Sunday, 1=Monday, ..., 6=Saturday
    // In Egypt/Arab calendar week starts on Saturday (0 index in our WEEKDAYS)
    const dayOfWeek = firstDayOfMonth.getDay(); 
    // Map JS Sunday(0)..Saturday(6) to Arabic Saturday(0)..Friday(6)
    // Sunday (0) -> 1, Monday (1) -> 2, ..., Friday (5) -> 6, Saturday (6) -> 0
    const startOffset = (dayOfWeek + 1) % 7;

    // Previous month padding
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const pYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const pMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const dayNum = prevMonthLastDate - i;
      const dStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const daySubs = submissionsByDate.get(dStr) || [];
      const completed = daySubs.filter(s => s.status === 'SUBMITTED_LOCKED' || s.status === 'APPROVED' || s.directorate_status === 'APPROVED').length;
      const inProg = daySubs.filter(s => s.status === 'DRAFT').length;

      cells.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isFuture: dStr > todayStr,
        totalDistrictsExpected,
        totalSubmissions: daySubs.length,
        completedCount: completed,
        inProgressCount: inProg,
        lateCount: daySubs.filter(s => s.status === 'DRAFT' && dStr < todayStr).length,
        returnedCount: daySubs.filter(s => s.status === 'RETURNED').length,
        overrideCount: daySubs.filter(s => s.override_active).length,
        completionRate: Math.round((completed / (totalDistrictsExpected || 1)) * 100),
        submissions: daySubs,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= lastDayOfMonth.getDate(); dayNum++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const daySubs = submissionsByDate.get(dStr) || [];
      const completed = daySubs.filter(s => s.status === 'SUBMITTED_LOCKED' || s.status === 'APPROVED' || s.directorate_status === 'APPROVED').length;
      const inProg = daySubs.filter(s => s.status === 'DRAFT').length;

      cells.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isFuture: dStr > todayStr,
        totalDistrictsExpected,
        totalSubmissions: daySubs.length,
        completedCount: completed,
        inProgressCount: inProg,
        lateCount: daySubs.filter(s => s.status === 'DRAFT' && dStr < todayStr).length,
        returnedCount: daySubs.filter(s => s.status === 'RETURNED').length,
        overrideCount: daySubs.filter(s => s.override_active).length,
        completionRate: Math.round((completed / (totalDistrictsExpected || 1)) * 100),
        submissions: daySubs,
      });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const dStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const daySubs = submissionsByDate.get(dStr) || [];
      const completed = daySubs.filter(s => s.status === 'SUBMITTED_LOCKED' || s.status === 'APPROVED' || s.directorate_status === 'APPROVED').length;

      cells.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isFuture: dStr > todayStr,
        totalDistrictsExpected,
        totalSubmissions: daySubs.length,
        completedCount: completed,
        inProgressCount: daySubs.filter(s => s.status === 'DRAFT').length,
        lateCount: 0,
        returnedCount: daySubs.filter(s => s.status === 'RETURNED').length,
        overrideCount: 0,
        completionRate: Math.round((completed / (totalDistrictsExpected || 1)) * 100),
        submissions: daySubs,
      });
    }

    return cells;
  }, [currentYear, currentMonth, submissionsByDate, todayStr, totalDistrictsExpected]);

  // Monthly Overview KPIs
  const monthlyStats = useMemo(() => {
    const currentMonthCells = calendarCells.filter(c => c.isCurrentMonth && !c.isFuture);
    const daysWithRecords = currentMonthCells.filter(c => c.totalSubmissions > 0);
    const avgRate = daysWithRecords.length
      ? Math.round(daysWithRecords.reduce((acc, c) => acc + c.completionRate, 0) / daysWithRecords.length)
      : 0;

    let highestDay: DayAggregate | null = null;
    let lowestDay: DayAggregate | null = null;

    daysWithRecords.forEach(c => {
      if (!highestDay || c.completedCount > highestDay.completedCount) highestDay = c;
      if (!lowestDay || c.completedCount < lowestDay.completedCount) lowestDay = c;
    });

    return {
      totalRecordedDays: daysWithRecords.length,
      averageCompletionRate: avgRate,
      highestDay: highestDay as DayAggregate | null,
      lowestDay: lowestDay as DayAggregate | null,
    };
  }, [calendarCells]);

  // Detailed District List for Selected Day in Modal
  const modalDistrictRows = useMemo(() => {
    if (!selectedDayModal) return [];

    const subMap = new Map<string, DailySubmission>();
    selectedDayModal.submissions.forEach(s => {
      if (s.district_id) subMap.set(s.district_id, s);
    });

    return expectedDistricts.map(dist => {
      const sub = subMap.get(dist.id);
      let statusType: 'COMPLETED' | 'IN_PROGRESS' | 'LATE' | 'RETURNED' | 'NOT_STARTED' = 'NOT_STARTED';
      let statusLabel = 'لم يبدأ التسجيل';
      let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';

      let completedSections = 0;
      if (sub?.sections) {
        completedSections = Object.values(sub.sections).filter(s => s?.status === 'completed').length;
      }
      const percentage = Math.round((completedSections / 12) * 100);

      if (sub) {
        if (sub.status === 'APPROVED' || sub.directorate_status === 'APPROVED') {
          statusType = 'COMPLETED';
          statusLabel = 'معتمد رسمياً';
          statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold';
        } else if (sub.status === 'SUBMITTED_LOCKED') {
          statusType = 'COMPLETED';
          statusLabel = 'مكتمل ومرفوع';
          statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (sub.status === 'RETURNED') {
          statusType = 'RETURNED';
          statusLabel = 'مرجع للتصحيح';
          statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
        } else if (sub.status === 'DRAFT' && completedSections > 0) {
          statusType = 'IN_PROGRESS';
          statusLabel = `جاري التسجيل (${percentage}%)`;
          statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
        } else {
          statusType = 'LATE';
          statusLabel = 'متأخر عن الموعد';
          statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
        }
      }

      return {
        districtId: dist.id,
        districtName: dist.name_ar,
        districtCode: dist.code,
        governorateName: dist.governorate_name_ar,
        submission: sub,
        statusType,
        statusLabel,
        statusBadge,
        completedSections,
        percentage,
        updatedAt: sub?.updated_at ? sub.updated_at.slice(11, 16) : '—',
      };
    });
  }, [selectedDayModal, expectedDistricts]);

  // Filtered rows for day modal
  const filteredModalRows = useMemo(() => {
    return modalDistrictRows.filter(row => {
      if (dayStatusFilter === 'completed' && row.statusType !== 'COMPLETED') return false;
      if (dayStatusFilter === 'in_progress' && row.statusType !== 'IN_PROGRESS') return false;
      if (dayStatusFilter === 'late' && row.statusType !== 'LATE') return false;
      if (dayStatusFilter === 'returned' && row.statusType !== 'RETURNED') return false;
      if (dayStatusFilter === 'not_started' && row.statusType !== 'NOT_STARTED') return false;

      if (daySearchQuery.trim()) {
        const q = daySearchQuery.trim().toLowerCase();
        const matchesName = row.districtName.toLowerCase().includes(q);
        const matchesGov = row.governorateName.toLowerCase().includes(q);
        const matchesCode = row.districtCode.toLowerCase().includes(q);
        if (!matchesName && !matchesGov && !matchesCode) return false;
      }
      return true;
    });
  }, [modalDistrictRows, dayStatusFilter, daySearchQuery]);

  // Export Day to Excel
  const handleExportDayExcel = () => {
    if (!selectedDayModal) return;
    const columns = [
      { header: 'م', key: 'idx', width: 6 },
      { header: 'الإدارة الصحية', key: 'district', width: 25 },
      { header: 'المحافظة', key: 'governorate', width: 18 },
      { header: 'كود الإدارة', key: 'code', width: 12 },
      { header: 'حالة التسجيل', key: 'status', width: 18 },
      { header: 'نسبة الإنجاز', key: 'completion', width: 14 },
      { header: 'الأقسام المكتملة', key: 'sections', width: 14 },
      { header: 'توقيت التسجيل', key: 'time', width: 14 },
    ];

    const rows = filteredModalRows.map((r, idx) => ({
      idx: idx + 1,
      district: r.districtName,
      governorate: r.governorateName,
      code: r.districtCode,
      status: r.statusLabel,
      completion: `${r.percentage}%`,
      sections: `${r.completedSections} من 12`,
      time: r.updatedAt,
    }));

    exportToStyledExcel(
      `كشف_تسجيل_إدارات_${selectedDayModal.dateStr}`,
      `منظومة مَسَار - كشف تسليمات يوم ${selectedDayModal.dateStr}`,
      columns,
      rows
    );
  };

  return (
    <div className="space-y-5">

      {/* ================= CALENDAR HEADER & CONTROLS ================= */}
      <div className="gov-surface p-5 bg-white border border-[#dce5ed] rounded-3xl shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf9f7] border border-[#c4eae5] text-[#087f78] text-[11px] font-extrabold mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>تقويم الرصد والمتابعة التاريخي</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
              تقويم تسجيل الإدارات الصحية
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              استعراض الموقف الزمني على مدار الشهر. اضغط على أي يوم لفتح كشف الإدارات المسجلة وحالة كل إدارة بالتفصيل.
            </p>
          </div>

          {/* Month Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleJumpToToday}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
            >
              اليوم الحالي
            </button>
            <div className="flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl p-1 shadow-xs">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="px-4 text-xs font-extrabold text-[#172033] select-none min-w-[130px] text-center">
                {ARABIC_MONTHS[currentMonth]} {currentYear}
              </div>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition"
                title="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="text-[10px] font-bold text-slate-500 mb-1">أيام التسجيل المرصودة</div>
            <div className="text-lg font-black text-[#172033] tabular-nums">
              {monthlyStats.totalRecordedDays} يوم
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">خلال شهر {ARABIC_MONTHS[currentMonth]}</div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="text-[10px] font-bold text-emerald-800 mb-1">متوسط الاكتمال اليومي</div>
            <div className="text-lg font-black text-emerald-900 tabular-nums">
              {monthlyStats.averageCompletionRate}%
            </div>
            <div className="text-[9px] text-emerald-600 mt-0.5">من إجمالي المستهدف</div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3">
            <div className="text-[10px] font-bold text-sky-800 mb-1">أعلى يوم تسجيلاً</div>
            <div className="text-lg font-black text-sky-900 tabular-nums">
              {monthlyStats.highestDay ? `${monthlyStats.highestDay.completedCount} إدارة` : '—'}
            </div>
            <div className="text-[9px] text-sky-600 mt-0.5">
              {monthlyStats.highestDay?.dateStr || 'لا توجد بيانات'}
            </div>
          </div>

          {/* بطاقة المستهدف اليومي: تظهر فقط للمديريات وما فوق — لا تظهر للإدارة الصحية */}
          {!isDistrictUser ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
              <div className="text-[10px] font-bold text-amber-800 mb-1">المستهدف لكل يوم</div>
              <div className="text-lg font-black text-amber-900 tabular-nums">
                {totalDistrictsExpected} إدارة
              </div>
              <div className="text-[9px] text-amber-600 mt-0.5">
                {isDirectorateUser ? `مديرية ${directorateGovName}` : '27 محافظة'}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3">
              <div className="text-[10px] font-bold text-indigo-800 mb-1">أعلى اكتمال يومي</div>
              <div className="text-lg font-black text-indigo-900 tabular-nums">
                {monthlyStats.highestDay
                  ? `${monthlyStats.highestDay.completionRate}%`
                  : '—'}
              </div>
              <div className="text-[9px] text-indigo-600 mt-0.5">
                {monthlyStats.highestDay?.dateStr || 'لا توجد بيانات'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= CALENDAR GRID ================= */}
      <div className="gov-surface overflow-hidden border border-[#dce5ed] rounded-3xl bg-white shadow-sm p-4 sm:p-6">
        
        {/* Weekday Labels Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black text-slate-600 select-none pb-2 border-b border-slate-100">
          {WEEKDAYS.map(day => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid (7 cols) */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {calendarCells.map((cell, idx) => {
            const hasData = cell.totalSubmissions > 0;
            const isHigh = cell.completionRate >= 80;
            const isMedium = cell.completionRate >= 40 && cell.completionRate < 80;

            return (
              <button
                key={`${cell.dateStr}-${idx}`}
                type="button"
                onClick={() => {
                  setSelectedDayModal(cell);
                  setDaySearchQuery('');
                  setDayStatusFilter('all');
                }}
                disabled={cell.isFuture}
                className={`relative flex flex-col justify-between p-2 sm:p-2.5 rounded-2xl border transition text-right group min-h-[92px] sm:min-h-[110px] ${
                  cell.isFuture
                    ? 'bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed'
                    : cell.isToday
                      ? 'border-[#087f78] bg-[#f2faf9] shadow-xs ring-2 ring-[#087f78]/20 hover:border-[#087f78] hover:shadow-md'
                      : !cell.isCurrentMonth
                        ? 'border-slate-100 bg-slate-50/30 text-slate-400 hover:border-slate-200'
                        : hasData
                          ? 'border-slate-200 bg-white hover:border-[#087f78] hover:shadow-md hover:-translate-y-0.5'
                          : 'border-slate-200/60 bg-white hover:border-slate-300'
                }`}
              >
                {/* Day Header: Number & Today Tag */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs sm:text-sm font-black tabular-nums ${
                    cell.isToday
                      ? 'text-[#087f78]'
                      : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                  }`}>
                    {cell.dayNumber}
                  </span>

                  {cell.isToday && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#087f78] text-white text-[8px] font-black">
                      اليوم
                    </span>
                  )}

                  {!cell.isToday && hasData && (
                    <span className={`w-2 h-2 rounded-full ${
                      isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                  )}
                </div>

                {/* Day Body: Count of Registered Districts */}
                <div className="my-auto py-1">
                  {cell.isFuture ? (
                    <div className="text-[10px] text-slate-300">مستقبلي</div>
                  ) : hasData ? (
                    <div>
                      <div className="flex items-baseline gap-1 text-[#172033]">
                        <span className="text-sm sm:text-base font-black tabular-nums text-emerald-800">
                          {cell.completedCount}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          / {cell.totalDistrictsExpected}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold truncate">
                        إدارة مسجلة
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-400 font-medium">
                      لا توجد سجلات
                    </div>
                  )}
                </div>

                {/* Day Footer: Progress Bar */}
                {!cell.isFuture && (
                  <div className="w-full">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, cell.completionRate)}%` }}
                      />
                    </div>
                    {hasData && (
                      <div className="text-[8px] text-slate-400 font-extrabold text-left mt-0.5 tabular-nums">
                        {cell.completionRate}%
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= INTERACTIVE DAY DETAILS MODAL ================= */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="gov-surface bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Top Header */}
            <div className="p-5 sm:px-6 sm:py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-l from-white to-[#fbfcfd]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#eaf9f7] text-[#087f78] flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#172033]">
                      كشف تسجيل إدارات يوم {selectedDayModal.dateStr}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      حصر شامل لموقف الإدارات الصحية ({selectedDayModal.totalDistrictsExpected} إدارة) المسجلة بهذا اليوم.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportDayExcel}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#087f78]" />
                  <span>تصدير Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintRegisterModal(true)}
                  className="h-9 px-3.5 rounded-xl bg-[#087f78] hover:bg-[#066560] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  title="طباعة السجل الرسمي المعتمد بمقاس A4 لهذا اليوم"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة السجل (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDayModal(null)}
                  className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day KPIs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:px-6 bg-[#fcfdfe] border-b border-slate-100">
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="text-[10px] font-bold text-emerald-700 mb-0.5">مكتمل ومرفوع</div>
                <div className="text-base font-black text-emerald-800 tabular-nums">
                  {selectedDayModal.completedCount} إدارة
                </div>
                <div className="text-[9px] text-emerald-600 mt-0.5">
                  بنسبة {selectedDayModal.completionRate}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="text-[10px] font-bold text-amber-700 mb-0.5">جاري الإدخال</div>
                <div className="text-base font-black text-amber-800 tabular-nums">
                  {selectedDayModal.inProgressCount} مسودة
                </div>
                <div className="text-[9px] text-amber-600 mt-0.5">قيد الاستكمال</div>
              </div>

              <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50">
                <div className="text-[10px] font-bold text-rose-700 mb-0.5">متأخر عن الإغلاق</div>
                <div className="text-base font-black text-rose-800 tabular-nums">
                  {selectedDayModal.lateCount} إدارة
                </div>
                <div className="text-[9px] text-rose-600 mt-0.5">لم تعتمد بالموعد</div>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-500 mb-0.5">إجمالي الإدارات</div>
                <div className="text-base font-black text-[#172033] tabular-nums">
                  {selectedDayModal.totalDistrictsExpected} إدارة
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">نطاق الرصد المحدد</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={daySearchQuery}
                  onChange={e => setDaySearchQuery(e.target.value)}
                  placeholder="ابحث باسم الإدارة الصحية أو المحافظة..."
                  className="gov-input h-9 pr-9 pl-4 text-xs w-full rounded-xl border-slate-200"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-extrabold pb-0.5">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'completed', label: 'المكتمل' },
                  { id: 'in_progress', label: 'جاري' },
                  { id: 'late', label: 'متأخر' },
                  { id: 'not_started', label: 'لم يبدأ' },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setDayStatusFilter(chip.id as typeof dayStatusFilter)}
                    className={`h-8 px-2.5 rounded-lg border transition ${
                      dayStatusFilter === chip.id
                        ? 'bg-[#087f78] text-white border-[#087f78]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Districts Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:px-6">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-600 border-b border-slate-200 font-extrabold select-none">
                    <th className="px-3 py-2.5 text-center w-10">#</th>
                    <th className="px-3 py-2.5">الإدارة الصحية</th>
                    <th className="px-3 py-2.5">المحافظة</th>
                    <th className="px-3 py-2.5">موقف التسجيل</th>
                    <th className="px-3 py-2.5 text-center">الإنجاز</th>
                    <th className="px-3 py-2.5 text-center">التوقيت</th>
                    <th className="px-3 py-2.5 text-center">معاينة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredModalRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        لا توجد إدارات مطابقة للتصفية المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredModalRows.map((row, idx) => (
                      <tr key={row.districtId} className="hover:bg-slate-50/70 transition">
                        <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {row.districtName}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {row.governorateName}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${row.statusBadge}`}>
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-extrabold text-[11px] tabular-nums text-slate-700">
                              {row.percentage}%
                            </span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  row.percentage >= 80
                                    ? 'bg-emerald-500'
                                    : row.percentage > 0
                                      ? 'bg-amber-500'
                                      : 'bg-slate-200'
                                }`}
                                style={{ width: `${row.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-500 font-mono text-[11px]">
                          {row.updatedAt}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {row.submission ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (row.submission && onOpenSubmission) {
                                  onOpenSubmission(row.submission);
                                }
                              }}
                              className="h-7 px-2 rounded-lg border border-slate-200 hover:border-[#087f78] text-slate-700 hover:text-[#087f78] text-[10px] font-bold transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>استعراض</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-3 sm:px-6 border-t border-slate-100 bg-[#fbfcfd] flex items-center justify-between text-xs text-slate-500">
              <span>{filteredModalRows.length} إدارة معروضة</span>
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="h-8 px-4 rounded-xl gov-btn-secondary text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* نافذة طباعة السجل الرسمي المعتمد بمقاس A4 لليوم المحدد */}
      {showPrintRegisterModal && selectedDayModal && (
        <OfficialRegisterReportModal
          dateStr={selectedDayModal.dateStr}
          governorateFilterName={
            isDirectorateUser && directorateGovName
              ? `مديرية الشئون الصحية بمحافظة ${directorateGovName}`
              : 'كافة محافظات الجمهورية (27 محافظة)'
          }
          rows={filteredModalRows.map(r => ({
            governorateId: '',
            governorateNameAr: r.governorateName,
            districtId: r.districtId,
            districtNameAr: r.districtName,
            districtCode: r.districtCode,
            statusType: r.statusType,
            statusLabelAr: r.statusLabel,
            statusBadgeClass: r.statusBadge,
            completedSectionsCount: r.completedSections,
            totalSectionsCount: 12,
            completionPercentage: r.percentage,
            submittedAtFormatted: r.updatedAt,
            lastUpdatedAtFormatted: r.updatedAt,
            enteredByName: 'مسؤول الإدارة',
            isOverrideActive: false,
            isOverrideRequested: false,
            overrideMinutesLeft: 0,
          }))}
          kpis={{
            totalExpected: selectedDayModal.totalDistrictsExpected,
            completedCount: selectedDayModal.completedCount,
            inProgressCount: selectedDayModal.inProgressCount,
            lateCount: selectedDayModal.lateCount,
            overrideCount: selectedDayModal.overrideCount,
            completionRate: selectedDayModal.completionRate,
          }}
          currentUser={user}
          onClose={() => setShowPrintRegisterModal(false)}
        />
      )}

    </div>
  );
};
