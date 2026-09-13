import React, { useState } from 'react';
import { Plus, Search, Trash2, X, Tag, RefreshCw, Check } from 'lucide-react';
import { ProductMasterItem } from '../types';
import { DEFAULT_PRODUCT_MASTER } from '../data/productMaster';

interface ProductMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductMasterItem[];
  onSaveProducts: (products: ProductMasterItem[]) => void;
}

export const ProductMasterModal: React.FC<ProductMasterModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newMrp, setNewMrp] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarcode.trim() || !newName.trim() || !newMrp) {
      alert('Please fill in Barcode, Product Name, and MRP');
      return;
    }

    const existingIndex = products.findIndex((p) => p.barcode === newBarcode.trim());
    if (existingIndex >= 0) {
      const updated = [...products];
      updated[existingIndex] = {
        barcode: newBarcode.trim(),
        productName: newName.trim(),
        mrp: Number(newMrp),
        category: newCategory.trim() || 'General',
      };
      onSaveProducts(updated);
      showToast('Updated existing product in Master');
    } else {
      const updated = [
        {
          barcode: newBarcode.trim(),
          productName: newName.trim(),
          mrp: Number(newMrp),
          category: newCategory.trim() || 'General',
        },
        ...products,
      ];
      onSaveProducts(updated);
      showToast('Added product to Master');
    }

    setNewBarcode('');
    setNewName('');
    setNewMrp('');
    setNewCategory('');
    setShowAddForm(false);
  };

  const handleDeleteProduct = (barcode: string) => {
    if (confirm(`Remove product with barcode ${barcode} from master?`)) {
      const updated = products.filter((p) => p.barcode !== barcode);
      onSaveProducts(updated);
      showToast('Product removed');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset Product Master to initial standard catalog?')) {
      onSaveProducts(DEFAULT_PRODUCT_MASTER);
      showToast('Master reset to defaults');
    }
  };

  const filtered = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-tight">
                Product Master Catalog
              </h3>
              <p className="text-xs text-neutral-400">
                Maps scanned barcodes to Product Names &amp; MRPs (Not inventory)
              </p>
            </div>
          </div>
          <button
            id="btn-close-product-master"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/40 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by barcode, name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-add-product"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="h-4 w-4" />
              {showAddForm ? 'Close Form' : 'Add Product'}
            </button>
            <button
              onClick={handleResetDefaults}
              title="Reset default catalog"
              className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium flex items-center gap-1 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Defaults</span>
            </button>
          </div>
        </div>

        {/* Add Product Form Collapse */}
        {showAddForm && (
          <form
            onSubmit={handleAddProduct}
            className="bg-neutral-950 p-4 border-b border-neutral-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white">Add New Product to Master</h4>
              <span className="text-[11px] text-neutral-400">Barcode will auto-fill next scan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Barcode *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8901234567890"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-neutral-400 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KitKat 45g"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">MRP (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25"
                  value={newMrp}
                  onChange={(e) => setNewMrp(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Save Product
              </button>
            </div>
          </form>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-xs px-4 py-2 flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Product Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-800/80 text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Barcode</th>
                  <th className="px-3 py-2.5">Product Name</th>
                  <th className="px-3 py-2.5 text-right">MRP (₹)</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-neutral-500">
                      No products found matching &ldquo;{searchTerm}&rdquo;
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.barcode} className="hover:bg-neutral-800/50 transition">
                      <td className="px-3 py-2.5 font-mono text-emerald-400">{item.barcode}</td>
                      <td className="px-3 py-2.5 font-medium text-white">{item.productName}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-neutral-200">
                        ₹{item.mrp}
                      </td>
                      <td className="px-3 py-2.5 text-neutral-400">{item.category || '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleDeleteProduct(item.barcode)}
                          className="p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition"
                          title="Delete product from Master"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-5 py-3 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
          <span>{products.length} products registered in catalog</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
