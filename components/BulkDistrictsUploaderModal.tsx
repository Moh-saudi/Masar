'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Database, 
  Copy, 
  Check, 
  Building2, 
  Building,
  RefreshCw,
  FileText
} from 'lucide-react';

interface ParsedDistrictRow {
  governorateName: string;
  districtName: string;
  districtCode?: string;
  facilityName?: string;
}

interface BulkDistrictsUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDistrictsImported: (imported: ParsedDistrictRow[]) => void;
}

export const BulkDistrictsUploaderModal: React.FC<BulkDistrictsUploaderModalProps> = ({
  isOpen,
  onClose,
  onDistrictsImported,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedDistrictRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. تنزيل نموذج الإكسيل النموذجي
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'اسم مديرية الشئون الصحية': 'القاهرة',
        'اسم الإدارة الصحية': 'إدارة مدينة نصر الطبية',
        'كود الإدارة (اختياري)': '0101',
        'اسم المنشأة الصحية (اختياري)': 'مركز طب أسرة الحي السادس',
      },
      {
        'اسم مديرية الشئون الصحية': 'القاهرة',
        'اسم الإدارة الصحية': 'إدارة حلوان الطبية',
        'كود الإدارة (اختياري)': '0102',
        'اسم المنشأة الصحية (اختياري)': 'مستشفى حلوان العام',
      },
      {
        'اسم مديرية الشئون الصحية': 'الإسكندرية',
        'اسم الإدارة الصحية': 'إدارة وسط الطبية',
        'كود الإدارة (اختياري)': '0301',
        'اسم المنشأة الصحية (اختياري)': 'مستشفى الجلاء للولادة',
      },
      {
        'اسم مديرية الشئون الصحية': 'الإسكندرية',
        'اسم الإدارة الصحية': 'إدارة المنتزه الطبية',
        'كود الإدارة (اختياري)': '0302',
        'اسم المنشأة الصحية (اختياري)': 'مركز طب أسرة المندرة',
      },
      {
        'اسم مديرية الشئون الصحية': 'الجيزة',
        'اسم الإدارة الصحية': 'إدارة الدقي والعجوزة الطبية',
        'كود الإدارة (اختياري)': '0201',
        'اسم المنشأة الصحية (اختياري)': 'مركز طب أسرة الدقي',
      },
      {
        'اسم مديرية الشئون الصحية': 'أسيوط',
        'اسم الإدارة الصحية': 'إدارة أسيوط شرق الطبية',
        'كود الإدارة (اختياري)': '2501',
        'اسم المنشأة الصحية (اختياري)': 'مركز صحة الوليدية',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    // ضبط اتجاه الورقة من اليمين لليسار
    if (!ws['!views']) ws['!views'] = [];
    ws['!cols'] = [
      { wch: 28 },
      { wch: 30 },
      { wch: 20 },
      { wch: 32 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'دليل_المديريات_والإدارات');
    XLSX.writeFile(wb, 'نموذج_إدراج_المديريات_والإدارات_مسار.xlsx');
  };

  // 2. قراءة ملف الإكسيل المرفوع
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setError('الملف المرفوع فارغ أو لا يحتوي على صفوف بيانات.');
          return;
        }

        const mapped: ParsedDistrictRow[] = [];
        json.forEach((row) => {
          // استخراج اسم المديرية واسم الإدارة من الأعمدة
          const govName = row['اسم مديرية الشئون الصحية'] || row['اسم المديرية'] || row['المحافظة'] || row['مديرية الشئون الصحية'] || Object.values(row)[0];
          const distName = row['اسم الإدارة الصحية'] || row['اسم الإدارة'] || row['الإدارة'] || Object.values(row)[1];
          const code = row['كود الإدارة (اختياري)'] || row['كود الإدارة'] || row['الكود'] || '';
          const facName = row['اسم المنشأة الصحية (اختياري)'] || row['اسم المنشأة'] || '';

          if (govName && distName) {
            mapped.push({
              governorateName: String(govName).trim(),
              districtName: String(distName).trim(),
              districtCode: code ? String(code).trim() : undefined,
              facilityName: facName ? String(facName).trim() : undefined,
            });
          }
        });

        if (mapped.length === 0) {
          setError('لم يتم العثور على أعمدة صالحة. يرجى التأكد من أن العمود الأول هو اسم المديرية والعمود الثاني اسم الإدارة.');
          return;
        }

        setParsedRows(mapped);
      } catch (err: any) {
        setError('حدث خطأ أثناء قراءة ملف الإكسيل: ' + (err.message || 'تأكد من صيغة الملف'));
      }
    };

    reader.readAsBinaryString(file);
  };

  // 3. تحليل النص الملصوق مباشرة من إكسيل (Copy-Paste)
  const handleParsePastedText = () => {
    setError(null);
    if (!pastedText.trim()) {
      setError('يرجى لصق البيانات من برنامج الإكسيل أولاً.');
      return;
    }

    const lines = pastedText.trim().split(/\r?\n/);
    const mapped: ParsedDistrictRow[] = [];

    lines.forEach((line, index) => {
      // التجاهل إذا كان السطر هو الترويسة
      if (index === 0 && (line.includes('مديرية') || line.includes('المحافظة') || line.includes('الإدارة'))) {
        return;
      }

      // الفصل إما بالـ Tab أو الفاصلة
      const parts = line.split(/\t|,/).map(p => p.trim());
      if (parts.length >= 2) {
        const gov = parts[0];
        const dist = parts[1];
        const code = parts[2] || undefined;
        const fac = parts[3] || undefined;

        if (gov && dist) {
          mapped.push({
            governorateName: gov,
            districtName: dist,
            districtCode: code,
            facilityName: fac,
          });
        }
      }
    });

    if (mapped.length === 0) {
      setError('تعذر قراءة البيانات الملصوقة. تأكد من نسخ عمودين على الأقل (اسم المديرية، ثم اسم الإدارة).');
      return;
    }

    setParsedRows(mapped);
  };

  // حساب الإحصائيات المكتشفة
  const uniqueGovs = Array.from(new Set(parsedRows.map(r => r.governorateName)));
  const uniqueDistricts = Array.from(new Set(parsedRows.map(r => `${r.governorateName}-${r.districtName}`)));

  // توليد كود SQL جاهز للإدراج في قاعدة البيانات
  const generateSqlScript = () => {
    let sql = `-- سكربت إدراج الإدارات والمديريات في منظومة مَسَار\n`;
    sql += `-- تم التوليد آلياً لعدد ${uniqueDistricts.length} إدارة صحية عبر ${uniqueGovs.length} مديرية\n\n`;

    parsedRows.forEach((r, idx) => {
      const code = r.districtCode || `DIST-${1000 + idx}`;
      sql += `INSERT INTO health_districts (code, name_ar, governorate_id)\n`;
      sql += `VALUES ('${code}', '${r.districtName}', (SELECT id FROM governorates WHERE name_ar LIKE '%${r.governorateName}%' LIMIT 1))\n`;
      sql += `ON CONFLICT (code) DO NOTHING;\n\n`;
    });

    return sql;
  };

  const handleCopySql = () => {
    const sql = generateSqlScript();
    navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  // تأكيد الاستيراد المباشر
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    onDistrictsImported(parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* الترويسة */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                استيراد المديريات والإدارات الصحية من ملف إكسيل (Excel Bulk Ingestion)
              </h3>
              <p className="text-xs text-slate-500">
                العمود الأول: اسم المديرية/المحافظة • العمود الثاني: اسم الإدارة الصحية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* زر تحميل النموذج الجاهز */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sky-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>نموذج الإكسيل الرسمي الجاهز للملء:</span>
              </div>
              <p className="text-[11px] text-sky-800/80 mt-0.5">
                حمل النموذج بصيغة Excel، قم بتعبئة الإدارات والمديريات، ثم ارفعه هنا فوراً.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل النموذج (.xlsx)</span>
            </button>
          </div>

          {/* تبديل طريقة الإدخال: رفع ملف أو لصق مباشر */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>رفع ملف Excel أو CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Copy className="w-4 h-4 text-purple-600" />
              <span>لصق مباشر من جدول الإكسيل (Copy-Paste)</span>
            </button>
          </div>

          {/* 1. خيار رفع الملف */}
          {activeTab === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition cursor-pointer space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-800 text-sm">
                {fileName ? fileName : 'انقر لاختيار ملف الإكسيل أو اسحبه هنا'}
              </div>
              <p className="text-slate-400 text-[11px]">
                يدعم ملفات Microsoft Excel (.xlsx, .xls) وجداول .csv بترميز UTF-8
              </p>
            </div>
          )}

          {/* 2. خيار اللصق المباشر من إكسيل */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                الصق الصفوف المنسوخة من الإكسيل هنا مباشرة:
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="القاهرة	إدارة مدينة نصر الطبية&#10;القاهرة	إدارة حلوان الطبية&#10;الإسكندرية	إدارة وسط الطبية"
                className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحليل الصفوف الملصوقة</span>
              </button>
            </div>
          )}

          {/* رسالة الخطأ إن وجدت */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* معاينة البيانات المرصودة */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">
                    تم رصد <strong className="font-mono text-emerald-700">{parsedRows.length}</strong> صف بيانات
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">
                    <strong className="font-mono text-slate-900">{uniqueGovs.length}</strong> مديرية مختلفة
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 border border-slate-200"
                >
                  {sqlCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{sqlCopied ? 'تم نسخ كود SQL ✓' : 'نسخ كود SQL لـ Supabase'}</span>
                </button>
              </div>

              {/* جدول المعاينة */}
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[11px] sticky top-0">
                    <tr>
                      <th className="p-2.5 w-10 text-center">م</th>
                      <th className="p-2.5">مديرية الشئون الصحية</th>
                      <th className="p-2.5">الإدارة الصحية</th>
                      <th className="p-2.5 text-center">كود الإدارة</th>
                      <th className="p-2.5">المنشأة (اختياري)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{row.governorateName}</td>
                        <td className="p-2 text-sky-800 font-medium">{row.districtName}</td>
                        <td className="p-2 text-center font-mono text-slate-500">{row.districtCode || 'تلقائي'}</td>
                        <td className="p-2 text-slate-500">{row.facilityName || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* التذييل والأزرار */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold transition text-xs"
          >
            إغلاق
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>اعتماد وتثبيت الإدارات بالمنظومة ({parsedRows.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
