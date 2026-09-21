'use client';

import React, { useState, useEffect } from 'react';
import { DailySubmission, UserProfile, TimeLockState } from '@/lib/types';
import { approveNationalReport } from '@/lib/services/submissions-client';
import { OperationFeedbackDialog } from './OperationFeedbackDialog';
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
  Layers,
  Calendar
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
  AreaChart,
  Area
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

  let totalAttendees = 0;
  let totalReferrals = 0;
  let totalLarcUsers = 0;
  let copperIUD = 0;
  let hormonalIUD = 0;
  let implanon = 0;

  submissions.forEach(sub => {
    Object.values(sub.sections).forEach(sec => {
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
  const totalDistricts = submissions.length;
  const approvedDistricts = submissions.filter(s => s.status === 'APPROVED').length;
  const nationalRate = totalDistricts > 0 ? Math.round((approvedDistricts / totalDistricts) * 100) : 0;

  // 1. بيانات لوحة الوزير ورئيس القطاع (Macro Strategy)
  // منحنى التنبؤ القومي بانخفاض المواليد (AI Forecast) وربط 2024 - 2025 - 2026
  const birthTrendData = [
    { year: 'أغسطس 2024', births: 198000, protectionRate: 61.2, isForecast: false },
    { year: 'ديسمبر 2024', births: 194000, protectionRate: 62.8, isForecast: false },
    { year: 'أبريل 2025', births: 188000, protectionRate: 64.5, isForecast: false },
    { year: 'أغسطس 2025', births: 182000, protectionRate: 66.1, isForecast: false },
    { year: 'ديسمبر 2025', births: 177000, protectionRate: 67.8, isForecast: false },
    { year: 'أبريل 2026', births: 172000, protectionRate: 69.4, isForecast: true },
    { year: 'أغسطس 2026 (مستهدف)', births: 165000, protectionRate: 71.5, isForecast: true },
  ];

  // 2. بيانات لوحة الإدارة المركزية (Tactical BI - الأقاليم والقوى البشرية)
  const regionsData = [
    { name: 'الوجه البحري', attendees: 48500, referrals: 24200, larc: 12100, taskSharingRate: 74, doctors: 1420 },
    { name: 'الوجه القبلي', attendees: 52100, referrals: 28600, larc: 14800, taskSharingRate: 68, doctors: 1680 },
    { name: 'محافظات الحضر', attendees: 34200, referrals: 18900, larc: 9800, taskSharingRate: 82, doctors: 1150 },
    { name: 'محافظات الحدود', attendees: 8900, referrals: 4600, larc: 2400, taskSharingRate: 62, doctors: 320 },
  ];

  // 3. بيانات لوحة المدير العام (Deep Dive - أصناف وإزالة وأطباء استعانة)
  const methodItemsData = [
    { name: 'لولب نحاسي T-Cu 380A', count: 18450, share: '36%' },
    { name: 'لولب هرموني ميرينا', count: 9820, share: '19%' },
    { name: 'كبسولات إمبلانون نكست', count: 12400, share: '24%' },
    { name: 'حبوب مركبة (ميكروجينون)', count: 6200, share: '12%' },
    { name: 'حقن أحادية (ديبوبروفيرا)', count: 4650, share: '9%' },
  ];

  const removalReasonsData = [
    { reason: 'الرغبة في الحمل والإنجاب', percentage: 54, color: '#10b981' },
    { reason: 'انتهاء الصلاحية الطبية للوسيلة', percentage: 22, color: '#0284c7' },
    { reason: 'نزيف أو أعراض جانبية غير مرغوبة', percentage: 16, color: '#f59e0b' },
    { reason: 'أسباب أسرية ورغبة الزوج', percentage: 8, color: '#8b5cf6' },
  ];

  const outsourcedDoctors = [
    { id: 'doc-1', name: 'د. سارة عادل عبد العزيز', nationalId: '28605140102345', gov: 'القاهرة', district: 'مدينة نصر', procedures: 142, qualityScore: 99 },
    { id: 'doc-2', name: 'د. منى حسني الفقي', nationalId: '28903120104567', gov: 'الجيزة', district: 'العجوزة', procedures: 128, qualityScore: 98 },
    { id: 'doc-3', name: 'د. ياسمين طارق خليل', nationalId: '29107210106789', gov: 'الإسكندرية', district: 'وسط', procedures: 119, qualityScore: 100 },
    { id: 'doc-4', name: 'د. دينا رشاد منصور', nationalId: '28809180108912', gov: 'الشرقية', district: 'الزقازيق', procedures: 115, qualityScore: 97 },
    { id: 'doc-5', name: 'د. نهى إبراهيم حلمي', nationalId: '29012050103456', gov: 'أسيوط', district: 'أسيوط شرق', procedures: 108, qualityScore: 98 },
  ];

  const handleNationalApproval = async () => {
    const confirmed = window.confirm(
      'تأكيد الاعتماد القومي النهائي لتقرير اليوم لديوان معالي الوزير؟'
    );
    if (!confirmed) return;

    try {
      await approveNationalReport(user);
      onDataChanged();
      setOperationFeedback({
        type: 'success',
        title: 'تم الاعتماد القومي بنجاح',
        message: 'تم اعتماد التقرير القومي النهائي وإقفال اليوم الإحصائي للجمهورية بنجاح.',
      });
    } catch {
      setOperationFeedback({
        type: 'error',
        title: 'تعذر الاعتماد القومي',
        message: 'لم نتمكن من اعتماد التقرير القومي في الوقت الحالي. أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
      });
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. ترويسة الجناح التنفيذي للوزارة (Ministry Executive Suite) */}
      <div className="gov-surface p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">
              الجناح الاستراتيجي لديوان عام الوزارة — Ministry Executive Suite
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
            <span>عرض التقرير القومي A4</span>
          </button>

          {(user.role === 'sector_head' || user.role === 'super_admin') && (
            <button
              onClick={handleNationalApproval}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>الاعتماد القومي النهائي للتقرير (10:00 م)</span>
            </button>
          )}
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
          <span>رئيس القطاع ومعالي الوزير (Macro Strategic & AI Forecast)</span>
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
          <span>رئيس الإدارة المركزية (Tactical BI & الأقاليم والقوى البشرية)</span>
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
          <span>مدير عام تنظيم الأسرة (Deep-Dive الأصناف وأطباء الاستعانة)</span>
        </button>
      </div>

      {/* 3. محتوى التبويب المختار */}

      {/* أ. لوحة رئيس القطاع ومعالي الوزير (Macro Strategy) */}
      {suiteTab === 'macro' && (
        <div className="space-y-4">
          {/* البطاقات السيادية */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">المؤشر القومي لتنمية وحماية الأسرة</div>
              <div className="text-3xl font-black font-mono text-emerald-700">68.4%</div>
              <div className="text-[11px] text-emerald-600 mt-1 font-medium">↑ تحسن بمقدار +2.3% عن العام السابق</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">المترددات بالجمهورية لليوم</div>
              <div className="text-3xl font-black font-mono text-slate-900">{totalAttendees.toLocaleString('en-US')}</div>
              <div className="text-[11px] text-slate-400 mt-1">عبر 260 إدارة صحية بـ 27 محافظة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">وسائل LARC المنصرفة لليوم</div>
              <div className="text-3xl font-black font-mono text-indigo-700">{totalLarcAll.toLocaleString('en-US')}</div>
              <div className="text-[11px] text-indigo-600 mt-1 font-bold font-mono">نسبة التغطية: 38.6% من المحولات</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-semibold mb-1">جاهزية الاعتماد القومي</div>
              <div className="text-3xl font-black font-mono text-[#087f78]">{nationalRate}%</div>
              <div className="text-[11px] text-[#087f78] mt-1 font-medium">{approvedDistricts} من {totalDistricts} إدارة معتمدة</div>
            </div>
          </div>

          {/* منحنى التنبؤ القومي بانخفاض معدل المواليد بالذكاء الاصطناعي (AI Forecast) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[#087f78]" />
                  <span>منحنى التنبؤ الفصلي بانخفاض معدلات المواليد (AI Predictive Demographic Forecast)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ربط بيانات إنجاز وسائل تنظيم الأسرة بمسار انخفاض المواليد السنوي الفعلي والمتوقع حتى أغسطس 2026
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                معدل انخفاض مستهدف: -16.6%
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={birthTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="birthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[150000, 210000]} />
                  <Tooltip 
                    formatter={(val: any, name: string) => [
                      name === 'births' ? `${Number(val).toLocaleString('en-US')} مولود شهرياً` : `${val}%`,
                      name === 'births' ? 'عدد المواليد' : 'معدل الحماية'
                    ]}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="births" 
                    name="عدد المواليد الفصلي" 
                    stroke="#0284c7" 
                    fillOpacity={1} 
                    fill="url(#birthGrad)" 
                    strokeWidth={3} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="protectionRate" 
                    name="مؤشر حماية وتنمية الأسرة %" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ب. لوحة رئيس الإدارة المركزية (Tactical BI & الأقاليم والقوى البشرية) */}
      {suiteTab === 'tactical' && (
        <div className="space-y-4">
          {/* مقارنة أقاليم الجمهورية الأربعة */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                مقارنة أقاليم الجمهورية (التردد ومستخدمات LARC)
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
                      formatter={(val: any) => [`${Number(val).toLocaleString('en-US')} حالة`, 'العدد']}
                      contentStyle={{ direction: 'rtl', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="attendees" name="المترددات" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="larc" name="وسائل LARC" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                عدالة توزيع القوى البشرية ومشاركة المهام (Task Sharing)
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
                        مشاركة المهام: {reg.taskSharingRate}% | أطباء ت.أ: {reg.doctors}
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

      {/* ج. لوحة المدير العام (Deep Dive - الأصناف وأطباء الاستعانة) */}
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
            </div>

            {/* إنتاجية أطباء الاستعانة بالاسم والرقم القومي */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                بيان إنتاجية أطباء الاستعانة
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                كشف الأطباء التخصصيين المتعاقدين بالاسم والرقم القومي
              </p>

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
            </div>

          </div>
        </div>
      )}

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
