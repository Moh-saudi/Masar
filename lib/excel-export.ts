/**
 * محرك تصدير جداول البيانات والتقارير إلى Microsoft Excel المنسق رسمياً
 * وفقاً لمعايير وزارة الصحة والسكان المصرية ومنظومة «مَسَار»
 * يدعم اللغة العربية RTL والخطوط والألوان والتوقيعات الرسمية.
 */

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelExportOptions {
  subtitle?: string;
  governorateName?: string;
  districtName?: string;
  kpis?: { label: string; value: string | number }[];
  showSignatures?: boolean;
}

export function exportToStyledExcel(
  filename: string,
  title: string,
  columns: ExcelColumn[],
  data: Record<string, any>[],
  options?: ExcelExportOptions
) {
  const currentDate = new Date();
  const dateFormatted = currentDate.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeFormatted = currentDate.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const kpisHtml = options?.kpis && options.kpis.length > 0 ? `
    <tr>
      <td colspan="${columns.length}" style="padding: 10px; background-color: #f0fdfa; border: 1px solid #99f6e4;">
        <table style="width: 100%; direction: rtl;">
          <tr>
            ${options.kpis.map(k => `
              <td style="text-align: center; padding: 6px; border: none; background: transparent;">
                <div style="font-size: 9pt; color: #0f766e; font-weight: bold;">${k.label}</div>
                <div style="font-size: 13pt; color: #115e59; font-weight: 900; font-family: Tahoma, Arial;">${k.value}</div>
              </td>
            `).join('')}
          </tr>
        </table>
      </td>
    </tr>
    <tr></tr>
  ` : '';

  const signaturesHtml = options?.showSignatures !== false ? `
    <tr></tr>
    <tr></tr>
    <tr>
      <td colspan="${columns.length}" style="border: none; padding-top: 15px;">
        <table style="width: 100%; direction: rtl; text-align: center; font-size: 10pt;">
          <tr>
            <td style="border: none; width: 33%; font-weight: bold; color: #1e293b;">
              إعداد وتجميع البيانات<br/><br/>
              <span style="font-weight: normal; color: #64748b; font-size: 9pt;">...................................................</span><br/>
              <span style="font-size: 9pt; color: #475569;">منسق تنمية الأسرة</span>
            </td>
            <td style="border: none; width: 33%; font-weight: bold; color: #1e293b;">
              مراجعة وتدقيق الإحصاء<br/><br/>
              <span style="font-weight: normal; color: #64748b; font-size: 9pt;">...................................................</span><br/>
              <span style="font-size: 9pt; color: #475569;">مدير إدارة الإحصاء والتحول الرقمي</span>
            </td>
            <td style="border: none; width: 34%; font-weight: bold; color: #1e293b;">
              الاعتماد الرسمي — ديوان الوزارة<br/><br/>
              <span style="font-weight: normal; color: #64748b; font-size: 9pt;">...................................................</span><br/>
              <span style="font-size: 9pt; color: #475569;">رئيس قطاع الرعاية الصحية وتنمية الأسرة</span>
            </td>
          </tr>
          <tr>
            <td colspan="3" style="border: none; text-align: center; padding-top: 25px; color: #94a3b8; font-size: 8pt;">
              (مكان خاتم شعار الجمهورية المعتمد)
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${filename.slice(0, 31)}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayRightToLeft/>
                <x:Print>
                  <x:ValidPrinterInfo/>
                  <x:PaperSizeIndex>9</x:PaperSizeIndex>
                  <x:HorizontalResolution>600</x:HorizontalResolution>
                  <x:VerticalResolution>600</x:VerticalResolution>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Almarai', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
        .banner { background-color: #087f78; color: #ffffff; text-align: center; font-weight: bold; padding: 12px; }
        .sub-banner { background-color: #f1f5f9; color: #334155; font-size: 10pt; padding: 6px; text-align: center; font-weight: bold; }
        .title { font-size: 15pt; font-weight: 900; color: #0f172a; text-align: center; padding: 10px; }
        .meta-bar { font-size: 9pt; color: #64748b; padding: 6px 12px; border-bottom: 1px solid #cbd5e1; }
        th { background-color: #0d4a46; color: #ffffff; font-weight: bold; border: 1px solid #087f78; padding: 9px 6px; text-align: center; font-size: 10pt; }
        td { border: 1px solid #cbd5e1; padding: 7px 6px; text-align: center; font-size: 9.5pt; color: #1e293b; mso-number-format:"\\@"; }
        .num { mso-number-format:"0"; font-weight: bold; font-family: Tahoma, Arial; }
        .percent { mso-number-format:"0.0%"; font-weight: bold; font-family: Tahoma, Arial; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .footer-note { font-size: 8.5pt; color: #64748b; text-align: center; padding: 10px; }
      </style>
    </head>
    <body>
      <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
        <!-- الترويسة الرسمية -->
        <tr>
          <td colspan="${columns.length}" class="banner" style="font-size: 13pt;">
            جمهورية مصر العربية — وزارة الصحة والسكان
          </td>
        </tr>
        <tr>
          <td colspan="${columns.length}" class="sub-banner">
            قطاع الرعاية الصحية وتنمية الأسرة • الإدارة المركزية لتنمية الأسرة
          </td>
        </tr>
        <tr>
          <td colspan="${columns.length}" class="title">
            ${title}
          </td>
        </tr>
        ${options?.subtitle ? `
        <tr>
          <td colspan="${columns.length}" style="text-align: center; font-size: 10pt; color: #087f78; font-weight: bold; padding-bottom: 8px;">
            ${options.subtitle}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td colspan="${columns.length}" class="meta-bar">
            <strong>تاريخ واستخراج البيان:</strong> ${dateFormatted} (${timeFormatted}) | 
            <strong>المنظومة الرقمية:</strong> مَسَار (PPFD) | 
            ${options?.governorateName ? `<strong>المحافظة:</strong> ${options.governorateName} | ` : ''}
            ${options?.districtName ? `<strong>الإدارة:</strong> ${options.districtName} | ` : ''}
            <strong>الحالة:</strong> كشف رسمي معتمد
          </td>
        </tr>
        <tr></tr>

        ${kpisHtml}

        <thead>
          <tr>
            ${columns.map(c => `<th style="${c.width ? `width: ${c.width}px;` : ''}">${c.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(c => {
                const val = row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : '—';
                const isNum = typeof val === 'number';
                const isPercent = typeof val === 'string' && val.endsWith('%');
                const cellClass = isNum ? 'num' : isPercent ? 'percent' : '';
                return `<td class="${cellClass}">${val}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>

        <!-- إجمالي السجلات -->
        <tr>
          <td colspan="${columns.length}" style="background-color: #f1f5f9; font-weight: bold; text-align: right; padding: 8px; font-size: 9.5pt;">
            إجمالي السجلات المدرجة: <span style="font-family: Tahoma; color: #087f78;">${data.length}</span> سجلاً معتمداً
          </td>
        </tr>

        ${signaturesHtml}

        <!-- إشعار الحقوق والملكية -->
        <tr></tr>
        <tr>
          <td colspan="${columns.length}" class="footer-note">
            جميع الحقوق محفوظة © 2026 — وزارة الصحة والسكان المصرية • قطاع الرعاية الصحية وتنمية الأسرة • منظومة «مَسَار»
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcelFile(
  filename: string,
  columns: ExcelColumn[],
  data: Record<string, any>[]
) {
  const BOM = '\uFEFF';
  const headersRow = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const dataRows = data.map(row => {
    return columns.map(col => {
      const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = BOM + [headersRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
