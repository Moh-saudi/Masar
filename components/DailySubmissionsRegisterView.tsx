'use client';

import React, { useState, useMemo } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { SAMPLE_GOVERNORATES, SECTIONS_DEFINITIONS } from '@/lib/constants';
import {
  Building,
  Building2,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Clock3,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
  Printer,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  History,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { fetchSubmissionDetails } from '@/lib/services/submissions-client';
import { fetchSubmissionAuditLogs } from '@/lib/services/audit-client';
import { exportToStyledExcel } from '@/lib/excel-export';
import { OfficialRegisterReportModal } from './OfficialRegisterReportModal';
import { getCairoDateString } from '@/lib/date';
import type { AuditLog } from '@/lib/types';

interface DailySubmissionsRegisterViewProps {
  submissions: DailySubmission[];
  timeLock: TimeLockState;
  user: UserProfile;
  onRefreshData?: () => void;
}

type SubmissionFilterStatus = 'all' | 'completed' | 'in_progress' | 'late' | 'returned' | 'override';

interface FlattenedDistrictStatus {
  governorateId: string;
  governorateNameAr: string;
  districtId: string;
  districtNameAr: string;
  districtCode: string;
  submission?: DailySubmission;
  statusType: 'COMPLETED' | 'IN_PROGRESS' | 'LATE' | 'RETURNED' | 'OVERRIDE' | 'NOT_STARTED';
  statusLabelAr: string;
  statusBadgeClass: string;
  completedSectionsCount: number;
  totalSectionsCount: number;
  completionPercentage: number;
  submittedAtFormatted: string;
  lastUpdatedAtFormatted: string;
  enteredByName: string;
  isOverrideActive: boolean;
  isOverrideRequested: boolean;
  overrideMinutesLeft: number;
  returnedReason?: string;
  returnedByName?: string;
}

export const DailySubmissionsRegisterView: React.FC<DailySubmissionsRegisterViewProps> = ({
  submissions,
  timeLock,
  user,
  onRefreshData,
}) => {
  const isDirectorateUser = user.role === 'directorate_user';
  const directorateGovName = user.governorate_name_ar;

  const [selectedGov, setSelectedGov] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<SubmissionFilterStatus>('all');
  const [showPrintRegisterModal, setShowPrintRegisterModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Selected district for inspection modal
  const [inspectingDistrict, setInspectingDistrict] = useState<FlattenedDistrictStatus | null>(null);
  const [inspectingSubmissionDetails, setInspectingSubmissionDetails] = useState<DailySubmission | null>(null);
  const [inspectingAuditLogs, setInspectingAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // تحميل المحافظات المحدثة من التخزين المحلي
  const currentGovernoratesList = useMemo(() => {
    let govs = SAMPLE_GOVERNORATES;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('masar_hierarchy_governorates_v2');
        if (saved) {
          govs = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load saved hierarchy governorates', e);
      }
    }
    return govs;
  }, []);

  // Compute all districts (scoped to directorate governorate if directorate user, or all 300+ for higher admins)
  const allFlattenedDistricts = useMemo(() => {
    const list: FlattenedDistrictStatus[] = [];
    const submissionMapByDistrict = new Map<string, DailySubmission>();

    // Map existing submissions by district_id
    submissions.forEach(sub => {
      if (sub.district_id) {
        submissionMapByDistrict.set(sub.district_id, sub);
      }
    });

    const targetGovs = (isDirectorateUser && directorateGovName)
      ? currentGovernoratesList.filter(g => g.name_ar === directorateGovName || g.id === user.governorate_id)
      : currentGovernoratesList;

    // Traverse governorates and districts
    targetGovs.forEach(gov => {
      (gov.districts || []).forEach(dist => {
        const sub = submissionMapByDistrict.get(dist.id);

        let statusType: FlattenedDistrictStatus['statusType'] = 'NOT_STARTED';
        let statusLabelAr = 'لم يبدأ التسجيل';
        let statusBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';

        let completedSections = 0;
        const totalSections = SECTIONS_DEFINITIONS.length;

        if (sub?.sections) {
          completedSections = Object.values(sub.sections).filter(s => s?.status === 'completed').length;
        }

        const percentage = Math.round((completedSections / totalSections) * 100);

        const isOverrideActive = Boolean(
          sub?.override_active &&
          sub?.override_expires_at &&
          new Date(sub.override_expires_at).getTime() > Date.now()
        );

        const isOverrideRequested = Boolean(sub?.override_reason && !isOverrideActive);

        let overrideMinutesLeft = 0;
        if (isOverrideActive && sub?.override_expires_at) {
          overrideMinutesLeft = Math.max(0, Math.round((new Date(sub.override_expires_at).getTime() - Date.now()) / 60000));
        }

        const isLocked = timeLock.is_district_locked && !isOverrideActive;

        // Determine precise operational state
        if (isOverrideActive) {
          statusType = 'OVERRIDE';
          statusLabelAr = `استثناء نشط (متبقي ${overrideMinutesLeft} دقيقة)`;
          statusBadgeClass = 'bg-sky-50 text-sky-800 border-sky-300 font-extrabold';
        } else if (isOverrideRequested) {
          statusType = 'OVERRIDE';
          statusLabelAr = 'طلب استثناء قيد المراجعة';
          statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold';
        } else if (sub?.status === 'RETURNED' || sub?.directorate_status === 'RETURNED') {
          statusType = 'RETURNED';
          statusLabelAr = 'مرجع للتصحيح من المديرية';
          statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold';
        } else if (sub?.ministry_status === 'APPROVED') {
          statusType = 'COMPLETED';
          statusLabelAr = 'معتمد من الوزارة';
          statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black';
        } else if (sub?.directorate_status === 'APPROVED') {
          statusType = 'COMPLETED';
          statusLabelAr = 'معتمد من المديرية';
          statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold';
        } else if (sub?.status === 'SUBMITTED_LOCKED') {
          statusType = 'COMPLETED';
          statusLabelAr = 'مكتمل ومرفوع (بانتظار المراجعة)';
          statusBadgeClass = 'bg-[#eaf8f5] text-[#087f78] border-[#a9e2d9] font-extrabold';
        } else if (sub?.status === 'DRAFT' || (sub && completedSections > 0)) {
          if (isLocked) {
            statusType = 'LATE';
            statusLabelAr = 'مسودة متأخرة عن الإغلاق';
            statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold';
          } else {
            statusType = 'IN_PROGRESS';
            statusLabelAr = `جاري التسجيل (${percentage}%)`;
            statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
          }
        } else {
          // No record started yet
          if (isLocked) {
            statusType = 'LATE';
            statusLabelAr = 'متأخر عن موعد الإغلاق (لم يسجل)';
            statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold';
          } else {
            statusType = 'NOT_STARTED';
            statusLabelAr = 'بانتظار بدء التسجيل';
            statusBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
          }
        }

        // Format dates
        let submittedAtFormatted = '—';
        if (sub?.updated_at && (sub.status === 'SUBMITTED_LOCKED' || sub.directorate_status === 'APPROVED' || sub.status === 'APPROVED')) {
          try {
            const d = new Date(sub.updated_at);
            submittedAtFormatted = new Intl.DateTimeFormat('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Africa/Cairo'
            }).format(d);
          } catch {
            submittedAtFormatted = sub.updated_at.slice(11, 16);
          }
        }

        let lastUpdatedAtFormatted = '—';
        if (sub?.updated_at) {
          try {
            const d = new Date(sub.updated_at);
            lastUpdatedAtFormatted = new Intl.DateTimeFormat('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Africa/Cairo'
            }).format(d);
          } catch {
            lastUpdatedAtFormatted = sub.updated_at.slice(11, 16);
          }
        }

        list.push({
          governorateId: gov.id,
          governorateNameAr: gov.name_ar,
          districtId: dist.id,
          districtNameAr: dist.name_ar,
          districtCode: dist.code,
          submission: sub,
          statusType,
          statusLabelAr,
          statusBadgeClass,
          completedSectionsCount: completedSections,
          totalSectionsCount: totalSections,
          completionPercentage: percentage,
          submittedAtFormatted,
          lastUpdatedAtFormatted,
          enteredByName: 'مسؤول الإدخال',
          isOverrideActive,
          isOverrideRequested,
          overrideMinutesLeft,
          returnedReason: sub?.returned_reason,
          returnedByName: sub?.returned_by || 'مراجع المديرية',
        });
      });
    });

    return list;
  }, [submissions, timeLock]);

  // Overall KPIs
  const totalDistrictsCount = allFlattenedDistricts.length;
  const completedCount = allFlattenedDistricts.filter(d => d.statusType === 'COMPLETED').length;
  const inProgressCount = allFlattenedDistricts.filter(d => d.statusType === 'IN_PROGRESS').length;
  const lateCount = allFlattenedDistricts.filter(d => d.statusType === 'LATE').length;
  const returnedCount = allFlattenedDistricts.filter(d => d.statusType === 'RETURNED').length;
  const overrideCount = allFlattenedDistricts.filter(d => d.statusType === 'OVERRIDE').length;
  const completionRate = totalDistrictsCount > 0 ? Math.round((completedCount / totalDistrictsCount) * 100) : 0;
  const selectedDate = getCairoDateString();

  // Filtered List
  // تصدير كشف المتابعة اليومي إلى إكسيل رسمي منسق
  const handleExportRegisterExcel = () => {
    const columns = [
      { header: 'م', key: 'index', width: 40 },
      { header: 'كود الإدارة', key: 'districtCode', width: 90 },
      { header: 'اسم الإدارة الصحية', key: 'districtNameAr', width: 180 },
      { header: 'المحافظة', key: 'governorateNameAr', width: 120 },
      { header: 'موقف التسجيل لليوم', key: 'statusLabelAr', width: 140 },
      { header: 'نسبة الإنجاز', key: 'completionRateStr', width: 90 },
      { header: 'الأقسام المكتملة', key: 'sectionsStr', width: 100 },
      { header: 'توقيت التسجيل والاعتماد', key: 'submittedAtFormatted', width: 140 },
    ];

    const data = filteredDistricts.map((item, idx) => ({
      ...item,
      index: idx + 1,
      completionRateStr: `${item.completionPercentage}%`,
      sectionsStr: `${item.completedSectionsCount} من ${item.totalSectionsCount}`,
    }));

    const govLabel = selectedGov === 'all'
      ? 'كافة محافظات الجمهورية (27 محافظة)'
      : (SAMPLE_GOVERNORATES.find(g => g.id === selectedGov)?.name_ar || 'المحافظة المحددة');

    exportToStyledExcel(
      `كشف_متابعة_مسار_${selectedDate}`,
      'سجل المتابعة اليومي لرصد ومطابقة تسجيل إدارات تنمية الأسرة (LARC)',
      columns,
      data,
      {
        subtitle: `بيان تاريخ: ${selectedDate} • النطاق: ${govLabel}`,
        governorateName: govLabel,
        kpis: [
          { label: 'إجمالي الإدارات', value: totalDistrictsCount },
          { label: 'المكتملة والمعتمدة', value: completedCount },
          { label: 'جاري الإدخال (مسودات)', value: inProgressCount },
          { label: 'المتأخرة عن الإغلاق', value: lateCount },
          { label: 'نسبة الإنجاز القومي', value: `${completionRate}%` },
        ],
        showSignatures: true,
      }
    );
  };

  const filteredDistricts = useMemo(() => {
    return allFlattenedDistricts.filter(d => {
      // Governorate filter
      if (selectedGov !== 'all' && d.governorateId !== selectedGov && d.governorateNameAr !== selectedGov) {
        return false;
      }

      // Status filter
      if (statusFilter === 'completed' && d.statusType !== 'COMPLETED') return false;
      if (statusFilter === 'in_progress' && d.statusType !== 'IN_PROGRESS') return false;
      if (statusFilter === 'late' && d.statusType !== 'LATE') return false;
      if (statusFilter === 'returned' && d.statusType !== 'RETURNED') return false;
      if (statusFilter === 'override' && d.statusType !== 'OVERRIDE') return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesDistrict = d.districtNameAr.toLowerCase().includes(q);
        const matchesGov = d.governorateNameAr.toLowerCase().includes(q);
        const matchesCode = d.districtCode.toLowerCase().includes(q);
        const matchesUser = d.enteredByName.toLowerCase().includes(q);
        if (!matchesDistrict && !matchesGov && !matchesCode && !matchesUser) {
          return false;
        }
      }

      return true;
    });
  }, [allFlattenedDistricts, selectedGov, statusFilter, searchTerm]);

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(filteredDistricts.length / pageSize));
  const paginatedDistricts = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredDistricts.slice(from, from + pageSize);
  }, [filteredDistricts, currentPage, pageSize]);

  // Open Inspection Modal for a district
  const handleInspectDistrict = async (district: FlattenedDistrictStatus) => {
    setInspectingDistrict(district);
    setInspectingSubmissionDetails(district.submission || null);
    setInspectingAuditLogs([]);
    setIsLoadingDetails(true);

    if (district.submission?.id) {
      try {
        const details = await fetchSubmissionDetails(district.submission.id);
        if (details) {
          setInspectingSubmissionDetails(details);
        }
        const logs = await fetchSubmissionAuditLogs(district.submission.id);
        setInspectingAuditLogs(logs || []);
      } catch (err) {
        console.error('Failed to load inspection details', err);
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ================= TOP SUPERVISORY HERO & KPIS ================= */}
      <div className="gov-surface p-5 sm:p-6 bg-white border border-[#dce5ed] rounded-3xl shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf9f7] border border-[#c4eae5] text-[#087f78] text-[11px] font-extrabold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isDirectorateUser ? `المتابعة الرقابية لمديرية الشئون الصحية بـ ${directorateGovName || 'المحافظة'}` : 'المتابعة الرقابية المركزية الشاملة'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
              {isDirectorateUser
                ? `سجلات اليوم — إدارات محافظة ${directorateGovName || ''}`
                : 'سجلات اليوم — الموقف التنفيذي للإدارات الصحية'}
            </h1>
            <p className="text-xs sm:text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isDirectorateUser
                ? `شاشة متابعة حية لموقف تسجيل إدارات مديرية الشئون الصحية بمحافظة ${directorateGovName || ''} (${totalDistrictsCount} إدارة صحية) لليوم الحالي.`
                : `شاشة إشرافية موحدة لمتابعة رصد كافة الإدارات الصحية في جمهورية مصر العربية (${totalDistrictsCount} إدارة صحية موزعة على 27 محافظة) لمعرفة موقف الإدخال والتسجيل الجاري والاعتماد لحظة بلحظة.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition shadow-xs"
                title="تحديث البيانات اللحظية من الخادم"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#087f78]" />
                <span>تحديث الموقف</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive KPI Counter Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[10px] font-bold">إجمالي الإدارات</span>
              <Building className="w-3.5 h-3.5 text-[#087f78]" />
            </div>
            <div className="text-xl font-black text-[#172033] tabular-nums">{totalDistrictsCount}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {isDirectorateUser ? `نطاق محافظة ${directorateGovName || ''}` : '27 محافظة بالجمهورية'}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <div className="flex items-center justify-between text-emerald-700 mb-1.5">
              <span className="text-[10px] font-extrabold">مكتمل ومرفوع</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-800 tabular-nums">{completedCount}</div>
            <div className="text-[9px] text-emerald-600 mt-0.5 font-bold">
              {Math.round((completedCount / (totalDistrictsCount || 1)) * 100)}% {isDirectorateUser ? 'من إدارات المحافظة' : 'من إجمالي مصر'}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5">
            <div className="flex items-center justify-between text-amber-700 mb-1.5">
              <span className="text-[10px] font-extrabold">جاري الإدخال الآن</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-800 tabular-nums">{inProgressCount}</div>
            <div className="text-[9px] text-amber-600 mt-0.5 font-bold">مسودات قيد الاستكمال</div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5">
            <div className="flex items-center justify-between text-rose-700 mb-1.5">
              <span className="text-[10px] font-extrabold">متأخر عن الإغلاق</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-800 tabular-nums">{lateCount}</div>
            <div className="text-[9px] text-rose-600 mt-0.5 font-bold">تجاوزت موعد 03:00 م</div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5">
            <div className="flex items-center justify-between text-rose-700 mb-1.5">
              <span className="text-[10px] font-extrabold">مرجع للتصحيح</span>
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-800 tabular-nums">{returnedCount}</div>
            <div className="text-[9px] text-rose-600 mt-0.5 font-bold">أرجعته المديريات</div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3.5">
            <div className="flex items-center justify-between text-sky-700 mb-1.5">
              <span className="text-[10px] font-extrabold">استثناءات وتمديد</span>
              <Unlock className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-xl font-black text-sky-800 tabular-nums">{overrideCount}</div>
            <div className="text-[9px] text-sky-600 mt-0.5 font-bold">سارية أو قيد الطلب</div>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & ADVANCED FILTER CONTROLS ================= */}
      <div className="gov-surface p-4 sm:p-5 bg-white border border-[#dce5ed] rounded-3xl shadow-sm space-y-4">
        
        {/* Status Tab Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'كافة الإدارات', count: totalDistrictsCount },
            { id: 'completed', label: 'المكتملة والمعتمدة', count: completedCount, color: 'text-emerald-700' },
            { id: 'in_progress', label: 'جاري التسجيل (مسودات)', count: inProgressCount, color: 'text-amber-700' },
            { id: 'late', label: 'المتأخرة عن الإغلاق', count: lateCount, color: 'text-rose-700' },
            { id: 'returned', label: 'المرجعة للتصحيح', count: returnedCount, color: 'text-rose-700' },
            { id: 'override', label: 'الاستثناءات والتمديد', count: overrideCount, color: 'text-sky-700' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as SubmissionFilterStatus);
                setCurrentPage(1);
              }}
              className={`h-9 px-3.5 rounded-xl font-extrabold transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-[#087f78] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] tabular-nums font-mono ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Inputs Row: Search Term & Governorate Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ابحث باسم الإدارة الصحية أو المحافظة أو كود الإدارة..."
              className="gov-input h-11 pr-10 pl-9 text-xs w-full rounded-2xl border-slate-200 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-64 shrink-0">
            <select
              value={selectedGov}
              onChange={e => {
                if (!isDirectorateUser) {
                  setSelectedGov(e.target.value);
                  setCurrentPage(1);
                }
              }}
              disabled={isDirectorateUser}
              className={`gov-input h-11 px-3.5 text-xs w-full rounded-2xl border-slate-200 bg-white font-bold text-slate-700 ${
                isDirectorateUser ? 'bg-slate-50 cursor-not-allowed opacity-90' : 'cursor-pointer'
              }`}
            >
              {isDirectorateUser ? (
                <option value="all">
                  محافظة {directorateGovName || 'المحافظة'} ({totalDistrictsCount} إدارة) - نطاق الحساب
                </option>
              ) : (
                <>
                  <option value="all">كافة محافظات الجمهورية (27 محافظة)</option>
                  {currentGovernoratesList.map(gov => (
                    <option key={gov.id} value={gov.id}>
                      محافظة {gov.name_ar} ({(gov.districts || []).length} إدارة)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ================= MASTER REGISTER TABLE ================= */}
      <div className="gov-surface overflow-hidden border border-[#dce5ed] rounded-3xl bg-white shadow-sm">
        
        {/* Table Top Bar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-[#fcfdfe]">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-[#172033]">كشف المتابعة اليومي</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold tabular-nums">
              {filteredDistricts.length} إدارة مطابقة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportRegisterExcel}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="تصدير كشف المتابعة الحالي بتنسيق إكسيل رسمي"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#087f78]" />
              <span>تصدير Excel منسق</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintRegisterModal(true)}
              className="h-9 px-4 rounded-xl bg-[#087f78] hover:bg-[#066560] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="معاينة وطباعة السجل الرسمي المعتمد بمقاس A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة السجل الرسمي (A4)</span>
            </button>

            <div className="text-xs text-slate-400 font-medium mr-2 hidden md:block">
              توقيت المنظومة: <span className="font-extrabold text-slate-700 font-mono">{timeLock.current_time_str}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-600 border-b border-slate-200 text-[11px] font-extrabold select-none">
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3 min-w-[200px]">الإدارة الصحية</th>
                <th className="px-4 py-3 min-w-[140px]">المحافظة</th>
                <th className="px-4 py-3 min-w-[200px]">موقف التسجيل لليوم</th>
                <th className="px-4 py-3 text-center min-w-[130px]">نسبة الإنجاز</th>
                <th className="px-4 py-3 text-center min-w-[130px]">التوقيت</th>
                <th className="px-4 py-3 text-center min-w-[120px]">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedDistricts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Building className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    لا توجد إدارات صحية مطابقة لمعايير البحث والتصفية المختارة.
                  </td>
                </tr>
              ) : (
                paginatedDistricts.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.districtId} className="hover:bg-[#fbfcfd] transition-colors duration-150">
                      
                      {/* # Number */}
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-[11px] tabular-nums">
                        {globalIdx}
                      </td>

                      {/* District Name & Code */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#eaf9f7] text-[#087f78] border border-[#bfebe5] flex items-center justify-center shrink-0">
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#172033] leading-tight truncate">
                              {item.districtNameAr}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              كود: {item.districtCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Governorate */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-700 text-[11px] font-bold">
                          <MapPin className="w-3 h-3 text-[#087f78]" />
                          <span>محافظة {item.governorateNameAr}</span>
                        </div>
                      </td>

                      {/* Status Badge & Notes */}
                      <td className="px-4 py-3.5">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] ${item.statusBadgeClass}`}>
                            {item.statusType === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {item.statusType === 'IN_PROGRESS' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                            {item.statusType === 'LATE' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                            {item.statusType === 'RETURNED' && <RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
                            {item.statusType === 'OVERRIDE' && <Unlock className="w-3.5 h-3.5 text-sky-600" />}
                            <span>{item.statusLabelAr}</span>
                          </span>

                          {/* Returned Reason preview */}
                          {item.returnedReason && (
                            <div className="text-[10px] text-rose-600 font-bold mt-1 line-clamp-1">
                              سبب الإرجاع: {item.returnedReason}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Progress Bar & Sections */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="w-28 mx-auto space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                            <span>{item.completedSectionsCount}/{item.totalSectionsCount} قسم</span>
                            <span className="font-extrabold">{item.completionPercentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                item.completionPercentage === 100
                                  ? 'bg-emerald-500'
                                  : item.completionPercentage > 0
                                    ? 'bg-[#087f78]'
                                    : 'bg-slate-200'
                              }`}
                              style={{ width: `${item.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="text-[11px] font-mono font-bold text-slate-700">
                          {item.submittedAtFormatted !== '—' ? item.submittedAtFormatted : item.lastUpdatedAtFormatted}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {item.submittedAtFormatted !== '—' ? 'وقت الإرسال' : 'آخر تعديل'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => void handleInspectDistrict(item)}
                          className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-[#eaf9f7] hover:border-[#087f78]/30 hover:text-[#087f78] text-slate-700 text-[11px] font-extrabold inline-flex items-center gap-1.5 transition shadow-2xs"
                          title="استعراض البيان والإحصائيات الخاصة بالإدارة"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#087f78]" />
                          <span>استعراض</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3 bg-[#fbfcfd] text-xs">
            <span className="text-slate-500 font-medium">
              عرض صفحة <span className="font-extrabold text-slate-800 font-mono">{currentPage}</span> من{' '}
              <span className="font-extrabold text-slate-800 font-mono">{totalPages}</span>
              <span className="text-slate-400 mx-2">•</span>
              الإجمالي: <span className="font-extrabold text-[#087f78] font-mono">{filteredDistricts.length}</span> إدارة
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
              >
                <span>التالي</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= SUPERVISORY INSPECTION MODAL ================= */}
      {inspectingDistrict && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setInspectingDistrict(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[92vh] overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-[#fcfdfe]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#eaf9f7] text-[#087f78] border border-[#bfebe5] flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#172033]">
                      {inspectingDistrict.districtNameAr}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">({inspectingDistrict.districtCode})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    محافظة {inspectingDistrict.governorateNameAr} — الموقف الرقابي لليوم
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full border text-xs ${inspectingDistrict.statusBadgeClass}`}>
                  {inspectingDistrict.statusLabelAr}
                </span>
                <button
                  onClick={() => setInspectingDistrict(null)}
                  className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-6">
              
              {/* Top Summary Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[10px] text-slate-400 mb-1">مسؤول الإدخال</div>
                  <div className="text-xs font-extrabold text-[#172033] truncate">
                    {inspectingDistrict.enteredByName}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[10px] text-slate-400 mb-1">توقيت الرفع الرسمي</div>
                  <div className="text-xs font-extrabold text-slate-800 font-mono">
                    {inspectingDistrict.submittedAtFormatted}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[10px] text-slate-400 mb-1">الأقسام المستوفاة</div>
                  <div className="text-xs font-extrabold text-[#087f78] font-mono">
                    {inspectingDistrict.completedSectionsCount} من {inspectingDistrict.totalSectionsCount} قسم
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[10px] text-slate-400 mb-1">الموقف الزمني</div>
                  <div className="text-xs font-extrabold text-slate-800">
                    {timeLock.is_district_locked ? 'النافذة مغلقة رسمياً' : 'نافذة الإدخال مفتوحة'}
                  </div>
                </div>
              </div>

              {/* Returned Notice if applicable */}
              {inspectingDistrict.returnedReason && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-rose-700">
                    <RotateCcw className="w-4 h-4" />
                    <span>تم إرجاع البيان للتعديل بواسطة: {inspectingDistrict.returnedByName}</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    ملاحظات الإرجاع: {inspectingDistrict.returnedReason}
                  </p>
                </div>
              )}

              {/* Sections Breakdown Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold text-[#172033] flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[#087f78]" />
                    <span>بيانات الأقسام الإحصائية الـ 12</span>
                  </h4>
                  {isLoadingDetails && (
                    <span className="text-[10px] text-[#087f78] flex items-center gap-1 font-bold">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      جاري تحميل التفاصيل...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SECTIONS_DEFINITIONS.map(def => {
                    const secData = inspectingSubmissionDetails?.sections?.[def.code];
                    const isCompleted = secData?.status === 'completed';

                    return (
                      <div
                        key={def.code}
                        className={`p-3 rounded-2xl border transition ${
                          isCompleted
                            ? 'bg-[#fcfdfe] border-emerald-200/80 shadow-2xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold text-[#172033]">
                            {def.code}. {def.name_ar}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isCompleted ? 'مكتمل' : 'غير مكتمل'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1 border-t border-slate-100">
                          <div>
                            <div className="text-[9px] text-slate-400 truncate">{def.field_1_label}</div>
                            <div className="font-extrabold font-mono text-slate-800 mt-0.5">
                              {secData?.field_1_value || 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 truncate">{def.field_2_label}</div>
                            <div className="font-extrabold font-mono text-slate-800 mt-0.5">
                              {secData?.field_2_value || 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 truncate">{def.field_3_label}</div>
                            <div className="font-extrabold font-mono text-slate-800 mt-0.5">
                              {secData?.field_3_value || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit Trail for this submission */}
              {inspectingAuditLogs.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-extrabold text-[#172033] flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <History className="w-4 h-4 text-[#087f78]" />
                    <span>سجل الحركات الرقابي الخاص بالإدارة</span>
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                    {inspectingAuditLogs.map(log => (
                      <div key={log.id} className="p-3 bg-white flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-[#172033] text-[11px]">{log.action_type}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{log.description}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-slate-400 font-mono">{log.timestamp}</div>
                          <div className="text-[9px] text-slate-400">{log.actor_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-[#fbfcfd] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingDistrict(null)}
                className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition shadow-2xs"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة طباعة السجل الرسمي المعتمد بمقاس A4 */}
      {showPrintRegisterModal && (
        <OfficialRegisterReportModal
          dateStr={selectedDate}
          governorateFilterName={
            selectedGov === 'all'
              ? 'كافة محافظات الجمهورية (27 محافظة)'
              : (SAMPLE_GOVERNORATES.find(g => g.id === selectedGov)?.name_ar || 'المحافظة المحددة')
          }
          rows={filteredDistricts}
          kpis={{
            totalExpected: totalDistrictsCount,
            completedCount,
            inProgressCount,
            lateCount,
            overrideCount,
            completionRate,
          }}
          currentUser={user}
          onClose={() => setShowPrintRegisterModal(false)}
        />
      )}
    </div>
  );
};
