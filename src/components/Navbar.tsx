import React from 'react';
import { Barcode, Database, FileSpreadsheet, Plus, Sparkles, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  itemCount: number;
  onOpenProductMaster: () => void;
  onOpenHeaderModal: () => void;
  onStartNewItem: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  itemCount,
  onOpenProductMaster,
  onOpenHeaderModal,
  onStartNewItem,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Purpose */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950">
            <Barcode className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base tracking-tight leading-tight">
                GodownScan
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" /> Data Capture System
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Damage &amp; Expiry Goods Reporting <span className="text-neutral-500">· Fast Excel Export</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-nav-product-master"
            onClick={onOpenProductMaster}
            className="px-2.5 sm:px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            title="Manage Product Master (Barcode, Name, MRP)"
          >
            <Database className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Product Master</span>
          </button>

          <button
            id="btn-nav-dispatch-header"
            onClick={onOpenHeaderModal}
            className="px-2.5 sm:px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            title="Configure Dispatch Header & Signatures"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden md:inline">Dispatch Info</span>
          </button>

          <button
            id="btn-nav-new-item"
            onClick={onStartNewItem}
            className="px-3 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-950 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Scan / Add Item</span>
          </button>
        </div>
      </div>
    </header>
  );
};
