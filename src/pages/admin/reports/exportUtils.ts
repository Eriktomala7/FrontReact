import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export interface SummaryItem {
  label: string;
  value: string | number;
}

export interface PdfReportOptions {
  title: string;
  filters: string[];
  summary: SummaryItem[];
  head: string[];
  body: Array<Array<string | number>>;
  filename: string;
}

export const exportPdfReport = ({ title, filters, summary, head, body, filename }: PdfReportOptions) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(18);
  doc.setTextColor(16, 35, 74);
  doc.text(title, 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(113, 131, 164);
  doc.text(`Generado: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 14, 23);
  doc.text(`Filtros: ${filters.length ? filters.join('  |  ') : 'Sin filtros'}`, 14, 28);

  let startY = 34;
  if (summary.length) {
    const gap = 4;
    const cardWidth = (pageWidth - 28 - gap * (summary.length - 1)) / summary.length;
    summary.forEach((item, index) => {
      const x = 14 + index * (cardWidth + gap);
      doc.setDrawColor(224, 232, 244);
      doc.setFillColor(245, 248, 253);
      doc.roundedRect(x, startY, cardWidth, 16, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(113, 131, 164);
      doc.text(item.label, x + 4, startY + 6);
      doc.setFontSize(12);
      doc.setTextColor(16, 35, 74);
      doc.text(String(item.value), x + 4, startY + 13);
    });
    startY += 22;
  }

  autoTable(doc, {
    head: [head],
    body,
    startY,
    margin: { bottom: 14 },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [40, 96, 245] },
    alternateRowStyles: { fillColor: [247, 249, 253] },
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(113, 131, 164);
    doc.text(`Página ${page} de ${pages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  doc.save(filename);
};

export interface ExcelSheet {
  name: string;
  rows: Array<Record<string, string | number>>;
  autoFilter?: boolean;
}

export const exportExcelReport = (filename: string, sheets: ExcelSheet[]) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, rows, autoFilter }) => {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const keys = rows.length ? Object.keys(rows[0]) : [];
    sheet['!cols'] = keys.map((key) => ({
      wch: Math.min(
        50,
        Math.max(key.length, ...rows.map((row) => String(row[key] ?? '').length)) + 2,
      ),
    }));
    if (autoFilter && rows.length && sheet['!ref']) {
      sheet['!autofilter'] = { ref: sheet['!ref'] };
    }
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  });

  XLSX.writeFile(workbook, filename);
};
