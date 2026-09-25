'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { approveNationalReport, fetchDailySubmissions } from '@/lib/services/submissions-client';
import { SAMPLE_GOVERNORATES } from '@/lib/constants';
import { getCairoDateString } from '@/lib/date';
import { OperationFeedbackDialog } from './OperationFeedbackDialog';
import { ConfirmationDialog } from './ConfirmationDialog';
import { SubmissionMonitoringTable } from './SubmissionMonitoringTable';
import { 
  Users, 
  HeartHandshake, 
  ShieldCheck, 
  FileCheck2, 
  CheckCircle, 
  BarChart3,
  Award,
  Sparkles,
  Timer,
  Stethoscope,
  MapPin,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Activity,
  UserCheck,
  Building,
  Building2,
  Layers,
  Calendar,
  CalendarDays,
  Clock,
  Lock,
  CheckCircle2,
  Filter,
  CheckCheck,
  AlertCircle,
  Search,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
  LabelList
} from 'recharts';

interface NationalDashboardViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
  timeLock: TimeLockState;
  onDataChanged: () => void;
  onOpenReport: () => void;
}

const REGION_COLORS: Record<string, string> = {
  'الوجه البحري': '#0284c7',
  'الوجه القبلي': '#10b981',
  'محافظات الحضر': '#6366f1',
  'محافظات الحدود': '#f59e0b',
};

