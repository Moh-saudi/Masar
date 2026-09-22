'use client';

import React, { useMemo, useState } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SECTIONS_DEFINITIONS, SAMPLE_GOVERNORATES } from '@/lib/constants';
import { exportToStyledExcel, exportToExcelFile } from '@/lib/excel-export';
import { fetchReportPeriodBundle, type ReportPeriodAnalytics } from '@/lib/services/submissions-client';
import { getCairoDateString } from '@/lib/date';
import { SubmissionMonitoringTable, formatCairoDateTime } from './SubmissionMonitoringTable';
import {
  ArrowLeftRight,
  Building2,
  CalendarRange,
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
  X,
  TableProperties,
  Sigma,
} from 'lucide-react';

interface ReportsCenterViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
}

type PeriodPreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'custom';

function shiftedDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getCairoDateString(date);
}

function reportTitle(user: UserProfile) {
  if (user.role === 'district_user') return 'تقارير الإدارة الصحية';
  if (user.role === 'directorate_user') return 'تقارير مديرية الشئون الصحية';
  if (user.role === 'general_director') return 'تقارير الإدارة العامة';
  if (user.role === 'central_admin') return 'تقارير الإدارة المركزية';
  if (user.role === 'sector_head') return 'التقارير القومية';
  return 'مركز التقارير والرقابة';
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({ submissions, user }) => {
  const today = getCairoDateString();
  const isDistrict = user.role === 'district_user';
  const isDirectorate = user.role === 'directorate_user';
  const canChooseGovernorate = !isDistrict && !isDirectorate;
  const canChooseDistrict = !isDistrict;

  const [preset, setPreset] = useState<PeriodPreset>('today');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [selectedGov, setSelectedGov] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [remoteRows, setRemoteRows] = useState<DailySubmission[] | null>(null);
  const [resultCount, setResultCount] = useState(submissions.length);
  const [serverPage, setServerPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [loadingRange, setLoadingRange] = useState(false);
  const [rangeError, setRangeError] = useState('');
  const [periodView, setPeriodView] = useState<'summary' | 'daily' | null>(null);
  const [periodAnalytics, setPeriodAnalytics] = useState<ReportPeriodAnalytics | null>(null);
  const [analyticsComplete, setAnalyticsComplete] = useState(true);

  const sourceSubmissions = remoteRows ?? submissions;

  // بعض السجلات القديمة قد تكون أسماء النطاقات فيها فارغة رغم وجودها في Profile.
  // نكملها من الحساب حتى لا يظهر "محافظة" أو "إدارة" بدون اسم.
  const normalizedSubmissions = useMemo(
    () =>
      sourceSubmissions.map(sub => ({
        ...sub,
        governorate_name_ar:
          sub.governorate_name_ar || user.governorate_name_ar || 'غير محدد',
        district_name_ar:
          sub.district_name_ar || user.district_name_ar || 'غير محدد',
      })),
    [sourceSubmissions, user.governorate_name_ar, user.district_name_ar]
  );

  const availableDistricts = useMemo(() => {
    const fixedGovernorate = isDirectorate ? user.governorate_name_ar : undefined;
    const selectedGovernorate =
      fixedGovernorate ||
      SAMPLE_GOVERNORATES.find(g => g.code === selectedGov)?.name_ar;

    const source = selectedGovernorate
      ? normalizedSubmissions.filter(s => s.governorate_name_ar === selectedGovernorate)
      : normalizedSubmissions;

    return Array.from(new Set(source.map(s => s.district_name_ar)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'ar'));
  }, [
    normalizedSubmissions,
    isDirectorate,
    user.governorate_name_ar,
    selectedGov,
  ]);

  const filteredSubmissions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return normalizedSubmissions.filter(sub => {
      if (term) {
        const searchable = `${sub.governorate_name_ar} ${sub.district_name_ar}`.toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    });
  }, [normalizedSubmissions, searchTerm]);

  const totals = useMemo(() => {
    let attendees = 0;
    let referrals = 0;
    let value3 = 0;

    filteredSubmissions.forEach(sub => {
      SECTIONS_DEFINITIONS.forEach(def => {
        const section = sub.sections?.[def.code];
        if (!section || def.code === 12) return;
        attendees += section.field_1_value || 0;
        referrals += section.field_2_value || 0;
        value3 += section.field_3_value || 0;
      });
    });

    return { attendees, referrals, value3 };
  }, [filteredSubmissions]);

  const isMultiDay = fromDate !== toDate;

  const localUniqueDates = useMemo(
    () => Array.from(new Set(filteredSubmissions.map(sub => sub.submission_date))).sort(),
    [filteredSubmissions]
  );

  const uniqueDates = useMemo(
    () =>
      periodAnalytics
        ? Array.from(new Set(periodAnalytics.daily.map(row => row.date))).sort()
        : localUniqueDates,
    [periodAnalytics, localUniqueDates]
  );

  const periodSummary = useMemo(() => {
    return SECTIONS_DEFINITIONS.map(def => {
      if (periodAnalytics) {
        const summary = periodAnalytics.summary.find(row => row.code === def.code);
        const dailyValues = periodAnalytics.daily
          .filter(row => row.code === def.code)
          .map(row => ({
            date: row.date,
            field1: row.field1,
            field2: row.field2,
            field3: row.field3,
            hasData: row.hasData,
          }));

        const total1 = summary?.total1 ?? 0;
        const total2 = summary?.total2 ?? 0;
        const total3 = summary?.total3 ?? 0;
        const scoredDays = dailyValues.map(day => ({
          date: day.date,
          total: day.field1 + day.field2 + day.field3,
        }));
        const highest = scoredDays.length
          ? scoredDays.reduce((best, day) => (day.total > best.total ? day : best))
          : { date: '—', total: 0 };
        const lowest = scoredDays.length
          ? scoredDays.reduce((best, day) => (day.total < best.total ? day : best))
          : { date: '—', total: 0 };
        const dayCount = periodAnalytics.dateCount || uniqueDates.length;

        return {
          code: def.code,
          name: def.name_ar,
          total1,
          total2,
          total3,
          average: dayCount ? Math.round((total1 + total2 + total3) / dayCount) : 0,
          highest,
          lowest,
          daysWithData: summary?.daysWithData ?? 0,
        };
      }

      const dailyValues = localUniqueDates.map(date => {
        const sameDay = filteredSubmissions.filter(sub => sub.submission_date === date);
        const totalsForDay = sameDay.reduce(
          (acc, sub) => {
            const section = sub.sections?.[def.code];
            acc.field1 += section?.field_1_value || 0;
            acc.field2 += section?.field_2_value || 0;
            acc.field3 += section?.field_3_value || 0;
            if (section && section.status !== 'empty') acc.hasData = true;
            return acc;
          },
          { field1: 0, field2: 0, field3: 0, hasData: false }
        );

        return { date, ...totalsForDay };
      });

      const total1 = dailyValues.reduce((sum, day) => sum + day.field1, 0);
      const total2 = dailyValues.reduce((sum, day) => sum + day.field2, 0);
      const total3 = dailyValues.reduce((sum, day) => sum + day.field3, 0);
      const daysWithData = dailyValues.filter(day => day.hasData).length;
      const scoredDays = dailyValues.map(day => ({
        date: day.date,
        total: day.field1 + day.field2 + day.field3,
      }));
      const highest = scoredDays.length
        ? scoredDays.reduce((best, day) => (day.total > best.total ? day : best))
        : { date: '—', total: 0 };
      const lowest = scoredDays.length
        ? scoredDays.reduce((best, day) => (day.total < best.total ? day : best))
        : { date: '—', total: 0 };

      return {
        code: def.code,
        name: def.name_ar,
        total1,
        total2,
        total3,
        average: localUniqueDates.length
          ? Math.round((total1 + total2 + total3) / localUniqueDates.length)
          : 0,
        highest,
        lowest,
        daysWithData,
      };
    });
  }, [periodAnalytics, filteredSubmissions, localUniqueDates, uniqueDates.length]);

  const dailyMatrix = useMemo(() => {
    if (periodAnalytics) {
      return uniqueDates.map(date => ({
        date,
        sections: SECTIONS_DEFINITIONS.map(def => {
          const row = periodAnalytics.daily.find(
            daily => daily.date === date && daily.code === def.code
          );
          return {
            code: def.code,
            name: def.name_ar,
            field1: row?.field1 ?? 0,
            field2: row?.field2 ?? 0,
            field3: row?.field3 ?? 0,
          };
        }),
      }));
    }

    return localUniqueDates.map(date => {
      const sameDay = filteredSubmissions.filter(sub => sub.submission_date === date);
      return {
        date,
        sections: SECTIONS_DEFINITIONS.map(def => {
          const totalsForSection = sameDay.reduce(
            (acc, sub) => {
              const section = sub.sections?.[def.code];
              acc.field1 += section?.field_1_value || 0;
              acc.field2 += section?.field_2_value || 0;
              acc.field3 += section?.field_3_value || 0;
              return acc;
            },
            { field1: 0, field2: 0, field3: 0 }
          );

          return {
            code: def.code,
            name: def.name_ar,
            ...totalsForSection,
          };
        }),
      };
    });
  }, [periodAnalytics, uniqueDates, localUniqueDates, filteredSubmissions]);

  const exportRows = useMemo(() => {
    const rows: Record<string, string | number>[] = [];

    filteredSubmissions.forEach(sub => {
      SECTIONS_DEFINITIONS.forEach(def => {
        const section = sub.sections?.[def.code];
        const created = formatCairoDateTime(sub.created_at);
        const updated = formatCairoDateTime(sub.updated_at);

        rows.push({
          date: sub.submission_date,
          governorate: sub.governorate_name_ar,
          district: sub.district_name_ar,
          sectionCode: def.code,
          sectionName: def.name_ar,
          field1: section?.field_1_value || 0,
          field2: section?.field_2_value || 0,
          field3: section?.field_3_value || 0,
          createdAt: `${created.date} ${created.time}`,
          updatedAt: `${updated.date} ${updated.time}`,
        });
      });
    });

    return rows;
  }, [filteredSubmissions]);

  const columns = [
    { header: 'تاريخ البيان', key: 'date' },
    { header: 'المحافظة', key: 'governorate' },
    { header: 'الإدارة الصحية', key: 'district' },
    { header: 'كود القسم', key: 'sectionCode' },
    { header: 'القسم', key: 'sectionName' },
    { header: 'القيمة 1', key: 'field1' },
    { header: 'القيمة 2', key: 'field2' },
    { header: 'القيمة 3', key: 'field3' },
    { header: 'أول تسجيل', key: 'createdAt' },
    { header: 'آخر تحديث', key: 'updatedAt' },
  ];

  const applyPreset = (value: PeriodPreset) => {
    setPreset(value);

    if (value === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (value === 'yesterday') {
      const date = shiftedDate(-1);
      setFromDate(date);
      setToDate(date);
    } else if (value === 'last7') {
      setFromDate(shiftedDate(-6));
      setToDate(today);
    } else if (value === 'last30') {
      setFromDate(shiftedDate(-29));
      setToDate(today);
    }
  };

  const loadRange = async (page = 1) => {
    setRangeError('');

    if (!fromDate || !toDate) {
      setRangeError('حدد تاريخ البداية والنهاية.');
      return;
    }

    if (fromDate > toDate) {
      setRangeError('تاريخ البداية يجب أن يسبق تاريخ النهاية.');
      return;
    }

    if (isDistrict && !user.district_id) {
      setRangeError('الحساب غير مرتبط بإدارة صحية. تم منع عرض أي سجلات حفاظًا على صلاحيات الوصول.');
      setRemoteRows([]);
      setResultCount(0);
      return;
    }

    if (isDirectorate && !user.governorate_id) {
      setRangeError('الحساب غير مرتبط بمحافظة. تم منع عرض أي سجلات حفاظًا على صلاحيات الوصول.');
      setRemoteRows([]);
      setResultCount(0);
      return;
    }

    const selectedGovObject = SAMPLE_GOVERNORATES.find(g => g.code === selectedGov);
    const selectedDistrictObject =
      selectedGovObject?.districts?.find(d => d.name_ar === selectedDistrict) ||
      SAMPLE_GOVERNORATES.flatMap(g => g.districts ?? []).find(d => d.name_ar === selectedDistrict);

    const governorateId = isDistrict || isDirectorate
      ? user.governorate_id
      : selectedGov === 'all'
        ? undefined
        : selectedGovObject?.id;

    const districtId = isDistrict
      ? user.district_id
      : selectedDistrict === 'all'
        ? undefined
        : selectedDistrictObject?.id;

    const governorateName = !governorateId && !isDistrict && !isDirectorate && selectedGov !== 'all'
      ? selectedGovObject?.name_ar
      : undefined;

    const districtName = !districtId && !isDistrict && selectedDistrict !== 'all'
      ? selectedDistrict
      : undefined;

    const isPlainTodayView =
      fromDate === today &&
      toDate === today &&
      selectedStatus === 'all' &&
      page === 1 &&
      (isDistrict || selectedDistrict === 'all') &&
      (!canChooseGovernorate || selectedGov === 'all');

    if (isPlainTodayView) {
      setRemoteRows(null);
      setResultCount(submissions.length);
      setServerPage(1);
      setServerTotalPages(1);
      setPeriodAnalytics(null);
      setAnalyticsComplete(true);
      return;
    }

    setLoadingRange(true);

    try {
      const result = await fetchReportPeriodBundle({
        fromDate,
        toDate,
        page,
        pageSize: 50,
        governorateId,
        districtId,
        governorateName,
        districtName,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      });

      setRemoteRows(result.rows);
      setResultCount(result.count);
      setServerPage(result.page);
      setServerTotalPages(result.totalPages);
      setPeriodAnalytics(result.analytics);
      setAnalyticsComplete(result.analyticsComplete);
    } catch {
      setRangeError('تعذر تحميل الفترة المطلوبة. أعد المحاولة.');
    } finally {
      setLoadingRange(false);
    }
  };

  const reset = () => {
    setPreset('today');
    setFromDate(today);
    setToDate(today);
    setSelectedGov('all');
    setSelectedDistrict('all');
    setSelectedStatus('all');
    setSearchTerm('');
    setRemoteRows(null);
    setResultCount(submissions.length);
    setServerPage(1);
    setServerTotalPages(1);
    setRangeError('');
    setPeriodAnalytics(null);
    setAnalyticsComplete(true);
  };

  return (
    <div className="space-y-3">
      <div className="gov-surface p-4">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#087f78]" />
              <h2 className="text-sm font-extrabold text-[#172033]">
                {reportTitle(user)}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#eef9f7] text-[#087f78] text-[8px] font-extrabold">
                {resultCount} سجل
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">
              اختر الفترة ثم اعرض النتائج. نطاق الحساب يطبق تلقائيًا ولا تحتاج لإعادة اختيار جهتك.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => window.print()}
              className="h-8 px-2.5 rounded-lg gov-btn-secondary text-[9px] font-extrabold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </button>
            <button
              onClick={() => exportToExcelFile('masar_detailed_report', columns, exportRows)}
              className="h-8 px-2.5 rounded-lg gov-btn-secondary text-[9px] font-extrabold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={() =>
                exportToStyledExcel(
                  'تقرير_مسار_التفصيلي',
                  'منظومة مَسَار - التقرير التفصيلي',
                  columns,
                  exportRows
                )
              }
              className="h-8 px-2.5 rounded-lg gov-btn-primary text-[9px] font-extrabold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
        </div>

        <div className="pt-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CalendarRange className="w-4 h-4 text-[#087f78]" />
            {[
              ['today', 'اليوم'],
              ['yesterday', 'أمس'],
              ['last7', '7 أيام'],
              ['last30', '30 يومًا'],
              ['custom', 'فترة مخصصة'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => applyPreset(value as PeriodPreset)}
                className={`h-8 px-3 rounded-lg border text-[9px] font-extrabold transition ${
                  preset === value
                    ? 'bg-[#087f78] text-white border-[#087f78]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}

            <button
              onClick={reset}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-[9px] font-bold inline-flex items-center gap-1.5 mr-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة الضبط
            </button>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${
            isDistrict
              ? 'xl:grid-cols-[1fr_1fr_150px_minmax(180px,1fr)_auto]'
              : isDirectorate
                ? 'xl:grid-cols-[1fr_1fr_190px_150px_minmax(180px,1fr)_auto]'
                : 'xl:grid-cols-[1fr_1fr_170px_190px_150px_minmax(180px,1fr)_auto]'
          }`}>
            <label>
              <span className="block text-[8px] font-bold text-slate-500 mb-1">من</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => {
                  setPreset('custom');
                  setFromDate(e.target.value);
                }}
                className="gov-input h-9 px-2.5 text-[9px]"
              />
            </label>

            <label>
              <span className="block text-[8px] font-bold text-slate-500 mb-1">إلى</span>
              <input
                type="date"
                value={toDate}
                onChange={e => {
                  setPreset('custom');
                  setToDate(e.target.value);
                }}
                className="gov-input h-9 px-2.5 text-[9px]"
              />
            </label>

            {canChooseGovernorate && (
              <label>
                <span className="block text-[8px] font-bold text-slate-500 mb-1">المحافظة</span>
                <select
                  value={selectedGov}
                  onChange={e => {
                    setSelectedGov(e.target.value);
                    setSelectedDistrict('all');
                  }}
                  className="gov-input h-9 px-2.5 text-[9px]"
                >
                  <option value="all">كل المحافظات</option>
                  {SAMPLE_GOVERNORATES.map(gov => (
                    <option key={gov.code} value={gov.code}>{gov.name_ar}</option>
                  ))}
                </select>
              </label>
            )}

            {canChooseDistrict && (
              <label>
                <span className="block text-[8px] font-bold text-slate-500 mb-1">الإدارة الصحية</span>
                <select
                  value={selectedDistrict}
                  onChange={e => setSelectedDistrict(e.target.value)}
                  className="gov-input h-9 px-2.5 text-[9px]"
                >
                  <option value="all">كل الإدارات</option>
                  {availableDistricts.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
            )}

            <label>
              <span className="block text-[8px] font-bold text-slate-500 mb-1">الحالة</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="gov-input h-9 px-2.5 text-[9px]"
              >
                <option value="all">كل الحالات</option>
                <option value="APPROVED">معتمد</option>
                <option value="SUBMITTED_LOCKED">مرفوع</option>
                <option value="RETURNED">مرجع</option>
                <option value="DRAFT">مسودة</option>
              </select>
            </label>

            <label>
              <span className="block text-[8px] font-bold text-slate-500 mb-1">بحث سريع</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={isDistrict ? 'بحث في السجلات...' : 'اسم الإدارة...'}
                  className="gov-input h-9 pr-8 pl-2 text-[9px]"
                />
              </div>
            </label>

            <div className="flex items-end">
              <button
                onClick={() => void loadRange(1)}
                disabled={loadingRange}
                className="w-full xl:w-auto h-9 px-4 rounded-lg gov-btn-primary text-[9px] font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-60 whitespace-nowrap"
              >
                {loadingRange
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Search className="w-3.5 h-3.5" />}
                عرض النتائج
              </button>
            </div>
          </div>

          {rangeError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-[9px] font-bold text-rose-700">
              {rangeError}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {[
          {
            label: isDistrict ? 'السجلات الظاهرة' : 'الجهات الظاهرة',
            value: filteredSubmissions.length,
            icon: <Building2 className="w-3.5 h-3.5 text-[#087f78]" />,
          },
          {
            label: 'المترددات',
            value: totals.attendees,
            icon: <Users className="w-3.5 h-3.5 text-sky-600" />,
          },
          {
            label: 'التحويلات',
            value: totals.referrals,
            icon: <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />,
          },
          {
            label: 'القيمة الثالثة',
            value: totals.value3,
            icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
          },
        ].map((item, index) => (
          <div key={index} className="gov-surface px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[8px] text-slate-500">
              {item.icon}
              {item.label}
            </div>
            <div className="text-base font-extrabold text-[#172033] tabular-nums mt-1">
              {item.value.toLocaleString('en-US')}
            </div>
          </div>
        ))}
      </div>

      {isMultiDay && filteredSubmissions.length > 0 && analyticsComplete && (
        <div className="gov-surface px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-[10px] font-extrabold text-[#172033]">تحليل الفترة المحددة</div>
            <div className="text-[8px] text-slate-400 mt-1">
              راجع عدة أيام دفعة واحدة بدل فتح كل سجل على حدة.
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPeriodView('summary')}
              className="h-9 px-3 rounded-lg gov-btn-secondary text-[9px] font-extrabold inline-flex items-center gap-1.5"
            >
              <Sigma className="w-3.5 h-3.5" />
              ملخص الفترة
            </button>
            <button
              onClick={() => setPeriodView('daily')}
              className="h-9 px-3 rounded-lg gov-btn-primary text-[9px] font-extrabold inline-flex items-center gap-1.5"
            >
              <TableProperties className="w-3.5 h-3.5" />
              التفصيل اليومي للفترة
            </button>
          </div>
        </div>
      )}

      {isMultiDay && !analyticsComplete && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[9px] text-amber-800">
          ملخص الفترة الكاملة يحتاج تحديث قاعدة البيانات الجديد. عرض السجلات الحالي يعمل بصورة طبيعية، وسيتم تفعيل التجميع الكامل بعد تطبيق الـmigration.
        </div>
      )}

      <SubmissionMonitoringTable
        submissions={filteredSubmissions}
        paginateLocally={remoteRows === null}
        title="السجلات اليومية"
        description="الأحمر للسجلات المتأخرة، والأصفر لطلبات الفتح، والأزرق للفتح الاستثنائي النشط."
      />


      {periodView && (
        <div className="fixed inset-0 z-[90] bg-slate-950/45 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-5" onClick={() => setPeriodView(null)}>
          <div className="w-full max-w-7xl max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#172033]">
                  {periodView === 'summary' ? 'ملخص الفترة' : 'التفصيل اليومي للفترة'}
                </h3>
                <p className="text-[9px] text-slate-500 mt-1">
                  من {fromDate} إلى {toDate} · {uniqueDates.length} يومًا ظاهرًا في النتائج
                </p>
              </div>
              <button
                onClick={() => setPeriodView(null)}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto max-h-[76vh]">
              {periodView === 'summary' ? (
                <table className="w-full min-w-[1100px] text-right">
                  <thead className="sticky top-0 bg-[#f7f9fb] border-b border-slate-200 text-[9px] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">القسم</th>
                      <th className="px-4 py-3 text-center">إجمالي القيمة 1</th>
                      <th className="px-4 py-3 text-center">إجمالي القيمة 2</th>
                      <th className="px-4 py-3 text-center">إجمالي القيمة 3</th>
                      <th className="px-4 py-3 text-center">المتوسط اليومي</th>
                      <th className="px-4 py-3 text-center">أعلى يوم</th>
                      <th className="px-4 py-3 text-center">أقل يوم</th>
                      <th className="px-4 py-3 text-center">أيام بها بيانات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodSummary.map(row => (
                      <tr key={row.code} className="text-[10px]">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-[#172033]">{row.name}</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">قسم {row.code}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold tabular-nums">{row.total1.toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-indigo-700 tabular-nums">{row.total2.toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center font-extrabold text-emerald-700 tabular-nums">{row.total3.toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center font-bold tabular-nums">{row.average.toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="font-bold text-slate-700">{row.highest.date}</div>
                          <div className="text-[8px] text-slate-400">{row.highest.total.toLocaleString('en-US')}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="font-bold text-slate-700">{row.lowest.date}</div>
                          <div className="text-[8px] text-slate-400">{row.lowest.total.toLocaleString('en-US')}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-extrabold tabular-nums">{row.daysWithData}/{uniqueDates.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[1400px] text-right">
                  <thead className="sticky top-0 bg-[#f7f9fb] border-b border-slate-200 text-[9px] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 min-w-[120px]">التاريخ</th>
                      {SECTIONS_DEFINITIONS.map(def => (
                        <th key={def.code} className="px-3 py-3 min-w-[150px] text-center">
                          <div>{def.name_ar}</div>
                          <div className="text-[7px] text-slate-400 mt-0.5">1 / 2 / 3</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyMatrix.map(day => (
                      <tr key={day.date} className="text-[9px]">
                        <td className="px-4 py-3 font-extrabold text-[#172033] tabular-nums">{day.date}</td>
                        {day.sections.map(section => (
                          <td key={section.code} className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5 tabular-nums">
                              <span className="font-extrabold text-slate-800">{section.field1.toLocaleString('en-US')}</span>
                              <span className="text-slate-300">/</span>
                              <span className="font-extrabold text-indigo-700">{section.field2.toLocaleString('en-US')}</span>
                              <span className="text-slate-300">/</span>
                              <span className="font-extrabold text-emerald-700">{section.field3.toLocaleString('en-US')}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {remoteRows !== null && serverTotalPages > 1 && (
        <div className="gov-surface px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="text-[9px] text-slate-500">
            صفحة {serverPage} من {serverTotalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={serverPage <= 1 || loadingRange}
              onClick={() => void loadRange(serverPage - 1)}
              className="h-8 px-3 rounded-lg gov-btn-secondary text-[9px] font-extrabold disabled:opacity-40"
            >
              السابق
            </button>
            <button
              disabled={serverPage >= serverTotalPages || loadingRange}
              onClick={() => void loadRange(serverPage + 1)}
              className="h-8 px-3 rounded-lg gov-btn-secondary text-[9px] font-extrabold disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
