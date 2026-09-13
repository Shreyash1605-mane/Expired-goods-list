import React, { useState } from 'react';
import { Edit3, X, Check, Trash2 } from 'lucide-react';
import { DamageItem, ItemCondition } from '../types';

interface EditItemModalProps {
  isOpen: boolean;
  item: DamageItem | null;
  onClose: () => void;
  onSave: (updatedItem: DamageItem) => void;
  onDelete: (id: string) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !item) return null;

  const [formData, setFormData] = useState<DamageItem>({ ...item });

  const conditions: { label: ItemCondition; emoji: string; color: string }[] = [
    { label: 'Normal', emoji: '🟢', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
    { label: 'Seal Open', emoji: '🟡', color: 'border-amber-500 bg-amber-500/10 text-amber-400' },
    { label: 'Damaged', emoji: '🔴', color: 'border-red-500 bg-red-500/10 text-red-400' },
    { label: 'Expired', emoji: '🟠', color: 'border-orange-500 bg-orange-500/10 text-orange-400' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-200 border border-neutral-700">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-tight">
                Edit Item #{item.sn}
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                Barcode: {item.barcode || 'N/A'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Product Name
            </label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                NOS / Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.nos}
                onChange={(e) => setFormData({ ...formData, nos: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Batch No.
              </label>
              <input
                type="text"
                placeholder="e.g. B240817"
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                MFG Date
              </label>
              <input
                type="text"
                placeholder="e.g. 08/2026"
                value={formData.mfgDate}
                onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                EXP Date
              </label>
              <input
                type="text"
                placeholder="e.g. 08/2027"
                value={formData.expDate}
                onChange={(e) => setFormData({ ...formData, expDate: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Condition Select */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Condition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {conditions.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, condition: c.label })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    formData.condition === c.label
                      ? c.color + ' ring-2 ring-emerald-500/30'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                if (confirm('Delete this item from the report?')) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center gap-1.5 transition"
            >
              <Trash2 className="h-4 w-4" />
              Delete Row
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
