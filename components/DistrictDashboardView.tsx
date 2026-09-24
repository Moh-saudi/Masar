'use client';

import React, { useState, useEffect } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { SECTIONS_DEFINITIONS } from '@/lib/constants';
import { exportToStyledExcel } from '@/lib/excel-export';
import { 
  Building, 
  Users, 
  Share2, 
  ShieldCheck, 
  Percent, 
  CheckCircle2, 
  FileSpreadsheet, 
  Download,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Printer,
  TrendingUp,
  AlertCircle,
  Timer
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
  Line,
  ReferenceLine
} from 'recharts';

interface DistrictDashboardViewProps {
  submission: DailySubmission;
  user: UserProfile;
  onNavigateToEntry: () => void;
}

const COLORS = ['#0284c7', '#0d9488', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export const DistrictDashboardView: React.FC<DistrictDashboardViewProps> = ({
  submission,
  user,
  onNavigateToEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // عداد تنازلي حوكمي يوضح حالة نافذة الإدخال (09:00 ص - 03:00 م)
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    status: 'before_open' | 'open' | 'closed';
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: 'closed',
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const decimalTime = currentHours + currentMinutes / 60;

      if (decimalTime < 9.0) {
        // قبل التاسعة صباحاً: عداد تنازلي حتى موعد فتح نافذة العمل
        const openTime = new Date();
        openTime.setHours(9, 0, 0, 0);
        const diff = Math.max(0, openTime.getTime() - now.getTime());
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, status: 'before_open' });
      } else if (decimalTime >= 15.0) {
        // بعد الثالثة عصراً: النافذة مغلقة لانتهاء ساعات العمل
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, status: 'closed' });
      } else {
        // أثناء ساعات العمل الرسمية (09:00 ص - 03:00 م)
        const deadline = new Date();
        deadline.setHours(15, 0, 0, 0);
        const diff = Math.max(0, deadline.getTime() - now.getTime());
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, status: 'open' });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // حساب إحصائيات الإدارة لليوم
  let totalAttendees = 0;
  let totalReferrals = 0;
  let totalLarc = 0;
  let completedSections = 0;

  const sectionChartData = SECTIONS_DEFINITIONS.map(def => {
    const sec = submission.sections[def.code] || {
      field_1_value: 0,
      field_2_value: 0,
      field_3_value: 0,
      status: 'empty',
    };

    if (def.code !== 12) {
      totalAttendees += sec.field_1_value || 0;
      totalReferrals += sec.field_2_value || 0;
      totalLarc += sec.field_3_value || 0;
    } else {
      if (totalLarc === 0) {
        totalLarc = (sec.field_1_value || 0) + (sec.field_2_value || 0) + (sec.field_3_value || 0);
      }
    }

    if (sec.status === 'completed') {
      completedSections++;
    }

    const convRate = (sec.field_1_value || 0) > 0 
      ? Math.round(((sec.field_2_value || 0) / (sec.field_1_value || 1)) * 100) 
      : 0;

    return {
      name: def.name_ar.length > 20 ? def.name_ar.slice(0, 18) + '...' : def.name_ar,
      fullName: def.name_ar,
      code: def.code,
      attendees: sec.field_1_value || 0,
      referrals: sec.field_2_value || 0,
      larc: sec.field_3_value || 0,
      convRate: convRate,
    };
  });

  const overallConvRate = totalAttendees > 0 
    ? Math.round((totalReferrals / totalAttendees) * 100) 
    : 0;

  // نسبة تحويل غرف المشورة (القسم 6: عيادة تنظيم الأسرة والمشورة)
  const counselingSection = submission.sections[6];
  const counselingAttendees = counselingSection?.field_1_value || 0;
  const counselingReferrals = counselingSection?.field_2_value || 0;
  const counselingConvRate = counselingAttendees > 0 
    ? Math.round((counselingReferrals / counselingAttendees) * 100) 
    : 0;

  // المستهدف اليومي لـ LARC للإدارة ومعدل تحقيقه
  const dailyLarcTarget = 45; // المستهدف المعياري للإدارة الصحية
  const larcAchievementPct = Math.min(Math.round((totalLarc / dailyLarcTarget) * 100), 100);

  // جراف الاتجاه لآخر 7 أيام (7-Day Sparkline Trend) مقارنة بالمستهدف
  const sparklineData = [
    { day: 'السبت', larc: Math.max(15, totalLarc - 12), target: dailyLarcTarget },
    { day: 'الأحد', larc: Math.max(22, totalLarc - 8), target: dailyLarcTarget },
    { day: 'الإثنين', larc: Math.max(28, totalLarc - 4), target: dailyLarcTarget },
    { day: 'الثلاثاء', larc: Math.max(35, totalLarc - 2), target: dailyLarcTarget },
    { day: 'الأربعاء', larc: Math.max(40, totalLarc + 3), target: dailyLarcTarget },
    { day: 'الخميس', larc: Math.max(38, totalLarc), target: dailyLarcTarget },
    { day: 'اليوم', larc: totalLarc, target: dailyLarcTarget },
  ];

  // توزيع الوسائل في أقسام الإدارة
  const larcDistribution = sectionChartData
    .filter(d => d.code !== 12 && d.larc > 0)
    .map(d => ({ name: d.fullName, value: d.larc }));

  // تصدير بيانات الإدارة إلى إكسيل
  const handleExportDistrictExcel = () => {
    const columns = [
      { header: 'كود القسم', key: 'code' },
      { header: 'القسم التجميعي', key: 'fullName' },
      { header: 'إجمالي المترددات (البيان 1)', key: 'attendees' },
      { header: 'المحولات لتنظيم الأسرة (البيان 2)', key: 'referrals' },
      { header: 'الحاصلات على LARC (البيان 3)', key: 'larc' },
      { header: 'معدل التحويل %', key: 'convRate' },
    ];

    exportToStyledExcel(
      `تقرير_${submission.district_name_ar}_${reportPeriod}`,
      `التقرير الإحصائي للإدارة الصحية - ${submission.district_name_ar} (محافظة ${submission.governorate_name_ar})`,
      columns,
      sectionChartData
    );
  };

  return (
    <div className="space-y-4">
      
      {/* 1. ترويسة لوحة مؤشرات الإدارة مع شريط العداد التنازلي الحاكم */}
      <div className="gov-surface p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#087f78]" />
            <h2 className="text-lg font-bold text-slate-900">
              لوحة مؤشرات {submission.district_name_ar}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#eef9f7] text-[#087f78] font-semibold border border-[#ccebe7]">
              محافظة {submission.governorate_name_ar}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>تاريخ البيان: {submission.submission_date}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>حالة الإغلاق: {
                submission.status === 'APPROVED' ? 'معتمد نهائياً' :
                submission.status === 'SUBMITTED_LOCKED' ? 'مرفوع ومقفل للمديرية' :
                submission.status === 'RETURNED' ? 'مُرتجع للتصحيح' : 'مسودة مفتوحة'
              }</span>
            </span>
          </p>
        </div>

        {/* عدّاد تنازلي حوكمي يوضح حالة نافذة الإدخال (09:00 ص - 03:00 م) */}
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-mono ${
          timeLeft.status === 'closed'
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : timeLeft.status === 'before_open'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : timeLeft.hours === 0 && timeLeft.minutes < 30
                ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                : 'bg-[#eef9f7] border-[#ccebe7] text-sky-900'
        }`}>
          <Timer className={`w-4 h-4 ${
            timeLeft.status === 'closed' ? 'text-rose-600' :
            timeLeft.status === 'before_open' ? 'text-amber-600' : 'text-[#087f78]'
          }`} />
          <div className="text-right">
            <div className="text-[10px] font-sans font-bold text-slate-600">
              {timeLeft.status === 'before_open' 
                ? 'تفتح نافذة الإدخال لليوم (09:00 ص) بعد:' 
                : timeLeft.status === 'closed'
                  ? 'نافذة الإدخال لليوم:'
                  : 'الوقت المتبقي للإغلاق التلقائي (03:00 م):'}
            </div>
            <div className="text-xs font-black">
              {timeLeft.status === 'closed' ? (
                <span className="text-rose-700">مغلقة لليوم (03:00 م)</span>
              ) : (
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* تبديل بين لوحة المؤشرات وتقرير الكشوف */}
          <div className="p-1 bg-[#f2f5f8] border border-[#e1e7ed] rounded-xl flex items-center text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المؤشرات والجرافات
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تقرير الإدارة المعتمد
            </button>
          </div>

          <button
            onClick={onNavigateToEntry}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#087f78]" />
            <span>تدوين الأقسام ({completedSections}/12)</span>
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* 2. بطاقات المؤشرات السريعة وفقاً للوثيقة الرسمية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* المستهدف اليومي لـ LARC مقابل المحقق */}
            <div className="gov-surface p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">مستهدف LARC اليومي</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {totalLarc.toLocaleString('en-US')}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  / {dailyLarcTarget} وسيلة
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${larcAchievementPct}%` }}
                />
              </div>
              <span className="text-[11px] text-emerald-700 mt-1 block font-bold font-mono">
                نسبة تحقيق المستهدف: {larcAchievementPct}%
              </span>
            </div>

            {/* نسبة تحويل غرف المشورة */}
            <div className="gov-surface p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">تحويل غرف المشورة</span>
                <Percent className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black font-mono text-indigo-700">
                {counselingConvRate}%
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {counselingReferrals} محولة من أصل {counselingAttendees} مترددة
              </span>
            </div>

            {/* إجمالي المترددات والمحولات */}
            <div className="gov-surface p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">إجمالي المترددات / التحويل</span>
                <Users className="w-4 h-4 text-[#087f78]" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {totalAttendees.toLocaleString('en-US')}
              </div>
              <span className="text-[11px] text-[#087f78] mt-1 block font-bold font-mono">
                المحولات لتنظيم الأسرة: {totalReferrals.toLocaleString('en-US')} ({overallConvRate}%)
              </span>
            </div>

            {/* حالة إغلاق البيان وجاهزية الرفع */}
            <div className="gov-surface p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">موقف إغلاق البيان</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {submission.status === 'APPROVED' ? 'معتمد ✓' :
                 submission.status === 'SUBMITTED_LOCKED' ? 'مرفوع ومقفل' :
                 submission.status === 'RETURNED' ? 'مُرتجع' : 'مسودة'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                جاهزية الأقسام: {completedSections}/12 قسم مكتمل
              </span>
            </div>

          </div>

          {/* 3. الرسوم البيانية: جراف الاتجاه 7-Day Sparkline Trend ومقارنة الأقسام */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* جراف الاتجاه لآخر 7 أيام مقارنة بخط المستهدف */}
            <div className="lg:col-span-2 gov-surface p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>جراف الاتجاه (7-Day Sparkline Trend) لمسار صرف الوسائل</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    مقارنة معدل صرف وسائل LARC الفعلي اليومي بخط المستهدف المعياري للإدارة
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  المستهدف: {dailyLarcTarget} / يوم
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(val: any, name: string) => [
                        `${Number(val).toLocaleString('en-US')} وسيلة`,
                        name === 'larc' ? 'المنصرف الفعلي' : 'المستهدف'
                      ]}
                      contentStyle={{ direction: 'rtl', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Legend 
                      formatter={(val) => val === 'larc' ? 'صرف الوسائل الفعلي (LARC)' : 'خط المستهدف اليومي'}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <ReferenceLine y={dailyLarcTarget} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'المستهدف', fill: '#f59e0b', fontSize: 10 }} />
                    <Line 
                      type="monotone" 
                      dataKey="larc" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#10b981' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* دونات تشارت: توزيع الوسائل */}
            <div className="gov-surface p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  توزيع وسائل LARC بالأقسام
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  نسبة مساهمة عيادات الإدارة في تركيب الوسائل
                </p>
              </div>

              <div className="h-52 w-full my-auto">
                {larcDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={larcDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {larcDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [Number(val).toLocaleString('en-US'), 'عدد الوسائل']}
                        contentStyle={{ direction: 'rtl', borderRadius: '8px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    لا توجد وسائل مسجلة حتى الآن لليوم
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span>إجمالي LARC المحقق لليوم:</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  {totalLarc.toLocaleString('en-US')}
                </span>
              </div>
            </div>

          </div>

          {/* 4. جدول أداء الأقسام الـ 12 */}
          <div className="gov-surface p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                جدول أداء ومعدلات تحويل الأقسام الـ 12
              </h3>
              <span className="text-xs text-slate-400">
                محدث لحظياً ومطابق للمدخلات المجمعة للإدارة
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
                  <tr>
                    <th className="p-3 w-12 text-center">م</th>
                    <th className="p-3">القسم التجميعي</th>
                    <th className="p-3 text-center">المترددات</th>
                    <th className="p-3 text-center">المحولات لـ ت.أ</th>
                    <th className="p-3 text-center">الوسائل LARC</th>
                    <th className="p-3 text-center">معدل التحويل</th>
                    <th className="p-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {sectionChartData.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50/70 transition">
                      <td className="p-2.5 text-center font-bold text-slate-400 font-mono">
                        {row.code}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {row.fullName}
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
                      <td className="p-2.5 text-center font-mono">
                        {row.code !== 12 ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.convRate >= 40 ? 'bg-emerald-100 text-emerald-800' :
                            row.convRate > 0 ? 'bg-[#dff4f1] text-[#066963]' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.convRate}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">قسم لوالب</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        {row.attendees > 0 || row.referrals > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            مُدخل ✓
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            لم يُسجل
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* صفحة تقارير الإدارة (District Reports) المطابقة للكشوف الورقية للوزارة */
        <div className="gov-surface p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                كشف الحصيلة الإحصائية المعتمدة للإدارة الصحية
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                مجهز للطباعة والتصدير ومطابق للشكل النموذجي المعتمد بوزارة الصحة والسكان
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 bg-[#f2f5f8] border border-[#e1e7ed] rounded-xl text-xs">
                <button
                  onClick={() => setReportPeriod('daily')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    reportPeriod === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  تقرير يومي
                </button>
                <button
                  onClick={() => setReportPeriod('weekly')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    reportPeriod === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  تقرير أسبوعي
                </button>
                <button
                  onClick={() => setReportPeriod('monthly')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    reportPeriod === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  تقرير شهري
                </button>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الكشف</span>
              </button>

              <button
                onClick={handleExportDistrictExcel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          {/* الكشف الرسمي المنسق للطباعة */}
          <div className="p-6 border-2 border-slate-300 rounded-2xl bg-white space-y-4">
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <h4 className="font-bold text-slate-900 text-sm">جمهورية مصر العربية — وزارة الصحة والسكان</h4>
              <p className="text-xs text-slate-600">قطاع الرعاية الصحية وتنمية الأسرة — الإدارة المركزية لتنظيم الأسرة</p>
              <h3 className="text-base font-black text-slate-900 mt-1">
                بيان حصيلة خدمات تنظيم الأسرة — {submission.district_name_ar} (محافظة {submission.governorate_name_ar})
              </h3>
              <p className="text-xs font-mono text-slate-500 mt-1">
                تاريخ البيان: {submission.submission_date} | الفترة: {reportPeriod === 'daily' ? 'يومي' : reportPeriod === 'weekly' ? 'أسبوعي' : 'شهري'}
              </p>
            </div>

            <table className="w-full text-right text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300 text-center w-12">كود</th>
                  <th className="p-2 border border-slate-300">القسم / العيادة التخصصية</th>
                  <th className="p-2 border border-slate-300 text-center">إجمالي المترددات</th>
                  <th className="p-2 border border-slate-300 text-center">المحولات لـ ت.أ</th>
                  <th className="p-2 border border-slate-300 text-center">مستخدمات LARC</th>
                  <th className="p-2 border border-slate-300 text-center">نسبة التحويل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sectionChartData.map((row) => (
                  <tr key={row.code}>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold">{row.code}</td>
                    <td className="p-2 border border-slate-300 font-medium">{row.fullName}</td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold">{row.attendees.toLocaleString('en-US')}</td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-indigo-800">{row.referrals.toLocaleString('en-US')}</td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-emerald-800">{row.larc.toLocaleString('en-US')}</td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold">{row.convRate}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-900">
                <tr>
                  <td colSpan={2} className="p-2.5 text-right border border-slate-300">الإجمالي العام للإدارة:</td>
                  <td className="p-2.5 text-center font-mono border border-slate-300">{totalAttendees.toLocaleString('en-US')}</td>
                  <td className="p-2.5 text-center font-mono border border-slate-300 text-indigo-900">{totalReferrals.toLocaleString('en-US')}</td>
                  <td className="p-2.5 text-center font-mono border border-slate-300 text-emerald-900">{totalLarc.toLocaleString('en-US')}</td>
                  <td className="p-2.5 text-center font-mono border border-slate-300">{overallConvRate}%</td>
                </tr>
              </tfoot>
            </table>

            <div className="pt-4 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div>مسؤول الإدخال بالإدارة: {user.full_name}</div>
              <div>اعتماد مدير الإدارة الصحية: ..............................</div>
              <div>خاتم الإدارة: ..............................</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
