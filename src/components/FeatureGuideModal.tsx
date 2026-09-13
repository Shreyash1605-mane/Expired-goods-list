import React from 'react';
import { BookOpen, X, Check, Camera, Sparkles, Tag, Hash, FileSpreadsheet, ShieldAlert } from 'lucide-react';

interface FeatureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureGuideModal: React.FC<FeatureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-tight">
                GodownScan — Guide &amp; Workflow
              </h3>
              <p className="text-xs text-neutral-400">
                Godown Damage &amp; Expiry Goods Data Capture System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-neutral-300">
          {/* Main Purpose */}
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5">
            <h4 className="font-semibold text-emerald-300 text-sm mb-1 flex items-center gap-2">
              <Check className="h-4 w-4" /> 1. Main Purpose
            </h4>
            <p className="text-neutral-300">
              The app is designed to make your godown verification faster:
              <br />
              <span className="font-semibold text-white">
                Scan → Identify → Read Details → Enter NOS → Select Condition → Add to Report → Export Excel
              </span>
              <br />
              It does <strong>not</strong> maintain inventory or stock balances. It simply captures items found damaged or expired and outputs your exact Excel format.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Camera className="h-4 w-4 text-emerald-400" />
                <span>2. Barcode Scanning</span>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Uses rear camera by default with torch/flash toggle, camera flip, and automatic detection. Manual entry and gallery photo upload are available as backups.
              </p>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Tag className="h-4 w-4 text-amber-400" />
                <span>3. Product Name &amp; MRP</span>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Searches the Product Master catalog to auto-fill product title and MRP. If a new barcode is scanned, it can be saved to the catalog in 1 click.
              </p>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>4. Batch &amp; Date OCR</span>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Camera reads printed text on the package flap to detect Batch No., MFG Date, and EXP Date. Values are always editable before adding.
              </p>
            </div>

            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Hash className="h-4 w-4 text-rose-400" />
                <span>5. NOS &amp; Condition</span>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Quick stepper (+1, +5, +10) for piece count, plus condition tags: 🟢 Normal, 🟡 Seal Open, 🔴 Damaged, 🟠 Expired.
              </p>
            </div>
          </div>

          {/* Excel Format */}
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileSpreadsheet className="h-4 w-4 text-blue-400" />
              <span>6. Excel Export (.xlsx)</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Generates genuine .xlsx spreadsheets formatted with Company, Party Name, Town, Date, Vehicle No, Driver Sign, followed by the table rows (SN, Product Name, MRP, Batch, Dates, NOS, Condition) and signature lines.
            </p>
          </div>

          {/* What App Does NOT do */}
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-red-900/30 space-y-1 text-neutral-400">
            <h5 className="font-semibold text-red-400 text-xs flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> What the App Does NOT Do:
            </h5>
            <p className="text-[11px]">
              No current stock, no opening/closing stock, no stock valuation, no purchase/sales ledger, no automatic stock deduction. It is strictly a pure data capture &amp; Excel reporting tool.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-5 py-3 bg-neutral-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