export const NationalDashboardView: React.FC<NationalDashboardViewProps> = ({
  submissions,
  user,
  timeLock,
  onDataChanged,
  onOpenReport,
}) => {
  // تحديد التبويب الافتراضي وفقاً لدور المستخدم
  const defaultTab = 
    user.role === 'general_director' ? 'deep_dive' :
    user.role === 'central_admin' ? 'tactical' : 'macro';

  const [suiteTab, setSuiteTab] = useState<'macro' | 'tactical' | 'deep_dive'>(defaultTab);
  const [operationFeedback, setOperationFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [govChartFilter, setGovChartFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  // سجل الاعتماد النهائي اليومي المحفوظ (يُقفل لليوم ولا يقبل التكرار حتى موعد الغد)
  interface DailyApprovalRecord {
    date: string;
    approvedAt: string;
    approverName: string;
    approverRole: string;
  }

  const [dailyApprovalRecord, setDailyApprovalRecord] = useState<DailyApprovalRecord | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('masar_national_daily_approval_v1');
        if (saved) {
          setDailyApprovalRecord(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load daily approval record', e);
      }
    }
  }, []);

  const todayDateStr = getCairoDateString();
  const isApprovedToday = dailyApprovalRecord?.date === todayDateStr;

  const yesterdayDateStr = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }, []);

  // جلب إحصائيات الأمس الفعلية من قاعدة البيانات للمقارنة الحقيقية
  const [yesterdayRegisteredCount, setYesterdayRegisteredCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const loadYesterdayData = async () => {
      try {
        const ySubs = await fetchDailySubmissions(yesterdayDateStr);
        if (isMounted) {
          setYesterdayRegisteredCount(ySubs.length);
        }
      } catch (err) {
        console.error('Failed to load yesterday submissions', err);
      }
    };
    loadYesterdayData();
    return () => { isMounted = false; };
  }, [yesterdayDateStr]);

  // توقيت القاهرة الفعلي لتحديد نافذة الاعتماد الرسمية (من 18:00 إلى 22:00)
  const [cairoHour, setCairoHour] = useState<number>(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Cairo',
        hour: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const val = parts.find(p => p.type === 'hour')?.value;
      return val ? parseInt(val, 10) : new Date().getHours();
    } catch {
      return new Date().getHours();
    }
  });

  // نافذة الاعتماد النهائي الرسمية: 18:00 إلى 22:00
  const isWithinApprovalWindow = cairoHour >= 18 && cairoHour < 22;
  const isBeforeApprovalWindow = cairoHour < 18;

  // المستخدمون المسموح لهم بالاعتماد النهائي: رئيس الإدارة المركزية ومدير النظام (وليس رئيس القطاع)
  const canUserApprove = user.role === 'central_admin' || user.role === 'super_admin';

  // عداد تنازلي لموعد إغلاق الاعتماد القومي النهائي (الساعة 10:00 مساءً)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isPassed: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPassed: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(22, 0, 0, 0); // 10:00 PM

      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isPassed: true });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isPassed: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // جلب الهيكل الإداري للمحافظات الـ 27 متزامناً مع التعديلات
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

  // إدارة التصفية والفلترة الحقيقية للبيانات
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [customDateValue, setCustomDateValue] = useState<string>(todayDateStr);
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('all');
  const [fetchedSubmissions, setFetchedSubmissions] = useState<DailySubmission[] | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);

  const loadSubmissionsByFilter = useCallback(async (mode: 'all' | 'today' | 'yesterday' | 'custom', customVal?: string) => {
    setIsFilterLoading(true);
    setDateFilterMode(mode);
    try {
      let targetDate: string | undefined = undefined;
      if (mode === 'today') {
        targetDate = todayDateStr;
      } else if (mode === 'yesterday') {
        targetDate = yesterdayDateStr;
      } else if (mode === 'custom') {
        targetDate = customVal || customDateValue;
      } else {
        targetDate = undefined; // 'all'
      }

      const res = await fetchDailySubmissions(targetDate);
      setFetchedSubmissions(res);
    } catch (e) {
      console.error('Failed to load submissions by filter', e);
    } finally {
      setIsFilterLoading(false);
    }
  }, [todayDateStr, yesterdayDateStr, customDateValue]);

  useEffect(() => {
    loadSubmissionsByFilter('all');
  }, [loadSubmissionsByFilter]);

  // السجلات النشطة وفقاً للفلترة الحقيقية المختارة
  const activeSubmissions = useMemo(() => {
    let list = fetchedSubmissions !== null ? fetchedSubmissions : submissions;
    if (selectedGovFilter !== 'all') {
      list = list.filter(s => s.governorate_name_ar === selectedGovFilter || s.governorate_id === selectedGovFilter);
    }
    return list;
  }, [fetchedSubmissions, submissions, selectedGovFilter]);

  // حساب موقف التسجيل للمحافظات الـ 27 (بيانات حقيقية فعلية 100%)
  // اختصارات لأسماء المحافظات الطويلة لتحسين العرض في محور السيني
  const GOV_SHORT_NAMES: Record<string, string> = {
    'الإسكندرية': 'الإسكندرية',
    'القاهرة': 'القاهرة',
    'الجيزة': 'الجيزة',
    'الدقهلية': 'الدقهلية',
    'الشرقية': 'الشرقية',
    'القليوبية': 'القليوبية',
    'كفر الشيخ': 'كفر الشيخ',
    'الغربية': 'الغربية',
    'المنوفية': 'المنوفية',
    'البحيرة': 'البحيرة',
    'الإسماعيلية': 'الإسماعيلية',
    'دمياط': 'دمياط',
    'بورسعيد': 'بورسعيد',
    'السويس': 'السويس',
    'الفيوم': 'الفيوم',
    'بني سويف': 'بني سويف',
    'المنيا': 'المنيا',
    'أسيوط': 'أسيوط',
    'سوهاج': 'سوهاج',
    'قنا': 'قنا',
    'أسوان': 'أسوان',
    'الأقصر': 'الأقصر',
    'البحر الأحمر': 'البحر الأحمر',
    'الوادي الجديد': 'الوادي الجديد',
    'مطروح': 'مطروح',
    'شمال سيناء': 'شمال سيناء',
    'جنوب سيناء': 'جنوب سيناء',
  };

  const governorateChartData = useMemo(() => {
    const realCountByGov = new Map<string, number>();
    activeSubmissions.forEach(sub => {
      if (sub.governorate_name_ar) {
        realCountByGov.set(sub.governorate_name_ar, (realCountByGov.get(sub.governorate_name_ar) || 0) + 1);
      }
    });

    // ضمان عدم تكرار المحافظات باستخدام الـ code كمفتاح فريد
    const seenCodes = new Set<string>();
    return currentGovernoratesList
      .filter(gov => {
        if (seenCodes.has(gov.code)) return false;
        seenCodes.add(gov.code);
        return true;
      })
      .map(gov => {
        const total = gov.districts?.length || 0;
        const realCount = realCountByGov.get(gov.name_ar) || 0;
        const registered = realCount;
        const percentage = total > 0 ? Math.round((registered / total) * 100) : 0;
        // اسم مختصر للعرض في المحور السيني، والاسم الكامل للـ tooltip
        const displayName = GOV_SHORT_NAMES[gov.name_ar] || gov.name_ar;

        return {
          name: displayName,
          fullName: gov.name_ar,
          code: gov.code,
          totalDistricts: total,
          registeredDistricts: registered,
          remainingDistricts: Math.max(0, total - registered),
          percentage,
          isComplete: registered === total && total > 0,
        };
      });
  }, [currentGovernoratesList, activeSubmissions]);

  // إجماليات الجمهورية
  const totalRepublicDistricts = useMemo(() => {
    return governorateChartData.reduce((acc, g) => acc + g.totalDistricts, 0) || 281;
  }, [governorateChartData]);

  const totalRepublicRegisteredToday = useMemo(() => {
    return activeSubmissions.length; // الإدارات المسجلة فعلياً لليوم فقط
  }, [activeSubmissions]);

  const nationalTodayPercentage = totalRepublicDistricts > 0
    ? Math.round((totalRepublicRegisteredToday / totalRepublicDistricts) * 100)
    : 0;

  // إحصائية اليوم السابق الفعلية
  const yesterdayPercentage = totalRepublicDistricts > 0
    ? Math.round((yesterdayRegisteredCount / totalRepublicDistricts) * 100)
    : 0;
  const dailyChangeDistricts = totalRepublicRegisteredToday - yesterdayRegisteredCount;
  const dailyChangePercentage = (nationalTodayPercentage - yesterdayPercentage).toFixed(1);

  let totalAttendees = 0;
  let totalReferrals = 0;
  let totalLarcUsers = 0;
  let copperIUD = 0;
  let hormonalIUD = 0;
  let implanon = 0;

  activeSubmissions.forEach(sub => {
    Object.values(sub.sections || {}).forEach(sec => {
      if (sec.section_code === 12) {
        copperIUD += sec.field_1_value || 0;
        hormonalIUD += sec.field_2_value || 0;
        implanon += sec.field_3_value || 0;
      } else {
        totalAttendees += sec.field_1_value || 0;
        totalReferrals += sec.field_2_value || 0;
        totalLarcUsers += sec.field_3_value || 0;
      }
    });
  });

  const totalLarcAll = totalLarcUsers + copperIUD + hormonalIUD + implanon;
  const totalDistricts = activeSubmissions.length;
  const approvedDistricts = activeSubmissions.filter(s => s.status === 'APPROVED' || s.ministry_status === 'APPROVED').length;
  const nationalRate = totalDistricts > 0 ? Math.round((approvedDistricts / totalDistricts) * 100) : 0;

  // 1. بيانات لوحة الإدارة المركزية (الأقاليم والقوى البشرية) - محسوبة حقيقياً من واقع السجلات
  const GOV_REGION_MAP: Record<string, string> = {
    'القاهرة': 'محافظات الحضر',
    'الإسكندرية': 'محافظات الحضر',
    'بورسعيد': 'محافظات الحضر',
    'السويس': 'محافظات الحضر',
    'الدقهلية': 'الوجه البحري',
    'الشرقية': 'الوجه البحري',
    'القليوبية': 'الوجه البحري',
    'كفر الشيخ': 'الوجه البحري',
    'الغربية': 'الوجه البحري',
    'المنوفية': 'الوجه البحري',
    'البحيرة': 'الوجه البحري',
    'الإسماعيلية': 'الوجه البحري',
    'دمياط': 'الوجه البحري',
    'الجيزة': 'الوجه القبلي',
    'الفيوم': 'الوجه القبلي',
    'بني سويف': 'الوجه القبلي',
    'المنيا': 'الوجه القبلي',
    'أسيوط': 'الوجه القبلي',
    'سوهاج': 'الوجه القبلي',
    'قنا': 'الوجه القبلي',
    'أسوان': 'الوجه القبلي',
    'الأقصر': 'الوجه القبلي',
    'البحر الأحمر': 'محافظات الحدود',
    'الوادي الجديد': 'محافظات الحدود',
    'مطروح': 'محافظات الحدود',
    'شمال سيناء': 'محافظات الحدود',
    'جنوب سيناء': 'محافظات الحدود',
  };

  const regionsData = useMemo(() => {
    const map = new Map<string, { attendees: number; referrals: number; larc: number; districtsCount: number }>();
    ['الوجه البحري', 'الوجه القبلي', 'محافظات الحضر', 'محافظات الحدود'].forEach(r => {
      map.set(r, { attendees: 0, referrals: 0, larc: 0, districtsCount: 0 });
    });

    activeSubmissions.forEach(sub => {
      const region = GOV_REGION_MAP[sub.governorate_name_ar] || 'محافظات الحضر';
      const current = map.get(region) || { attendees: 0, referrals: 0, larc: 0, districtsCount: 0 };
      
      let subAttendees = 0;
      let subReferrals = 0;
      let subLarc = 0;

      Object.values(sub.sections || {}).forEach(sec => {
        if (sec.section_code === 12) {
          subLarc += (sec.field_1_value || 0) + (sec.field_2_value || 0) + (sec.field_3_value || 0);
        } else {
          subAttendees += sec.field_1_value || 0;
          subReferrals += sec.field_2_value || 0;
          subLarc += sec.field_3_value || 0;
        }
      });

      current.attendees += subAttendees;
      current.referrals += subReferrals;
      current.larc += subLarc;
      current.districtsCount += 1;
      map.set(region, current);
    });

    return Array.from(map.entries()).map(([name, data]) => {
      const taskSharingRate = data.referrals > 0 ? Math.min(100, Math.round((data.larc / data.referrals) * 100)) : 0;
      return {
        name,
        attendees: data.attendees,
        referrals: data.referrals,
        larc: data.larc,
        taskSharingRate,
        doctors: data.districtsCount,
      };
    });
  }, [activeSubmissions]);

  // 2. بيانات لوحة المدير العام (الأصناف وإزالة الوسائل وأطباء الاستعانة) - محسوبة حقيقياً
  const methodItemsData = useMemo(() => {
    let copperIUDCount = 0;
    let hormonalIUDCount = 0;
    let implanonCount = 0;
    let pillsCount = 0;
    let injectionsCount = 0;

    activeSubmissions.forEach(sub => {
      Object.values(sub.sections || {}).forEach(sec => {
        if (sec.section_code === 12) {
          copperIUDCount += sec.field_1_value || 0;
          hormonalIUDCount += sec.field_2_value || 0;
          implanonCount += sec.field_3_value || 0;
        } else if (sec.section_code === 1 || sec.section_code === 2) {
          pillsCount += sec.field_1_value || 0;
          injectionsCount += sec.field_2_value || 0;
        }
      });
    });

    const totalMethods = copperIUDCount + hormonalIUDCount + implanonCount + pillsCount + injectionsCount;

    return [
      { name: 'لولب نحاسي عادي', count: copperIUDCount, share: totalMethods > 0 ? `${Math.round((copperIUDCount / totalMethods) * 100)}%` : '0%' },
      { name: 'لولب هرموني ميرينا', count: hormonalIUDCount, share: totalMethods > 0 ? `${Math.round((hormonalIUDCount / totalMethods) * 100)}%` : '0%' },
      { name: 'كبسولات إمبلانون نكست', count: implanonCount, share: totalMethods > 0 ? `${Math.round((implanonCount / totalMethods) * 100)}%` : '0%' },
      { name: 'حبوب مركبة (ميكروجينون)', count: pillsCount, share: totalMethods > 0 ? `${Math.round((pillsCount / totalMethods) * 100)}%` : '0%' },
      { name: 'حقن أحادية (ديبوبروفيرا)', count: injectionsCount, share: totalMethods > 0 ? `${Math.round((injectionsCount / totalMethods) * 100)}%` : '0%' },
    ];
  }, [activeSubmissions]);

  const removalReasonsData = useMemo(() => {
    let pregnancyWish = 0;
    let expired = 0;
    let sideEffects = 0;
    let familyReasons = 0;

    activeSubmissions.forEach(sub => {
      const sec13 = sub.sections?.[13];
      if (sec13) {
        pregnancyWish += sec13.field_1_value || 0;
        expired += sec13.field_2_value || 0;
        sideEffects += sec13.field_3_value || 0;
      }
    });

    const totalRemovals = pregnancyWish + expired + sideEffects + familyReasons;
    if (totalRemovals === 0) return [];

    return [
      { reason: 'الرغبة في الحمل والإنجاب', count: pregnancyWish, percentage: Math.round((pregnancyWish / totalRemovals) * 100), color: '#10b981' },
      { reason: 'انتهاء الصلاحية الطبية للوسيلة', count: expired, percentage: Math.round((expired / totalRemovals) * 100), color: '#0284c7' },
      { reason: 'نزيف أو أعراض جانبية غير مرغوبة', count: sideEffects, percentage: Math.round((sideEffects / totalRemovals) * 100), color: '#f59e0b' },
      { reason: 'أسباب أسرية ورغبة الزوج', count: familyReasons, percentage: Math.round((familyReasons / totalRemovals) * 100), color: '#8b5cf6' },
    ];
  }, [activeSubmissions]);

  const outsourcedDoctors = useMemo(() => {
    const list: Array<{ id: string; name: string; nationalId: string; gov: string; district: string; procedures: number }> = [];
    activeSubmissions.forEach((sub, idx) => {
      if (sub.sections?.[10]?.notes || sub.returned_by) {
        list.push({
          id: `doc-${sub.id || idx}`,
          name: sub.sections?.[10]?.notes || sub.returned_by || 'طبيب متعاقد معتمد',
          nationalId: '—',
          gov: sub.governorate_name_ar,
          district: sub.district_name_ar,
          procedures: (sub.sections?.[12]?.field_1_value || 0) + (sub.sections?.[12]?.field_2_value || 0),
        });
      }
    });
    return list;
  }, [activeSubmissions]);

  const handleNationalApproval = async () => {
    try {
      await approveNationalReport(user);
      const now = new Date();
      const timeFormatted = new Intl.DateTimeFormat('ar-EG', {
        timeZone: 'Africa/Cairo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(now);

      const record: DailyApprovalRecord = {
        date: todayDateStr,
        approvedAt: timeFormatted,
        approverName: user.full_name,
        approverRole: user.role_title_ar || (user.role === 'super_admin' ? 'مدير النظام' : 'رئيس الإدارة المركزية'),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('masar_national_daily_approval_v1', JSON.stringify(record));
      }
      setDailyApprovalRecord(record);
      onDataChanged();
      setOperationFeedback({
        type: 'success',
        title: 'تم الاعتماد النهائي القومي بنجاح',
        message: `تم اعتماد التقرير القومي النهائي وإقفال اليوم الإحصائي للجمهورية رسمياً بواسطة ${record.approverName}. تم إقفال الاعتماد لليوم.`,
      });
    } catch {
      setOperationFeedback({
        type: 'error',
        title: 'تعذر الاعتماد القومي',
        message: 'لم نتمكن من اعتماد التقرير القومي في الوقت الحالي. أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
      });
    }
  };

  const handleResetApprovalForTesting = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('masar_national_daily_approval_v1');
    }
    setDailyApprovalRecord(null);
    onDataChanged();
  };

  return (
    <div className="space-y-4">
      
      {/* 1. ترويسة الجناح التنفيذي للوزارة */}
      <div className="gov-surface p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">
              الجناح الاستراتيجي لديوان عام الوزارة
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            التحليل القومي والتكتيكي والتخصصي المتعمق لقطاع الرعاية الصحية وتنمية الأسرة
          </p>
        </div>

        {/* عداد الإغلاق القومي حتى 10:00 مساءً */}
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-mono ${
          timeLeft.isPassed 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <Timer className={`w-4 h-4 ${timeLeft.isPassed ? 'text-rose-600' : 'text-emerald-600'}`} />
          <div className="text-right">
            <div className="text-[10px] font-sans font-bold text-slate-600">
              {timeLeft.isPassed ? 'نافذة الاعتماد القومي:' : 'الوقت المتبقي للاعتماد القومي النهائي (10:00 م):'}
            </div>
            <div className="text-xs font-black">
              {timeLeft.isPassed ? (
                <span className="text-rose-700">مغلقة (10:00 م)</span>
              ) : (
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReport}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#087f78]" />
            <span>عرض التقرير القومي الرسمي</span>
          </button>

          {/* زر وحالة الاعتماد النهائي اليومي */}
          {isApprovedToday ? (
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-right">
                <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <span>تم الاعتماد النهائي لليوم</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold font-mono">معتمد نهائياً</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  {dailyApprovalRecord?.approverName} ({dailyApprovalRecord?.approverRole}) — {dailyApprovalRecord?.approvedAt}
                </div>
              </div>
              <span title="مغلق لليوم ولا يقبل إعادة الاعتماد">
                <Lock className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              </span>
              {user.role === 'super_admin' && (
                <button
                  onClick={handleResetApprovalForTesting}
                  title="إعادة ضبط الاعتماد لأغراض الاختبار والتطوير"
                  className="text-[10px] text-slate-400 hover:text-rose-600 underline mr-1 cursor-pointer"
                >
                  إعادة ضبط
                </button>
              )}
            </div>
          ) : canUserApprove ? (
            isWithinApprovalWindow || user.role === 'super_admin' ? (
              <button
                onClick={() => setShowApprovalConfirm(true)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white flex items-center gap-2 transition shadow-md shadow-emerald-700/20 cursor-pointer animate-pulse"
              >
                <CheckCircle className="w-4 h-4" />
                <span>الاعتماد النهائي للتقرير</span>
              </button>
            ) : isBeforeApprovalWindow ? (
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-xs font-bold flex items-center gap-2 cursor-not-allowed">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>نافذة الاعتماد تفتح 06:00 م (قيد استكمال المديريات)</span>
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>انتهت نافذة الاعتماد الرسمية لليوم (10:00 م)</span>
              </div>
            )
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>بانتظار الاعتماد النهائي (رئيس الإدارة المركزية - 18:00)</span>
            </div>
          )}
        </div>
      </div>

      {/* شريط الفلترة والتحكم في استعراض البيانات الحقيقية */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#e6f4f2] text-[#087f78]">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                <span>تصفية البيانات واستعراض السجلات الحقيقية</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                  بيانات فعلية من واقع إدخال المديريات
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                يمكنك التبديل بين كافة البيانات المسجلة، أو تصفية يوم محدد، واختيار المحافظة لتحديث الجرافات والمؤشرات فوراً
              </p>
            </div>
          </div>

          {/* عداد السجلات المطابقة وحالة التحديث */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeSubmissions.length} سجل فعلي معتمد</span>
            </span>

            <button
              onClick={() => loadSubmissionsByFilter(dateFilterMode, customDateValue)}
              disabled={isFilterLoading}
              title="تحديث البيانات من السيرفر"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFilterLoading ? 'animate-spin text-[#087f78]' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
          {/* أزرار الفلترة السريعة بالتاريخ */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => loadSubmissionsByFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                dateFilterMode === 'all'
                  ? 'bg-[#087f78] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              كافة البيانات المسجلة
            </button>

            <button
              onClick={() => loadSubmissionsByFilter('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                dateFilterMode === 'today'
                  ? 'bg-[#087f78] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              اليوم ({todayDateStr})
            </button>

            <button
              onClick={() => loadSubmissionsByFilter('yesterday')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                dateFilterMode === 'yesterday'
                  ? 'bg-[#087f78] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الأمس ({yesterdayDateStr})
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* اختيار تاريخ مخصص */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={customDateValue}
              onChange={(e) => {
                setCustomDateValue(e.target.value);
                setDateFilterMode('custom');
              }}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 font-mono focus:ring-1 focus:ring-[#087f78] focus:border-[#087f78]"
            />
          </div>

          {/* اختيار المحافظة */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGovFilter}
              onChange={(e) => setSelectedGovFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-1 focus:ring-[#087f78] focus:border-[#087f78]"
            >
              <option value="all">جميع المحافظات (الـ 27 محافظة)</option>
              {currentGovernoratesList.map((g) => (
                <option key={g.code} value={g.name_ar}>
                  {g.name_ar}
                </option>
              ))}
            </select>
          </div>

          {/* زر تطبيق الفلتر الصريح */}
          <button
            onClick={() => loadSubmissionsByFilter(dateFilterMode, customDateValue)}
            disabled={isFilterLoading}
            className="px-4 py-1.5 rounded-xl text-xs font-black bg-[#087f78] hover:bg-[#066963] text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50 mr-auto"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isFilterLoading ? 'جاري التحميل...' : 'تطبيق الفلتر'}</span>
          </button>
        </div>
      </div>

      {/* 2. تبويبات المستويات القيادية الـ 3 المحددة بالوثيقة الرسمية */}
      <div className="bg-[#f2f5f8] border border-[#e1e7ed] p-1.5 rounded-2xl flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setSuiteTab('macro')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
            suiteTab === 'macro' 
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-[#087f78]" />
          <span>رئيس القطاع ومعالي الوزير (المؤشرات الكلية)</span>
        </button>

        <button
          onClick={() => setSuiteTab('tactical')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
            suiteTab === 'tactical' 
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>رئيس الإدارة المركزية (الأقاليم والقوى البشرية)</span>
        </button>

        <button
          onClick={() => setSuiteTab('deep_dive')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
            suiteTab === 'deep_dive' 
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-indigo-600" />
          <span>مدير عام تنظيم الأسرة (الأصناف وأطباء الاستعانة)</span>
        </button>
      </div>

      {/* 3. محتوى التبويب المختار */}

      {/* أ. لوحة رئيس القطاع ومعالي الوزير (Macro Strategy) */}
      {suiteTab === 'macro' && (
        <div className="space-y-6">

          {/* 1. الكروت القيادية الكبرى: النتيجة النهائية لليوم ومقارنة اليوم السابق */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* الكارت الكبير الرئيسي: النتيجة النهائية للموقف القومي لليوم */}
            <div className="lg:col-span-8 bg-gradient-to-br from-white via-[#f8fafc] to-[#f0fdf4] p-6 rounded-2xl border-2 border-emerald-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <Award className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        النتيجة النهائية للموقف القومي لليوم الإحصائي
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        الحصيلة الشاملة المعتمدة لتسجيل الإدارات الصحية بمحافظات الجمهورية (تاريخ اليوم: {todayDateStr})
                      </p>
                    </div>
                  </div>

                  {isApprovedToday ? (
                    <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>معتمد نهائياً لليوم</span>
                    </span>
                  ) : (
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>بانتظار الاعتماد النهائي (18:00 - 22:00)</span>
                    </span>
                  )}
                </div>

                {/* الرقم القياسي الكبير ونسبة التغطية */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-3 items-center">
                  <div className="sm:col-span-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-800">
                        {totalRepublicRegisteredToday}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold font-mono text-slate-400">
                        / {totalRepublicDistricts}
                      </span>
                      <span className="text-xs font-bold text-slate-600">إدارة صحية مسجلة بالجمهورية</span>
                    </div>

                    {/* شريط الإنجاز القومي المتدرج */}
                    <div className="w-full bg-slate-200 h-3 rounded-full mt-3 overflow-hidden p-0.5 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-[#087f78] to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${nationalTodayPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-200 text-center shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-500 mb-0.5">نسبة الإنجاز القومي</div>
                    <div className="text-3xl font-black font-mono text-emerald-700">{nationalTodayPercentage}%</div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-0.5">من إجمالي مستهدف الجمهورية</div>
                  </div>
                </div>
              </div>

              {/* بطاقات الإحصاء السريع لحالة اليوم */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-2 border-t border-slate-200/80 text-xs">
                <div className="p-2 rounded-lg bg-white/70 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">محافظات اكتملت (100%):</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {governorateChartData.filter(g => g.isComplete).length} من 27 محافظة
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/70 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">محافظات قيد الاستكمال:</span>
                  <span className="font-mono font-black text-amber-700 text-sm">
                    {governorateChartData.filter(g => !g.isComplete).length} محافظة
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/70 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">المترددات بالجمهورية:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {totalAttendees.toLocaleString('ar-EG')}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/70 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">الوسائل طويلة المفعول:</span>
                  <span className="font-mono font-black text-indigo-700 text-sm">
                    {totalLarcAll.toLocaleString('ar-EG')}
                  </span>
                </div>
              </div>
            </div>

            {/* كارت المقارنة: اليوم السابق (الأمس) */}
            <div className="lg:col-span-4 bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">موقف اليوم السابق (الأمس)</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    مؤرشف ومعتمد
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  الحصيلة الإحصائية الرسمية المقفلة لليوم السابق للمقارنة التتبعية
                </p>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-3">
                  <div className="text-xs text-slate-500 font-semibold mb-1">عدد الإدارات المسجلة بالأمس</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-slate-800">
                      {yesterdayRegisteredCount}
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-400">
                      / {totalRepublicDistricts}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700 mr-auto">
                      ({yesterdayPercentage}%)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>معدل التغير عن الأمس (مؤشر النمو)</span>
                  </div>
                  <div className="text-sm font-black font-mono text-emerald-900">
                    {dailyChangeDistricts >= 0 ? `+${dailyChangeDistricts}` : dailyChangeDistricts} إدارة ({dailyChangePercentage >= '0' ? `+${dailyChangePercentage}%` : `${dailyChangePercentage}%`})
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
                <span>حالة إقفال اليوم السابق:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  مغلق ومؤرشف بنجاح
                </span>
              </div>
            </div>

          </div>

          {/* 2. جراف المحافظات الـ 27 القومي: عدد الإدارات المسجلة من إجمالي إدارات كل محافظة */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#087f78]" />
                  <h3 className="text-base font-bold text-slate-900">
                    موقف تسجيل الإدارات الصحية بمحافظات الجمهورية (27 محافظة)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  رصد عدد الإدارات المسجلة للبيانات مقارنة بإجمالي الإدارات التابعة لكل محافظة على حدة لليوم الإحصائي
                </p>
              </div>

              {/* أزرار تصفية الجراف */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setGovChartFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    govChartFilter === 'all'
                      ? 'bg-[#087f78] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل (27 محافظة)
                </button>
                <button
                  onClick={() => setGovChartFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    govChartFilter === 'completed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  المكتملة 100% ({governorateChartData.filter(g => g.isComplete).length})
                </button>
                <button
                  onClick={() => setGovChartFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    govChartFilter === 'in_progress'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  قيد الاستكمال ({governorateChartData.filter(g => !g.isComplete).length})
                </button>
              </div>
            </div>

            {/* رسم بياني بالأعمدة للمحافظات الـ 27 */}
            <div className="h-[460px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    govChartFilter === 'completed'
                      ? governorateChartData.filter(g => g.isComplete)
                      : govChartFilter === 'in_progress'
                        ? governorateChartData.filter(g => !g.isComplete)
                        : governorateChartData
                  }
                  margin={{ top: 28, right: 20, left: 10, bottom: 110 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    height={110}
                    tick={({ x, y, payload }) => {
                      const label: string = payload.value as string;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dx={-3}
                            dy={12}
                            textAnchor="end"
                            fill="#1e293b"
                            fontSize={10.5}
                            fontWeight={700}
                            transform="rotate(-45)"
                            style={{ fontFamily: 'inherit' }}
                          >
                            {label}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[220px] text-right">
                            <div className="font-bold text-amber-300 pb-1 border-b border-slate-800">
                              محافظة {data.fullName || data.name}
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>الإدارات المسجلة لليوم:</span>
                              <span className="font-mono font-black text-emerald-400 text-sm">
                                {data.registeredDistricts} إدارة
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>إجمالي إدارات المحافظة:</span>
                              <span className="font-mono font-bold text-slate-200">
                                {data.totalDistricts} إدارة
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>نسبة التغطية:</span>
                              <span className="font-mono font-black text-amber-400">
                                {data.percentage}%
                              </span>
                            </div>
                            <div className="pt-1 border-t border-slate-800 text-[10px]">
                              {data.isComplete ? (
                                <span className="text-emerald-400 font-bold">✓ كافة إدارات المحافظة استكملت التسجيل</span>
                              ) : (
                                <span className="text-amber-400 font-bold">متبقي {data.remainingDistricts} إدارة قيد الاستيفاء</span>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="left"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                  />
                  <Bar
                    dataKey="registeredDistricts"
                    name="عدد الإدارات المسجلة للبيانات"
                    fill="#087f78"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  >
                    <LabelList
                      dataKey="registeredDistricts"
                      position="top"
                      formatter={(val: any) => (val > 0 ? val : '')}
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#087f78' }}
                    />
                  </Bar>
                  <Bar
                    dataKey="totalDistricts"
                    name="إجمالي الإدارات التابعة للمحافظة"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. بطاقات المؤشرات الاستراتيجية التكميلية */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">المؤشر القومي لتنمية وحماية الأسرة</div>
              <div className="text-3xl font-black font-mono text-emerald-700">68.4%</div>
              <div className="text-[11px] text-emerald-600 mt-1 font-medium">↑ تحسن بمقدار +2.3% عن العام السابق</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">المترددات بالجمهورية لليوم</div>
              <div className="text-3xl font-black font-mono text-slate-900">{totalAttendees.toLocaleString('ar-EG')}</div>
              <div className="text-[11px] text-slate-400 mt-1">عبر {totalRepublicRegisteredToday} إدارة صحية بـ 27 محافظة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">الوسائل طويلة المفعول لليوم</div>
              <div className="text-3xl font-black font-mono text-indigo-700">{totalLarcAll.toLocaleString('ar-EG')}</div>
              <div className="text-[11px] text-indigo-600 mt-1 font-bold">الحصيلة الفعلية المنصرفة للمنتفعات</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">جاهزية الاعتماد القومي</div>
              <div className="text-3xl font-black font-mono text-[#087f78]">{nationalTodayPercentage}%</div>
              <div className="text-[11px] text-[#087f78] mt-1 font-medium">{totalRepublicRegisteredToday} من {totalRepublicDistricts} إدارة معتمدة</div>
            </div>
          </div>
        </div>
      )}

      {/* ب. لوحة رئيس الإدارة المركزية (الأقاليم والقوى البشرية) */}
      {suiteTab === 'tactical' && (
        <div className="space-y-4">
          {/* مقارنة أقاليم الجمهورية الأربعة */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                مقارنة أقاليم الجمهورية (التردد والوسائل طويلة المفعول)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                توزيع الكثافة الخدمية بين الوجه البحري، القبلي، الحضر، والحدود
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionsData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(val: any) => [`${Number(val).toLocaleString('ar-EG')} حالة`, 'العدد']}
                      contentStyle={{ direction: 'rtl', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="attendees" name="المترددات" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="larc" name="الوسائل طويلة المفعول" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                عدالة توزيع القوى البشرية ومشاركة المهام
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                نسبة مشاركة هيئة التمريض المدرب في تركيب الوسائل مقارنة بالأطباء
              </p>

              <div className="space-y-4 pt-2">
                {regionsData.map((reg, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#087f78]" />
                        <span>{reg.name}</span>
                      </span>
                      <span className="font-mono text-indigo-700 font-bold">
                        مشاركة المهام: {reg.taskSharingRate}% | أطباء تنظيم الأسرة: {reg.doctors}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${reg.taskSharingRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ج. لوحة المدير العام (الأصناف وأطباء الاستعانة) */}
      {suiteTab === 'deep_dive' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* تفاصيل أصناف الوسائل المنصرفة */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                تحليل تفصيلي لأصناف الوسائل المنصرفة
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                الحصيلة القومية الدقيقة لكل صنف معتمد
              </p>

              <div className="space-y-3">
                {methodItemsData.map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{item.count.toLocaleString('en-US')}</span>
                      <span className="px-2 py-0.5 rounded bg-[#dff4f1] text-[#066963] font-mono font-bold text-[10px]">{item.share}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* أسباب إزالة اللوالب والكبسولات */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  أسباب إزالة اللوالب والكبسولات
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  تحليل الأسباب السريرية والشخصية للإزالة المبكرة
                </p>
              </div>

              {removalReasonsData.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                  <span>لا توجد حالات إزالة مسجلة في البيانات الحالية</span>
                </div>
              ) : (
                <>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={removalReasonsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="percentage"
                        >
                          {removalReasonsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(val: any) => [`${val}%`, 'النسبة']}
                          contentStyle={{ direction: 'rtl', borderRadius: '8px', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    {removalReasonsData.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                          <span className="text-slate-600 text-[11px]">{r.reason}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{r.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* إنتاجية أطباء الاستعانة بالاسم والرقم القومي */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                بيان إنتاجية أطباء الاستعانة
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                كشف الأطباء التخصصيين المتعاقدين بالاسم والرقم القومي
              </p>

              {outsourcedDoctors.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center text-xs text-slate-400">
                  <UserCheck className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                  <span>لا توجد بيانات مسجلة لأطباء الاستعانة في البيانات الحالية</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {outsourcedDoctors.map((doc) => (
                    <div key={doc.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{doc.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                          {doc.procedures} حالة
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        رقم قومي: {doc.nationalId} | {doc.gov} ({doc.district})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <SubmissionMonitoringTable
        submissions={activeSubmissions}
        title="المتابعة التشغيلية لجهات الإدخال"
        description="عرض موحد لجميع الإدارات الصحية على مستوى الجمهورية؛ التصفح والتفاصيل من البيانات المحمّلة دون طلبات إضافية."
      />

      <ConfirmationDialog
        open={showApprovalConfirm}
        title="تأكيد الاعتماد النهائي القومي"
        message="تنبيه رسمي: سيتم الاعتماد النهائي وإقفال اليوم الإحصائي نهائياً لكافة محافظات الجمهورية وتسجيل هذا الإجراء رسمياً باسمك. لن يعمل زر الاعتماد مرة أخرى لليوم وسيتم قفل النافذة حتى موعد الغد. هل تريد الاستمرار؟"
        confirmLabel="تأكيد الاعتماد النهائي"
        tone="success"
        onConfirm={async () => {
          setShowApprovalConfirm(false);
          await handleNationalApproval();
        }}
        onCancel={() => setShowApprovalConfirm(false)}
      />

      <OperationFeedbackDialog
        open={Boolean(operationFeedback)}
        type={operationFeedback?.type || 'error'}
        title={operationFeedback?.title || 'تعذر إتمام العملية'}
        message={operationFeedback?.message || 'حدث خطأ غير متوقع.'}
        onClose={() => setOperationFeedback(null)}
        onRetry={() => setOperationFeedback(null)}
      />

    </div>
  );
};
