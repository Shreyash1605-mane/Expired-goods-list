import React, { useState } from 'react';
import { FileSpreadsheet, X, Check, Building2, Truck, User, MapPin, Calendar } from 'lucide-react';
import { ReportHeader } from '../types';

interface ReportHeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  header: ReportHeader;
  onSaveHeader: (newHeader: ReportHeader) => void;
}

export const ReportHeaderModal: React.FC<ReportHeaderModalProps> = ({
  isOpen,
  onClose,
  header,
  onSaveHeader,
}) => {
  const [formData, setFormData] = useState<ReportHeader>({ ...header });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveHeader(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-tight">
                Report Header &amp; Dispatch Details
              </h3>
              <p className="text-xs text-neutral-400">
                Printed at the top of your exported Excel sheet
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
            <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-neutral-400" />
              Company / Godown Name
            </label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. SHREE BALAJI LOGISTICS &amp; WAREHOUSING"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Report Title
            </label>
            <input
              type="text"
              required
              value={formData.reportTitle}
              onChange={(e) => setFormData({ ...formData, reportTitle: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="DAMAGE &amp; EXPIRY GOODS REPORT"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                Party / Distributor Name
              </label>
              <input
                type="text"
                required
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Metro Cash &amp; Carry"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                Town / Godown Location
              </label>
              <input
                type="text"
                required
                value={formData.town}
                onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Sector 9 Godown"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                Report Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-neutral-400" />
                Vehicle Number
              </label>
              <input
                type="text"
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="e.g. MH 12 AB 3456"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-neutral-400" />
                Driver Name
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Driver Signature / Status
              </label>
              <input
                type="text"
                value={formData.driverSign}
                onChange={(e) => setFormData({ ...formData, driverSign: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Signed / Verified"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Prepared By (Supervisor)
            </label>
            <input
              type="text"
              value={formData.preparedBy}
              onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Godown In-Charge"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Check className="h-4 w-4" />
              Save Header Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
