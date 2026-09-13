import React, { useState } from 'react';
import { Camera, Sparkles, Plus, Check, RefreshCw, AlertCircle, Barcode, Layers, Hash } from 'lucide-react';
import { ItemCondition, ProductMasterItem } from '../types';

interface ItemCaptureCardProps {
  currentBarcode: string;
  productName: string;
  mrp: number;
  batchNo: string;
  mfgDate: string;
  expDate: string;
  nos: number;
  condition: ItemCondition;
  isFoundInMaster: boolean;
  onOpenScanner: () => void;
  onOpenOcr: () => void;
  onChangeBarcode: (val: string) => void;
  onChangeProductName: (val: string) => void;
  onChangeMrp: (val: number) => void;
  onChangeBatchNo: (val: string) => void;
  onChangeMfgDate: (val: string) => void;
  onChangeExpDate: (val: string) => void;
  onChangeNos: (val: number) => void;
  onChangeCondition: (cond: ItemCondition) => void;
  onAddToReport: (andContinueScanning: boolean) => void;
  onResetActiveItem: () => void;
}

export const ItemCaptureCard: React.FC<ItemCaptureCardProps> = ({
  currentBarcode,
  productName,
  mrp,
  batchNo,
  mfgDate,
  expDate,
  nos,
  condition,
  isFoundInMaster,
  onOpenScanner,
  onOpenOcr,
  onChangeBarcode,
  onChangeProductName,
  onChangeMrp,
  onChangeBatchNo,
  onChangeMfgDate,
  onChangeExpDate,
  onChangeNos,
  onChangeCondition,
  onAddToReport,
  onResetActiveItem,
}) => {
  const conditions: { label: ItemCondition; emoji: string; desc: string; activeClass: string }[] = [
    {
      label: 'Damaged',
      emoji: '🔴',
      desc: 'Box / pack broken',
      activeClass: 'bg-red-500/15 border-red-500 text-red-300 ring-2 ring-red-500/30',
    },
    {
      label: 'Expired',
      emoji: '🟠',
      desc: 'Passed expiry date',
      activeClass: 'bg-orange-500/15 border-orange-500 text-orange-300 ring-2 ring-orange-500/30',
    },
    {
      label: 'Seal Open',
      emoji: '🟡',
      desc: 'Pouch / tape opened',
      activeClass: 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30',
    },
    {
      label: 'Normal',
      emoji: '🟢',
      desc: 'Good condition',
      activeClass: 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30',
    },
  ];

  const handleStepNos = (delta: number) => {
    onChangeNos(Math.max(1, (nos || 1) + delta));
  };

  const isFormValid = productName.trim() && nos > 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      {/* Step 1 & 2: Barcode & Product Identification */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
              1
            </span>
            <h3 className="text-sm font-semibold text-white">Scanned Product Identification</h3>
          </div>

          <div className="flex items-center gap-1.5">
            {currentBarcode && (
              <button
                type="button"
                onClick={onResetActiveItem}
                className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 flex items-center gap-1 transition"
                title="Clear current product"
              >
                <RefreshCw className="h-3 w-3" />
                Clear
              </button>
            )}
            <button
              id="btn-trigger-barcode-scanner"
              type="button"
              onClick={onOpenScanner}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <Camera className="h-3.5 w-3.5" />
              {currentBarcode ? 'Scan Again' : 'Scan Barcode'}
            </button>
          </div>
        </div>

        {/* Barcode Display & Input */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
              <Barcode className="h-3.5 w-3.5 text-neutral-400" />
              Barcode Number
            </label>
            <div className="relative">
              <input
                id="input-card-barcode"
                type="text"
                placeholder="Scan or type barcode"
                value={currentBarcode}
                onChange={(e) => onChangeBarcode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              Product Name *
            </label>
            <input
              id="input-card-product-name"
              type="text"
              required
              placeholder="e.g. KitKat 45g"
              value={productName}
              onChange={(e) => onChangeProductName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">
              MRP (₹)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                ₹
              </span>
              <input
                id="input-card-mrp"
                type="number"
                step="0.01"
                placeholder="0"
                value={mrp || ''}
                onChange={(e) => onChangeMrp(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-6 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Status tag */}
        {currentBarcode && (
          <div className="flex items-center gap-2 text-[11px]">
            {isFoundInMaster ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                <Check className="h-3 w-3" /> Master Catalog Matched
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/40">
                <AlertCircle className="h-3 w-3" /> New Barcode (Will save to Master upon adding)
              </span>
            )}
          </div>
        )}

        {/* Step 3: Batch Number & Dates with OCR Quick Snap */}
        <div className="pt-2 border-t border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                2
              </span>
              <h3 className="text-sm font-semibold text-white">Batch No &amp; Dates</h3>
            </div>

            <button
              id="btn-trigger-ocr-reader"
              type="button"
              onClick={onOpenOcr}
              className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium rounded-xl flex items-center gap-1.5 transition"
              title="Read batch and dates printed on package using AI OCR"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>AI Snap OCR</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Batch No.
              </label>
              <input
                id="input-card-batch"
                type="text"
                placeholder="e.g. B240817"
                value={batchNo}
                onChange={(e) => onChangeBatchNo(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                MFG Date
              </label>
              <input
                id="input-card-mfg"
                type="text"
                placeholder="e.g. 08/2026"
                value={mfgDate}
                onChange={(e) => onChangeMfgDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                EXP Date
              </label>
              <input
                id="input-card-exp"
                type="text"
                placeholder="e.g. 08/2027"
                value={expDate}
                onChange={(e) => onChangeExpDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Step 4 & 5: Quantity (NOS) and Condition Selection */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Quantity Stepper */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                  3
                </span>
                <label className="text-xs font-semibold text-white">
                  NOS / Quantity (Pieces)
                </label>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStepNos(-5)}
                  className="h-9 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono font-medium transition"
                  title="Minus 5"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleStepNos(-1)}
                  className="h-9 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono font-medium transition"
                  title="Minus 1"
                >
                  -1
                </button>
                <input
                  id="input-card-nos"
                  type="number"
                  min="1"
                  value={nos}
                  onChange={(e) => onChangeNos(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-9 w-20 bg-neutral-950 border border-neutral-700 rounded-lg text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleStepNos(1)}
                  className="h-9 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono font-medium transition"
                  title="Plus 1"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleStepNos(5)}
                  className="h-9 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono font-medium transition"
                  title="Plus 5"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => handleStepNos(10)}
                  className="h-9 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono font-medium transition"
                  title="Plus 10"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Calculated Item Total Preview */}
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 text-right">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">
                Item Value
              </span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                ₹{((Number(mrp) || 0) * (Number(nos) || 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Condition Options */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold">
                4
              </span>
              <label className="text-xs font-semibold text-white">Select Condition</label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {conditions.map((item) => {
                const isSelected = condition === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onChangeCondition(item.label)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? item.activeClass
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm">{item.emoji}</span>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <span className="font-semibold text-xs mt-1 text-white">{item.label}</span>
                    <span className="text-[10px] text-neutral-400 leading-tight">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 5: Add to Report Action Buttons */}
        <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row gap-2">
          <button
            id="btn-add-to-report-continue"
            type="button"
            disabled={!isFormValid}
            onClick={() => onAddToReport(true)}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add to Report &amp; Scan Next</span>
          </button>

          <button
            id="btn-add-to-report-finish"
            type="button"
            disabled={!isFormValid}
            onClick={() => onAddToReport(false)}
            className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none text-neutral-200 font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <Check className="h-4 w-4" />
            <span>Add &amp; Review List</span>
          </button>
        </div>
      </div>
    </div>
  );
};
