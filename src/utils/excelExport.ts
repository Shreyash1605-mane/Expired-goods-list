import * as XLSX from 'xlsx';
import { DamageItem, ReportHeader } from '../types';

export function exportDamageReportToExcel(header: ReportHeader, items: DamageItem[]) {
  // Calculate summary totals
  const totalNos = items.reduce((acc, curr) => acc + (Number(curr.nos) || 0), 0);
  const totalValue = items.reduce((acc, curr) => acc + ((Number(curr.mrp) || 0) * (Number(curr.nos) || 0)), 0);

  // Prepare 2D array data for the spreadsheet
  const rows: any[][] = [
    // Header block
    [header.company.toUpperCase()],
    [header.reportTitle.toUpperCase()],
    [],
    ['Party Name:', header.partyName || 'N/A', '', 'Date:', header.date || new Date().toISOString().split('T')[0]],
    ['Town / Location:', header.town || 'N/A', '', 'Vehicle No.:', header.vehicleNo || 'N/A'],
    ['Driver Name:', header.driverName || 'N/A', '', 'Driver Sign:', header.driverSign || 'N/A'],
    ['Prepared By:', header.preparedBy || 'Godown Supervisor', '', 'Total Items:', items.length],
    [],
    // Table column headers
    [
      'SN',
      'Barcode',
      'Product Name',
      'MRP (₹)',
      'Batch No',
      'MFG Date',
      'EXP Date',
      'NOS (Qty)',
      'Condition',
      'Total Amount (₹)'
    ]
  ];

  // Data rows
  items.forEach((item, index) => {
    const itemTotal = (Number(item.mrp) || 0) * (Number(item.nos) || 0);
    rows.push([
      index + 1,
      item.barcode || 'N/A',
      item.productName || 'Unknown Item',
      item.mrp || 0,
      item.batchNo || '-',
      item.mfgDate || '-',
      item.expDate || '-',
      item.nos || 0,
      item.condition,
      itemTotal
    ]);
  });

  // Summary row
  rows.push([]);
  rows.push([
    '',
    '',
    'TOTAL',
    '',
    '',
    '',
    '',
    totalNos,
    '',
    totalValue
  ]);

  rows.push([]);
  rows.push([]);
  rows.push(['_____________________', '', '_____________________', '', '_____________________']);
  rows.push(['Driver Signature', '', 'Godown Incharge', '', 'Authorized Receiver']);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 6 },  // SN
    { wch: 16 }, // Barcode
    { wch: 32 }, // Product Name
    { wch: 10 }, // MRP
    { wch: 14 }, // Batch No
    { wch: 12 }, // MFG Date
    { wch: 12 }, // EXP Date
    { wch: 12 }, // NOS
    { wch: 14 }, // Condition
    { wch: 16 }, // Total Amount
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Damage_Expiry_Report');

  // Sanitize filename
  const cleanDate = (header.date || new Date().toISOString().split('T')[0]).replace(/[^0-9-]/g, '_');
  const fileName = `Godown_Report_${cleanDate}_${Date.now().toString().slice(-4)}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(workbook, fileName);
}

export function exportDamageReportToCSV(header: ReportHeader, items: DamageItem[]) {
  const totalNos = items.reduce((acc, curr) => acc + (Number(curr.nos) || 0), 0);
  const totalValue = items.reduce((acc, curr) => acc + ((Number(curr.mrp) || 0) * (Number(curr.nos) || 0)), 0);

  const escapeCSV = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const lines: string[] = [
    `${escapeCSV(header.company)}`,
    `${escapeCSV(header.reportTitle)}`,
    `"Party Name:",${escapeCSV(header.partyName)},"Date:",${escapeCSV(header.date)}`,
    `"Town:",${escapeCSV(header.town)},"Vehicle No:",${escapeCSV(header.vehicleNo)}`,
    `"Driver:",${escapeCSV(header.driverName)},"Sign:",${escapeCSV(header.driverSign)}`,
    '',
    ['SN', 'Barcode', 'Product Name', 'MRP', 'Batch No', 'MFG Date', 'EXP Date', 'NOS', 'Condition', 'Total Amount'].map(escapeCSV).join(','),
  ];

  items.forEach((item, index) => {
    const itemTotal = (Number(item.mrp) || 0) * (Number(item.nos) || 0);
    lines.push([
      index + 1,
      item.barcode || '',
      item.productName,
      item.mrp,
      item.batchNo,
      item.mfgDate,
      item.expDate,
      item.nos,
      item.condition,
      itemTotal
    ].map(escapeCSV).join(','));
  });

  lines.push('');
  lines.push(['', '', 'TOTAL', '', '', '', '', totalNos, '', totalValue].map(escapeCSV).join(','));

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Godown_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
