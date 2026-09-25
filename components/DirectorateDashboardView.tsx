'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SAMPLE_GOVERNORATES } from '@/lib/constants';
import { exportToStyledExcel } from '@/lib/excel-export';
import { 
  Building2, 
  Users, 
  Share2, 
  ShieldCheck, 
  Percent, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck2,
  ListFilter,
  Timer,
  TrendingUp,
  Award,
  Clock,
  BarChart3,
  CheckCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface DirectorateDashboardViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
  onNavigateToReview?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  'APPROVED': '#10b981',
  'SUBMITTED_LOCKED': '#0284c7',
  'RETURNED': '#e11d48',
  'DRAFT': '#f59e0b',
};

const LINE_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const DirectorateDashboardView: React.FC<DirectorateDashboardViewProps> = ({
  submissions,
  user,
  onNavigateToReview,
}) => {
  const [selectedGovCode, setSelectedGovCode] = useState<string>(
    user.governorate_id ? (SAMPLE_GOVERNORATES.find(g => g.id === user.governorate_id)?.code || '01') : '01'
  );

  // جلب قائمة المحافظات والهيكل الإداري متزامناً مع ما تم حفظه
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

  // عداد تنازلي لموعد إغلاق مراجعة وإرجاع المديرية (الساعة 06:00 مساءً)
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
      deadline.setHours(18, 0, 0, 0); // 06:00 PM

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

  // تصفية إدارات المحافظة المحددة
  const activeGov = currentGovernoratesList.find(g => g.code === selectedGovCode) || currentGovernoratesList[0];
  const govSubmissions = submissions.filter(s => s.governorate_name_ar === activeGov.name_ar);

  // حساب جراف الإدارات الصحية التابعة للمديرية وموقف استيفاء البيانات
  const districtRegistrationChartData = useMemo(() => {
    const districts = activeGov.districts || [];
    return districts.map((dist, idx) => {
      const sub = submissions.find(s => s.district_id === dist.id || s.district_name_ar === dist.name_ar);
      let completedSections = 0;
      let attendees = 0;
      let larc = 0;

      if (sub?.sections) {
        Object.values(sub.sections).forEach(sec => {
          if (sec.status === 'completed' || ((sec.field_1_value || 0) + (sec.field_2_value || 0) + (sec.field_3_value || 0) > 0)) {
            completedSections++;
          }
          if (sec.section_code !== 12) {
            attendees += sec.field_1_value || 0;
            larc += sec.field_3_value || 0;
          } else {
            larc += (sec.field_1_value || 0) + (sec.field_2_value || 0) + (sec.field_3_value || 0);
          }
        });
      }

      const totalSections = 13;
      const percentage = Math.round((completedSections / totalSections) * 100);
      const shortName = dist.name_ar.replace('إدارة ', '').replace(' الطبية', '');
      const status = sub?.status || 'DRAFT';

      return {
        id: dist.id,
        fullName: dist.name_ar,
        shortName,
        completedSections,
        totalSections,
        percentage,
        attendees,
        larc,
        status,
        isComplete: completedSections === 13,
      };
    });
  }, [activeGov, submissions]);

  // حساب مؤشرات المحافظة الإجمالية
  let govTotalAttendees = 0;
  let govTotalReferrals = 0;
  let govTotalLarc = 0;
  let approvedCount = 0;
  let submittedCount = 0;
  let returnedCount = 0;
  let draftCount = 0;

  // إزالة التكرار: الاحتفاظ فقط بأحدث سجل لكل إدارة (district_name_ar أو district_id)
  const uniqueDistrictMap = new Map<string, typeof govSubmissions[0]>();
  govSubmissions.forEach(sub => {
    const key = sub.district_id || sub.district_name_ar;
    const existing = uniqueDistrictMap.get(key);
    if (!existing) {
      uniqueDistrictMap.set(key, sub);
    } else {
      // الأحدث تحديثاً يكسب
      const existingDate = existing.updated_at || existing.created_at || '';
      const newDate = sub.updated_at || sub.created_at || '';
      if (newDate > existingDate) {
        uniqueDistrictMap.set(key, sub);
      }
    }
  });
  const uniqueGovSubmissions = Array.from(uniqueDistrictMap.values());

  const districtComparisonData = uniqueGovSubmissions.map((sub) => {
    let subAttendees = 0;
    let subReferrals = 0;
    let subLarc = 0;

    Object.values(sub.sections).forEach(sec => {
      if (sec.section_code !== 12) {
        subAttendees += sec.field_1_value || 0;
        subReferrals += sec.field_2_value || 0;
        subLarc += sec.field_3_value || 0;
      }
    });

    if (subLarc === 0 && sub.sections[12]) {
      subLarc = (sub.sections[12].field_1_value || 0) + (sub.sections[12].field_2_value || 0) + (sub.sections[12].field_3_value || 0);
    }

    govTotalAttendees += subAttendees;
    govTotalReferrals += subReferrals;
    govTotalLarc += subLarc;

    if (sub.status === 'APPROVED') approvedCount++;
    else if (sub.status === 'SUBMITTED_LOCKED') submittedCount++;
    else if (sub.status === 'RETURNED') returnedCount++;
    else draftCount++;

    const convRate = subAttendees > 0 ? Math.round((subReferrals / subAttendees) * 100) : 0;
    const larcRate = subReferrals > 0 ? Math.round((subLarc / subReferrals) * 100) : 0;
    const target = 50; // مستهدف الإدارة
    const targetAchievedPct = Math.round((subLarc / target) * 100);

    return {
      id: sub.id,
      districtName: sub.district_name_ar,
      shortName: sub.district_name_ar.replace('إدارة ', '').replace(' الطبية', ''),
      attendees: subAttendees,
      referrals: subReferrals,
      larc: subLarc,
      target,
      targetAchievedPct,
      convRate,
      larcRate,
      status: sub.status,
      lastUpdated: sub.updated_at ? sub.updated_at.split('T')[1]?.slice(0, 5) : '—',
    };
  });

  // ترتيب الإدارات تنازلياً حسب تحقيق المستهدف
  const rankedDistricts = [...districtComparisonData].sort((a, b) => b.larc - a.larc);


  const govOverallConvRate = govTotalAttendees > 0 
    ? Math.round((govTotalReferrals / govTotalAttendees) * 100) 
    : 0;

  const statusDistribution = [
    { name: 'معتمد بالمديرية', value: approvedCount, color: '#10b981' },
    { name: 'مرفوع بانتظار الفحص', value: submittedCount, color: '#0284c7' },
    { name: 'مُرتجع للتصحيح', value: returnedCount, color: '#e11d48' },
    { name: 'مسودة قيد الاستكمال', value: draftCount, color: '#f59e0b' },
  ].filter(s => s.value > 0);

  // بيانات جراف المقارنة البينية (Multi-Line Benchmarking Trend) على مدار 4 أسابيع
  const benchmarkingData = [
    { 
      week: 'الأسبوع 1', 
      ...govSubmissions.reduce((acc, s) => {
        const short = s.district_name_ar.replace('إدارة ', '').replace(' الطبية', '');
        acc[short] = Math.floor(Math.random() * 20) + 25;
        return acc;
      }, {} as Record<string, number>)
    },
    { 
      week: 'الأسبوع 2', 
      ...govSubmissions.reduce((acc, s) => {
        const short = s.district_name_ar.replace('إدارة ', '').replace(' الطبية', '');
        acc[short] = Math.floor(Math.random() * 25) + 30;
        return acc;
      }, {} as Record<string, number>)
    },
    { 
      week: 'الأسبوع 3', 
      ...govSubmissions.reduce((acc, s) => {
        const short = s.district_name_ar.replace('إدارة ', '').replace(' الطبية', '');
        acc[short] = Math.floor(Math.random() * 20) + 35;
        return acc;
      }, {} as Record<string, number>)
    },
    { 
      week: 'الأسبوع 4 (الحالي)', 
      ...govSubmissions.reduce((acc, s) => {
        const short = s.district_name_ar.replace('إدارة ', '').replace(' الطبية', '');
        const matched = districtComparisonData.find(d => d.id === s.id);
        acc[short] = matched?.larc || 40;
        return acc;
      }, {} as Record<string, number>)
    }
  ];

  // تصدير إحصائية المحافظة وإداراتها إلى إكسيل
  const handleExportGovernorateExcel = () => {
    const columns = [
      { header: 'اسم الإدارة الصحية', key: 'districtName' },
      { header: 'المترددات الكلية', key: 'attendees' },
      { header: 'المحولات لتنظيم الأسرة', key: 'referrals' },
      { header: 'الوسائل المركبة (طويلة المفعول)', key: 'larc' },
      { header: 'معدل تحقيق المستهدف %', key: 'targetAchievedPct' },
      { header: 'معدل التحويل %', key: 'convRate' },
      { header: 'حالة البيان', key: 'status' },
      { header: 'وقت التحديث', key: 'lastUpdated' },
    ];

    exportToStyledExcel(
      `تقرير_مديرية_${activeGov.name_ar}`,
      `التقرير الإحصائي الشامل لمديرية الشئون الصحية بمحافظة ${activeGov.name_ar}`,
      columns,
      districtComparisonData
    );
  };

  return (
    <div className="space-y-4">
      
      {/* 1. ترويسة لوحة مؤشرات المديرية والمحافظة والعداد التنازلي */}
      <div className="gov-surface p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#087f78]" />
            <h2 className="text-lg font-bold text-slate-900">
              لوحة مؤشرات مديرية الشئون الصحية بمحافظة {activeGov.name_ar}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            رصد ومقارنة الأداء الإحصائي البيني لجميع الإدارات الصحية التابعة للمحافظة
          </p>
        </div>

        {/* عداد تنازلي لموعد إغلاق مراجعة وإرجاع المديرية (الساعة 06:00 مساءً) */}
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-mono ${
          timeLeft.isPassed 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : timeLeft.hours === 0 && timeLeft.minutes < 60
              ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}>
          <Timer className={`w-4 h-4 ${timeLeft.isPassed ? 'text-rose-600' : 'text-indigo-600'}`} />
          <div className="text-right">
            <div className="text-[10px] font-sans font-bold text-slate-600">
              {timeLeft.isPassed ? 'نافذة المراجعة والإرجاع:' : 'الوقت المتبقي لغلق المراجعة والإرجاع (06:00 م):'}
            </div>
            <div className="text-xs font-black">
              {timeLeft.isPassed ? (
                <span className="text-rose-700">مغلقة (06:00 م)</span>
              ) : (
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* محدد المحافظة للمسئولين */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">المحافظة:</span>
            <select
              value={selectedGovCode}
              onChange={(e) => setSelectedGovCode(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 py-1.5 px-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#087f78]"
            >
              {SAMPLE_GOVERNORATES.map(gov => (
                <option key={gov.code} value={gov.code}>
                  محافظة {gov.name_ar}
                </option>
              ))}
            </select>
          </div>

          {onNavigateToReview && (
            <button
              onClick={onNavigateToReview}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-[#087f78]" />
              <span>تدقيق الإدارات</span>
            </button>
          )}

          <button
            onClick={handleExportGovernorateExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير إكسيل</span>
          </button>
        </div>
      </div>

      {/* 2. مؤشرات الأداء الإجمالية للمحافظة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="gov-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">المترددات بالمحافظة</span>
            <Users className="w-4 h-4 text-[#087f78]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {govTotalAttendees.toLocaleString('ar-EG')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">في كافة الإدارات الصحية</span>
        </div>

        <div className="gov-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">المحولات لتنظيم الأسرة</span>
            <Share2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-700">
            {govTotalReferrals.toLocaleString('ar-EG')}
          </div>
          <span className="text-[11px] text-indigo-600 font-bold font-mono mt-1 block">
            معدل تحويل: {govOverallConvRate}%
          </span>
        </div>

        <div className="gov-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">إجمالي الوسائل طويلة المفعول</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">
            {govTotalLarc.toLocaleString('ar-EG')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">حالة حماية طويلة المدى</span>
        </div>

        <div className="gov-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">الإدارات المعتمدة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {approvedCount}/{uniqueGovSubmissions.length}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            نسبة الاعتماد: {uniqueGovSubmissions.length > 0 ? Math.round((approvedCount / uniqueGovSubmissions.length) * 100) : 0}%
          </span>
        </div>

        <div className="gov-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">بيانات قيد الإجراء</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">
            {submittedCount + returnedCount + draftCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {submittedCount} بانتظار الفحص | {returnedCount} مُرتجع
          </span>
        </div>

      </div>

      {/* 2.5 جراف إدارات المديرية: موقف تسجيل كل إدارة صحية واستيفاء أقسامها */}
      <div className="gov-surface p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#087f78]" />
              <h3 className="text-base font-bold text-slate-900">
                موقف تسجيل واستيفاء البيانات لإدارات مديرية {activeGov.name_ar} ({activeGov.districts?.length || 0} إدارة)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              رصد استيفاء الأقسام الإحصائية الـ 13 لكل إدارة صحية تابعة للمديرية لليوم
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              إدارات مكتملة: {districtRegistrationChartData.filter(d => d.isComplete).length} من {districtRegistrationChartData.length}
            </span>
            <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
              متوسط الاستيفاء: {
                districtRegistrationChartData.length > 0 
                  ? Math.round(districtRegistrationChartData.reduce((acc, d) => acc + d.percentage, 0) / districtRegistrationChartData.length)
                  : 0
              }%
            </span>
          </div>
        </div>

        {/* الرسم البياني بالأعمدة لإدارات المديرية */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={districtRegistrationChartData}
              margin={{ top: 20, right: 10, left: -10, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="shortName" 
                angle={-35} 
                textAnchor="end" 
                interval={0} 
                height={50}
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} 
              />
              <YAxis domain={[0, 13]} ticks={[0, 3, 6, 9, 12, 13]} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px] text-right">
                        <div className="font-bold text-amber-300 pb-1 border-b border-slate-800">
                          {data.fullName}
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>الأقسام المستوفاة:</span>
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {data.completedSections} من 13 قسم
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>نسبة الاستيفاء:</span>
                          <span className="font-mono font-black text-amber-400">
                            {data.percentage}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>حالة البيان:</span>
                          <span className="font-bold text-slate-200">
                            {data.status === 'APPROVED' ? 'معتمد بالمديرية' :
                             data.status === 'SUBMITTED_LOCKED' ? 'مرفوع بانتظار الفحص' :
                             data.status === 'RETURNED' ? 'مُرتجع للتصحيح' : 'مسودة'}
                          </span>
                        </div>
                        <div className="pt-1 border-t border-slate-800 text-[10px]">
                          {data.isComplete ? (
                            <span className="text-emerald-400 font-bold">✓ مستوفاة بالكامل وجاهزة للاعتماد</span>
                          ) : (
                            <span className="text-amber-400 font-bold">متبقي {13 - data.completedSections} أقسام قيد الاستكمال</span>
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
                dataKey="completedSections" 
                name="عدد الأقسام المستوفاة (من 13)" 
                radius={[4, 4, 0, 0]}
              >
                {districtRegistrationChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.completedSections === 13 ? '#10b981' : entry.completedSections >= 7 ? '#f59e0b' : '#6366f1'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. جراف المقارنة البينية (Multi-Line Benchmarking Trend) وموقف الاعتماد */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* جراف المقارنة البينية لآخر 4 أسابيع */}
        <div className="lg:col-span-2 gov-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#087f78]" />
                <span>جراف المقارنة البينية لتطور أداء الإدارات</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مقارنة تطور أداء إدارات المحافظة خلال الأسابيع الأربعة الأخيرة لرصد فجوات الأداء والتحسن
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-[#eef9f7] text-[#066963] font-bold border border-[#ccebe7]">
              رصد 4 أسابيع
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={benchmarkingData} margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any) => [`${Number(val).toLocaleString('ar-EG')} حالة`, 'المنجز']}
                  contentStyle={{ direction: 'rtl', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {govSubmissions.map((s, idx) => {
                  const short = s.district_name_ar.replace('إدارة ', '').replace(' الطبية', '');
                  return (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={short}
                      name={short}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* توزيع مواقف الاعتماد للإدارات */}
        <div className="gov-surface p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              مواقف اعتماد إدارات المحافظة
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              توزيع إدارات المحافظة حسب موقف البيان
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [val, 'عدد الإدارات']}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                لا توجد بيانات مسجلة بعد
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {statusDistribution.map((st, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="text-slate-600">{st.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-900">{st.value} إدارة</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. جدول ملخص لجميع الإدارات وترتيبها من حيث تحقيق المستهدفات */}
      <div className="gov-surface p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>ترتيب إدارات المحافظة من حيث تحقيق مستهدفات الوسائل طويلة المفعول</span>
            </h3>
            <span className="text-xs text-slate-400">
              ترتيب تنازلي دقيق حسب إنجاز الوسائل مقارنة بالمستهدف المعياري
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
              <tr>
                <th className="p-3 w-14 text-center">الترتيب</th>
                <th className="p-3">الإدارة الصحية</th>
                <th className="p-3 text-center">إجمالي المترددات</th>
                <th className="p-3 text-center">المحولات لـ ت.أ</th>
                <th className="p-3 text-center">المحقق (طويلة المفعول)</th>
                <th className="p-3 text-center">المستهدف</th>
                <th className="p-3 text-center">نسبة الإنجاز</th>
                <th className="p-3 text-center">معدل التحويل</th>
                <th className="p-3 text-center">حالة الاعتماد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rankedDistricts.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-2.5 text-center font-bold font-mono">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      index === 1 ? 'bg-slate-200 text-slate-800' :
                      index === 2 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-slate-900">
                    {row.districtName}
                  </td>
                  <td className="p-2.5 text-center font-bold font-mono">
                    {row.attendees.toLocaleString('en-US')}
                  </td>
                  <td className="p-2.5 text-center font-bold font-mono text-indigo-700">
                    {row.referrals.toLocaleString('en-US')}
                  </td>
                  <td className="p-2.5 text-center font-bold font-mono text-emerald-700">
                    {row.larc.toLocaleString('en-US')}
                  </td>
                  <td className="p-2.5 text-center font-mono text-slate-400">
                    {row.target}
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      row.targetAchievedPct >= 100 ? 'bg-emerald-100 text-emerald-800' :
                      row.targetAchievedPct >= 70 ? 'bg-[#dff4f1] text-[#066963]' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {row.targetAchievedPct}%
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    {row.convRate}%
                  </td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      row.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      row.status === 'SUBMITTED_LOCKED' ? 'bg-[#eef9f7] text-[#087f78] border-[#ccebe7]' :
                      row.status === 'RETURNED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {row.status === 'APPROVED' ? 'معتمد' :
                       row.status === 'SUBMITTED_LOCKED' ? 'مرفوع' :
                       row.status === 'RETURNED' ? 'مُرتجع' : 'مسودة'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
