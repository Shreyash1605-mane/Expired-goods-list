import React, { useState } from 'react';
import { FileSpreadsheet, Download, Edit2, Trash2, Search, Filter, Building2, Truck, Calendar, User, ArrowUpDown, ChevronRight } from 'lucide-react';
import { DamageItem, ItemCondition, ReportHeader } from '../types';

interface ReportTableViewProps {
  header: ReportHeader;
  items: DamageItem[];
  onEditHeader: () => void;
  onEditItem: (item: DamageItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
}

export const ReportTableView: React.FC<ReportTableViewProps> = ({
  header,
  items,
  onEditHeader,
  onEditItem,
  onDeleteItem,
  onClearAll,
  onExportExcel,
  onExportCSV,
}) => {
  const [filterCondition, setFilterCondition] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'sn' | 'name' | 'nos' | 'amount'>('sn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Summary figures
  const totalNos = items.reduce((acc, curr) => acc + (Number(curr.nos) || 0), 0);
  const totalValue = items.reduce((acc, curr) => acc + ((Number(curr.mrp) || 0) * (Number(curr.nos) || 0)), 0);

  const damagedCount = items.filter((i) => i.condition === 'Damaged').reduce((a, c) => a + c.nos, 0);
  const expiredCount = items.filter((i) => i.condition === 'Expired').reduce((a, c) => a + c.nos, 0);
  const sealOpenCount = items.filter((i) => i.condition === 'Seal Open').reduce((a, c) => a + c.nos, 0);
  const normalCount = items.filter((i) => i.condition === 'Normal').reduce((a, c) => a + c.nos, 0);

  // Filtered and sorted items
  const filteredItems = items
    .filter((item) => {
      if (filterCondition !== 'All' && item.condition !== filterCondition) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q) ||
        item.batchNo.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'sn') comparison = a.sn - b.sn;
      else if (sortBy === 'name') comparison = a.productName.localeCompare(b.productName);
      else if (sortBy === 'nos') comparison = a.nos - b.nos;
      else if (sortBy === 'amount') comparison = (a.mrp * a.nos) - (b.mrp * b.nos);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (col: 'sn' | 'name' | 'nos' | 'amount') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const conditionBadges: Record<ItemCondition, { label: string; bg: string; text: string; dot: string }> = {
    'Damaged': { label: 'Damaged', bg: 'bg-red-950/60 border-red-800/50', text: 'text-red-400', dot: 'bg-red-500' },
    'Expired': { label: 'Expired', bg: 'bg-orange-950/60 border-orange-800/50', text: 'text-orange-400', dot: 'bg-orange-500' },
    'Seal Open': { label: 'Seal Open', bg: 'bg-amber-950/60 border-amber-800/50', text: 'text-amber-400', dot: 'bg-amber-500' },
    'Normal': { label: 'Normal', bg: 'bg-emerald-950/60 border-emerald-800/50', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Report Dispatch Header Banner */}
      <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
              {header.company}
            </span>
            <span className="text-neutral-600">|</span>
            <span className="text-xs text-neutral-300 font-semibold">{header.reportTitle}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-neutral-500" />
              Party: <strong className="text-neutral-200">{header.partyName || 'N/A'}</strong> ({header.town || 'N/A'})
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              Date: <strong className="text-neutral-200">{header.date}</strong>
            </span>
            {header.vehicleNo && (
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-neutral-500" />
                Vehicle: <strong className="text-neutral-200">{header.vehicleNo}</strong>
              </span>
            )}
            {header.driverName && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-neutral-500" />
                Driver: <strong className="text-neutral-200">{header.driverName}</strong>
              </span>
            )}
          </div>
        </div>

        <button
          id="btn-edit-report-header"
          onClick={onEditHeader}
          className="self-start md:self-center px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shrink-0"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit Dispatch Info
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Total Scanned Items
          </span>
          <span className="text-xl font-bold text-white font-mono">{items.length}</span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">unique lines</span>
        </div>

        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Total Pieces (NOS)
          </span>
          <span className="text-xl font-bold text-amber-400 font-mono">{totalNos}</span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">items recorded</span>
        </div>

        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Total Report Value
          </span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            ₹{totalValue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-neutral-400 block mt-0.5">at product MRP</span>
        </div>

        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Condition Split
          </span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-red-400" title="Damaged">🔴 {damagedCount}</span>
            <span className="text-orange-400" title="Expired">🟠 {expiredCount}</span>
            <span className="text-amber-400" title="Seal Open">🟡 {sealOpenCount}</span>
            <span className="text-emerald-400" title="Normal">🟢 {normalCount}</span>
          </div>
          <span className="text-[10px] text-neutral-500 block">damage &amp; expiry count</span>
        </div>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search report items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Condition Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Damaged', 'Expired', 'Seal Open', 'Normal'].map((cond) => (
            <button
              key={cond}
              onClick={() => setFilterCondition(cond)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                filterCondition === cond
                  ? 'bg-neutral-800 text-white border border-neutral-700 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>

        {/* Export & Actions Buttons */}
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              id="btn-clear-report"
              onClick={onClearAll}
              title="Clear all rows"
              className="p-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 rounded-xl text-xs transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            id="btn-export-csv"
            disabled={items.length === 0}
            onClick={onExportCSV}
            className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 rounded-xl text-xs font-medium flex items-center gap-1 transition"
            title="Download report as CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>

          <button
            id="btn-export-excel"
            disabled={items.length === 0}
            onClick={onExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-950/40 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="bg-neutral-800/80 text-[11px] text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
            <tr>
              <th
                onClick={() => toggleSort('sn')}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>SN</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-2.5">Barcode</th>
              <th
                onClick={() => toggleSort('name')}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Product Name</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-right">MRP (₹)</th>
              <th className="px-3 py-2.5">Batch No</th>
              <th className="px-3 py-2.5">MFG Date</th>
              <th className="px-3 py-2.5">EXP Date</th>
              <th
                onClick={() => toggleSort('nos')}
                className="px-3 py-2.5 text-center cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>NOS</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-2.5">Condition</th>
              <th
                onClick={() => toggleSort('amount')}
                className="px-3 py-2.5 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Amount (₹)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800/60 font-sans">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-neutral-500">
                  {items.length === 0 ? (
                    <div className="space-y-1">
                      <p className="text-neutral-400 font-medium text-sm">No items added to report yet</p>
                      <p className="text-xs text-neutral-500">
                        Scan product barcode above or enter details to start generating your Excel report.
                      </p>
                    </div>
                  ) : (
                    'No items match your search or condition filter.'
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const badge = conditionBadges[item.condition] || conditionBadges['Normal'];
                const rowAmount = (Number(item.mrp) || 0) * (Number(item.nos) || 0);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onEditItem(item)}
                    className="hover:bg-neutral-800/50 cursor-pointer transition"
                  >
                    <td className="px-3 py-2.5 font-mono text-neutral-400">{item.sn}</td>
                    <td className="px-3 py-2.5 font-mono text-neutral-400 text-[11px]">
                      {item.barcode || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-white max-w-[200px] truncate">
                      {item.productName}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-neutral-300">
                      ₹{item.mrp}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-neutral-400 text-[11px]">
                      {item.batchNo || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-neutral-400 text-[11px]">
                      {item.mfgDate || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-amber-300/80 text-[11px]">
                      {item.expDate || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-white bg-neutral-900/40">
                      {item.nos}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.bg} ${badge.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-400">
                      ₹{rowAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition"
                          title="Edit Row"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition"
                          title="Delete Row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with Totals */}
          {items.length > 0 && (
            <tfoot className="bg-neutral-900/90 font-semibold text-xs border-t border-neutral-700/80 text-white">
              <tr>
                <td colSpan={7} className="px-3 py-3 text-right text-neutral-400 uppercase tracking-wider text-[11px]">
                  Total Report Summary:
                </td>
                <td className="px-3 py-3 text-center font-mono text-amber-400 text-sm">
                  {totalNos}
                </td>
                <td></td>
                <td className="px-3 py-3 text-right font-mono text-emerald-400 text-sm">
                  ₹{totalValue.toLocaleString('en-IN')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
