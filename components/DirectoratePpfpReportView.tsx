'use client';

import React, { useState } from 'react';
import { DailySubmission, UserProfile } from '@/lib/types';
import { exportToStyledExcel } from '@/lib/excel-export';
import { 
  Building2, 
  Baby, 
  ShieldCheck, 
  Percent, 
  Download, 
  Printer, 
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';

interface DirectoratePpfpReportViewProps {
  submissions: DailySubmission[];
  user: UserProfile;
}

interface MaternityHospitalData {
  id: string;
  name: string;
  district: string;
  cSectionDeliveries: number;
  cSectionIud: number;
  normalDeliveries: number;
  normalIud: number;
}

export const DirectoratePpfpReportView: React.FC<DirectoratePpfpReportViewProps> = ({
  submissions,
  user,
}) => {
  const govName = user.governorate_name_ar || 'القاهرة';

  // مستشفيات الولادة والمراكز التخصصية بالمحافظة
  const hospitals: MaternityHospitalData[] = [
    {
      id: 'hosp-1',
      name: 'مستشفى الجلاء التعليمي للولادة',
      district: 'إدارة وسط',
      cSectionDeliveries: 42,
      cSectionIud: 29,
      normalDeliveries: 35,
      normalIud: 18,
    },
    {
      id: 'hosp-2',
      name: 'مستشفى منشية البكري العام',
      district: 'إدارة مصر الجديدة',
      cSectionDeliveries: 28,
      cSectionIud: 19,
      normalDeliveries: 22,
      normalIud: 11,
    },
    {
      id: 'hosp-3',
      name: 'مستشفى الساحل التعليمي',
      district: 'إدارة الساحل',
      cSectionDeliveries: 34,
      cSectionIud: 24,
      normalDeliveries: 29,
      normalIud: 14,
    },
    {
      id: 'hosp-4',
      name: 'مستشفى حلوان العام',
      district: 'إدارة حلوان',
      cSectionDeliveries: 30,
      cSectionIud: 20,
      normalDeliveries: 26,
      normalIud: 12,
    },
    {
      id: 'hosp-5',
      name: 'مستشفى المنيرة العام',
      district: 'إدارة السيدة زينب',
      cSectionDeliveries: 22,
      cSectionIud: 15,
      normalDeliveries: 18,
      normalIud: 9,
    },
  ];

  // الحسابات الإجمالية للمحافظة
  const totalCSection = hospitals.reduce((acc, h) => acc + h.cSectionDeliveries, 0);
  const totalCSectionIud = hospitals.reduce((acc, h) => acc + h.cSectionIud, 0);
  const cSectionCoverageRate = totalCSection > 0 ? Math.round((totalCSectionIud / totalCSection) * 100) : 0;

  const totalNormal = hospitals.reduce((acc, h) => acc + h.normalDeliveries, 0);
  const totalNormalIud = hospitals.reduce((acc, h) => acc + h.normalIud, 0);
  const normalCoverageRate = totalNormal > 0 ? Math.round((totalNormalIud / totalNormal) * 100) : 0;

  const totalAllDeliveries = totalCSection + totalNormal;
  const totalAllPpfpIud = totalCSectionIud + totalNormalIud;
  const overallPpfpRate = totalAllDeliveries > 0 ? Math.round((totalAllPpfpIud / totalAllDeliveries) * 100) : 0;

  // تصدير تقرير PPFP للإكسيل
  const handleExportExcel = () => {
    const columns = [
      { header: 'اسم مستشفى الولادة', key: 'name' },
      { header: 'الإدارة الصحية التابع لها', key: 'district' },
      { header: 'عدد الولادات القيصرية', key: 'cSectionDeliveries' },
      { header: 'اللوالب المركبة أثناء القيصرية', key: 'cSectionIud' },
      { header: 'نسبة التغطية بالقيصرية %', key: 'cCoverage' },
      { header: 'عدد الولادات الطبيعية', key: 'normalDeliveries' },
      { header: 'اللوالب المركبة بعد الولادة الطبيعية', key: 'normalIud' },
      { header: 'نسبة التغطية بالطبيعي %', key: 'nCoverage' },
    ];

    const data = hospitals.map(h => ({
      ...h,
      cCoverage: `${Math.round((h.cSectionIud / (h.cSectionDeliveries || 1)) * 100)}%`,
      nCoverage: `${Math.round((h.normalIud / (h.normalDeliveries || 1)) * 100)}%`,
    }));

    exportToStyledExcel(
      `تقرير_PPFP_مستشفيات_${govName}`,
      `تقرير خدمات تنظيم الأسرة بعد الولادة (PPFP) ومستشفيات التوليد - مديرية ${govName}`,
      columns,
      data
    );
  };

  return (
    <div className="space-y-4">
      
      {/* 1. ترويسة تقرير الـ PPFP */}
      <div className="gov-surface p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              تقرير تنظيم الأسرة بعد الولادة ومستشفيات التوليد (PPFP) — محافظة {govName}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            رصد تركيب اللوالب النحاسية والهرمونية أثناء العمليات القيصرية وبعد الولادات الطبيعية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* 2. بطاقات مؤشرات التغطية لمستشفيات الولادة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* أثناء القيصريات */}
        <div className="gov-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">تركيب اللوالب أثناء القيصرية (PPIUD-CS)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              معدل التغطية: {cSectionCoverageRate}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-indigo-700">
              {totalCSectionIud.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / من أصل {totalCSection.toLocaleString('en-US')} ولادة قيصرية
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${cSectionCoverageRate}%` }} />
          </div>
        </div>

        {/* بعد الولادات الطبيعية */}
        <div className="gov-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">تركيب اللوالب بعد الولادة الطبيعية (PPIUD-VD)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              معدل التغطية: {normalCoverageRate}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-700">
              {totalNormalIud.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / من أصل {totalNormal.toLocaleString('en-US')} ولادة طبيعية
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${normalCoverageRate}%` }} />
          </div>
        </div>

        {/* إجمالي الحماية بعد الولادة PPFP */}
        <div className="gov-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-700">الإجمالي العام للحماية (PPFP Total)</span>
            <ShieldCheck className="w-4 h-4 text-[#087f78]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900">
              {totalAllPpfpIud.toLocaleString('en-US')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / من أصل {totalAllDeliveries.toLocaleString('en-US')} ولادة كلية
            </span>
          </div>
          <span className="text-[11px] text-[#087f78] font-bold font-mono mt-3 block">
            المعدل الإجمالي لحماية النفاس: {overallPpfpRate}%
          </span>
        </div>

      </div>

      {/* 3. جدول مستشفيات الولادة بالمحافظة */}
      <div className="gov-surface p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">
            بيان أداء أقسام التوليد بمستشفيات المحافظة
          </h3>
          <span className="text-xs text-slate-400">
            مستشفيات وزارة الصحة والمستشفيات التعليمية والمراكز المتخصصة
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px]">
              <tr>
                <th className="p-3 w-12 text-center">م</th>
                <th className="p-3">اسم المستشفى</th>
                <th className="p-3 text-center">الإدارة الصحية</th>
                <th className="p-3 text-center">ولادات قيصرية</th>
                <th className="p-3 text-center">لوالب بالقيصرية</th>
                <th className="p-3 text-center">نسبة القيصرية</th>
                <th className="p-3 text-center">ولادات طبيعية</th>
                <th className="p-3 text-center">لوالب بالطبيعي</th>
                <th className="p-3 text-center">نسبة الطبيعي</th>
                <th className="p-3 text-center">إجمالي اللوالب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {hospitals.map((h, i) => {
                const cRate = Math.round((h.cSectionIud / (h.cSectionDeliveries || 1)) * 100);
                const nRate = Math.round((h.normalIud / (h.normalDeliveries || 1)) * 100);
                return (
                  <tr key={h.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-2.5 text-center font-bold font-mono text-slate-400">{i + 1}</td>
                    <td className="p-2.5 font-bold text-slate-900">{h.name}</td>
                    <td className="p-2.5 text-center text-slate-600 font-medium">{h.district}</td>
                    <td className="p-2.5 text-center font-bold font-mono">{h.cSectionDeliveries}</td>
                    <td className="p-2.5 text-center font-bold font-mono text-indigo-700">{h.cSectionIud}</td>
                    <td className="p-2.5 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-bold text-[11px]">
                        {cRate}%
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono">{h.normalDeliveries}</td>
                    <td className="p-2.5 text-center font-bold font-mono text-emerald-700">{h.normalIud}</td>
                    <td className="p-2.5 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                        {nRate}%
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono text-[#066963]">
                      {h.cSectionIud + h.normalIud}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-black border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="p-3 text-right">إجمالي المحافظة:</td>
                <td className="p-3 text-center font-mono">{totalCSection}</td>
                <td className="p-3 text-center font-mono text-indigo-800">{totalCSectionIud}</td>
                <td className="p-3 text-center font-mono text-indigo-800">{cSectionCoverageRate}%</td>
                <td className="p-3 text-center font-mono">{totalNormal}</td>
                <td className="p-3 text-center font-mono text-emerald-800">{totalNormalIud}</td>
                <td className="p-3 text-center font-mono text-emerald-800">{normalCoverageRate}%</td>
                <td className="p-3 text-center font-mono text-sky-900">{totalAllPpfpIud}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
