/**
 * Admin data export utilities
 * @module features/admin/utils
 */

import type { ExportFormat } from '../types/admin.types';

function toCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function download(content: string | Blob, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportData(
  data: Record<string, unknown>[],
  filename: string,
  format: ExportFormat
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  const fullName = `${filename}_${timestamp}`;

  switch (format) {
    case 'csv': {
      download(toCsv(data), `${fullName}.csv`, 'text/csv;charset=utf-8;');
      break;
    }
    case 'json': {
      download(JSON.stringify(data, null, 2), `${fullName}.json`, 'application/json');
      break;
    }
    case 'xlsx': {
      // Dynamic import to avoid loading xlsx in main bundle
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fullName}.xlsx`, '');
      break;
    }
  }
}
