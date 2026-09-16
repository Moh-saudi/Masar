/**
 * محرك تصدير جداول البيانات إلى Microsoft Excel بصيغتي CSV (بترميز UTF-8 مع BOM)
 * و HTML Spreadsheet المنسق لضمان دعم اللغة العربية والأرقام الإنجليزية (0-9) 
 * دون أي تشوه أو مشاكل في التكويد.
 */

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcelFile(
  filename: string,
  columns: ExcelColumn[],
  data: Record<string, any>[]
) {
  // 1. إعداد ترويسة CSV مع BOM للغة العربية
  const BOM = '\uFEFF';
  
  const headersRow = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
  
  const dataRows = data.map(row => {
    return columns.map(col => {
      const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = BOM + [headersRow, ...dataRows].join('\r\n');

  // 2. إنشاء كائن Blob وتنزيل الملف في المتصفح
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

/**
 * دالة بديلة تُنشئ ملف Excel XML جدولياً منسقاً بالكامل (.xls)
 * يفتح مباشرة داخل Microsoft Excel بتنسيق الجداول والألوان.
 */
export function exportToStyledExcel(
  filename: string,
  title: string,
  columns: ExcelColumn[],
  data: Record<string, any>[]
) {
  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${filename.slice(0, 31)}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayRightToLeft/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Almarai', 'Segoe UI', Tahoma, sans-serif; direction: rtl; }
        .title { font-size: 16pt; font-weight: bold; text-align: center; background-color: #0284c7; color: #ffffff; padding: 10px; }
        th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
        td { border: 1px solid #cbd5e1; padding: 6px; text-align: center; mso-number-format:"\\@"; }
        .num { mso-number-format:"0"; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${columns.length}" class="title">${title}</td>
        </tr>
        <tr>
          <td colspan="${columns.length}" style="text-align: left; color: #64748b; font-size: 9pt;">
            تاريخ التصدير: ${new Date().toLocaleDateString('en-US')} - منظومة «مَسَار» - وزارة الصحة والسكان المصرية
          </td>
        </tr>
        <tr></tr>
        <thead>
          <tr>
            ${columns.map(c => `<th>${c.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(c => {
                const val = row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : '—';
                const isNum = typeof val === 'number' || (!isNaN(Number(val)) && val !== '');
                return `<td class="${isNum ? 'num' : ''}">${val}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
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
