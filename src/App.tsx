import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ItemCaptureCard } from './components/ItemCaptureCard';
import { ReportTableView } from './components/ReportTableView';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { BatchDateOcrModal } from './components/BatchDateOcrModal';
import { ProductMasterModal } from './components/ProductMasterModal';
import { ReportHeaderModal } from './components/ReportHeaderModal';
import { EditItemModal } from './components/EditItemModal';
import { FeatureGuideModal } from './components/FeatureGuideModal';
import { DamageItem, ItemCondition, ProductMasterItem, ReportHeader } from './types';
import { DEFAULT_PRODUCT_MASTER, DEFAULT_REPORT_HEADER } from './data/productMaster';
import { exportDamageReportToCSV, exportDamageReportToExcel } from './utils/excelExport';
import { playScanBeep } from './utils/audioChime';
import { HelpCircle, FileSpreadsheet, Check, Camera, RefreshCw } from 'lucide-react';

const STORAGE_KEY_ITEMS = 'godown_damage_report_items_v1';
const STORAGE_KEY_HEADER = 'godown_damage_report_header_v1';
const STORAGE_KEY_MASTER = 'godown_product_master_v1';

export default function App() {
  // Persistence state
  const [items, setItems] = useState<DamageItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [header, setHeader] = useState<ReportHeader>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HEADER);
      return saved ? JSON.parse(saved) : DEFAULT_REPORT_HEADER;
    } catch {
      return DEFAULT_REPORT_HEADER;
    }
  });

  const [productMaster, setProductMaster] = useState<ProductMasterItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MASTER);
      return saved ? JSON.parse(saved) : DEFAULT_PRODUCT_MASTER;
    } catch {
      return DEFAULT_PRODUCT_MASTER;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HEADER, JSON.stringify(header));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [header]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MASTER, JSON.stringify(productMaster));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [productMaster]);

  // Active form state for capturing current item
  const [currentBarcode, setCurrentBarcode] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [mrp, setMrp] = useState<number>(0);
  const [batchNo, setBatchNo] = useState<string>('');
  const [mfgDate, setMfgDate] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');
  const [nos, setNos] = useState<number>(1);
  const [condition, setCondition] = useState<ItemCondition>('Damaged');
  const [isFoundInMaster, setIsFoundInMaster] = useState<boolean>(false);

  // Modal dialog states
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [isProductMasterOpen, setIsProductMasterOpen] = useState<boolean>(false);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DamageItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Barcode scanned / entered handler
  const handleBarcodeDetected = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    setCurrentBarcode(cleanCode);

    // Look up in Product Master
    const found = productMaster.find((p) => p.barcode === cleanCode);
    if (found) {
      setProductName(found.productName);
      setMrp(found.mrp);
      setIsFoundInMaster(true);
      showToast(`Identified: ${found.productName} (₹${found.mrp})`);
    } else {
      setIsFoundInMaster(false);
      showToast(`Barcode ${cleanCode} entered. Please type product name.`);
    }
  };

  // OCR applied handler
  const handleApplyOcr = (result: { batchNo: string; mfgDate: string; expDate: string }) => {
    if (result.batchNo) setBatchNo(result.batchNo);
    if (result.mfgDate) setMfgDate(result.mfgDate);
    if (result.expDate) setExpDate(result.expDate);
    showToast('Batch & Date details applied from package scan');
  };

  // Add Item to Report
  const handleAddToReport = (andContinueScanning: boolean = false) => {
    if (!productName.trim()) {
      alert('Please enter or scan a product name');
      return;
    }
    if (nos <= 0) {
      alert('NOS / Quantity must be at least 1');
      return;
    }

    const newItem: DamageItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sn: items.length + 1,
      barcode: currentBarcode,
      productName: productName.trim(),
      mrp: Number(mrp) || 0,
      batchNo: batchNo.trim(),
      mfgDate: mfgDate.trim(),
      expDate: expDate.trim(),
      nos: Number(nos) || 1,
      condition,
      createdAt: new Date().toISOString(),
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    playScanBeep();

    // Auto-save new product to Product Master if not existing
    if (currentBarcode.trim() && !isFoundInMaster) {
      const exists = productMaster.some((p) => p.barcode === currentBarcode.trim());
      if (!exists) {
        setProductMaster((prev) => [
          {
            barcode: currentBarcode.trim(),
            productName: productName.trim(),
            mrp: Number(mrp) || 0,
          },
          ...prev,
        ]);
      }
    }

    showToast(`Added row #${newItem.sn}: ${newItem.productName} (${newItem.nos} pcs)`);

    // Reset current item fields
    resetActiveItemFields();

    // If worker opted to continue scanning, re-open camera scanner
    if (andContinueScanning) {
      setTimeout(() => {
        setIsScannerOpen(true);
      }, 150);
    }
  };

  const resetActiveItemFields = () => {
    setCurrentBarcode('');
    setProductName('');
    setMrp(0);
    setBatchNo('');
    setMfgDate('');
    setExpDate('');
    setNos(1);
    setCondition('Damaged');
    setIsFoundInMaster(false);
  };

  // Edit / Save an existing row
  const handleSaveEditedItem = (updated: DamageItem) => {
    const newItems = items.map((item) => (item.id === updated.id ? updated : item));
    setItems(newItems);
    showToast(`Updated item #${updated.sn}`);
  };

  // Delete an existing row and re-number SNs
  const handleDeleteItem = (id: string) => {
    const remaining = items.filter((item) => item.id !== id);
    const renumbered = remaining.map((item, idx) => ({
      ...item,
      sn: idx + 1,
    }));
    setItems(renumbered);
    showToast('Row removed from report');
  };

  // Clear all items with confirmation
  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all rows in this report?')) {
      setItems([]);
      showToast('Report cleared');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    if (items.length === 0) {
      alert('No items to export. Scan or add items first.');
      return;
    }
    exportDamageReportToExcel(header, items);
    showToast('Excel (.xlsx) file downloaded successfully!');
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      alert('No items to export. Scan or add items first.');
      return;
    }
    exportDamageReportToCSV(header, items);
    showToast('CSV report file downloaded');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        itemCount={items.length}
        onOpenProductMaster={() => setIsProductMasterOpen(true)}
        onOpenHeaderModal={() => setIsHeaderModalOpen(true)}
        onStartNewItem={() => {
          setIsScannerOpen(true);
        }}
      />

      {/* Floating Toast Notice */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 border border-emerald-500/60 shadow-2xl rounded-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-emerald-300 animate-in fade-in slide-in-from-top-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* Godown Quick Action Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-800/30 rounded-2xl p-4">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Godown Damage &amp; Expiry Goods Data Capture</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                No Stock Balance
              </span>
            </h2>
            <p className="text-xs text-neutral-400">
              Direct Godown workflow: Scan barcode &rarr; Identify &rarr; Snap batch &amp; dates &rarr; Enter NOS &rarr; Export Excel (.xlsx)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-open-workflow-guide"
              onClick={() => setIsGuideModalOpen(true)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>App Guide</span>
            </button>

            <button
              id="btn-hero-scan-barcode"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition"
            >
              <Camera className="h-4 w-4" />
              <span>Scan Barcode</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Item Capture Card */}
        <ItemCaptureCard
          currentBarcode={currentBarcode}
          productName={productName}
          mrp={mrp}
          batchNo={batchNo}
          mfgDate={mfgDate}
          expDate={expDate}
          nos={nos}
          condition={condition}
          isFoundInMaster={isFoundInMaster}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenOcr={() => setIsOcrOpen(true)}
          onChangeBarcode={(val) => {
            setCurrentBarcode(val);
            const found = productMaster.find((p) => p.barcode === val.trim());
            if (found) {
              setProductName(found.productName);
              setMrp(found.mrp);
              setIsFoundInMaster(true);
            } else {
              setIsFoundInMaster(false);
            }
          }}
          onChangeProductName={(val) => setProductName(val)}
          onChangeMrp={(val) => setMrp(val)}
          onChangeBatchNo={(val) => setBatchNo(val)}
          onChangeMfgDate={(val) => setMfgDate(val)}
          onChangeExpDate={(val) => setExpDate(val)}
          onChangeNos={(val) => setNos(val)}
          onChangeCondition={(cond) => setCondition(cond)}
          onAddToReport={handleAddToReport}
          onResetActiveItem={resetActiveItemFields}
        />

        {/* Captured Items Report Table & Excel Export */}
        <ReportTableView
          header={header}
          items={items}
          onEditHeader={() => setIsHeaderModalOpen(true)}
          onEditItem={(item) => setEditingItem(item)}
          onDeleteItem={handleDeleteItem}
          onClearAll={handleClearAll}
          onExportExcel={handleExportExcel}
          onExportCSV={handleExportCSV}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-4 px-4 text-center text-xs text-neutral-500">
        <p>
          GodownScan &bull; Godown Damage &amp; Expiry Goods Data Capture &amp; Excel Reporting &bull; No inventory balances maintained
        </p>
      </footer>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />

      <BatchDateOcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        productName={productName || currentBarcode || 'Item'}
        onApplyOcr={handleApplyOcr}
      />

      <ProductMasterModal
        isOpen={isProductMasterOpen}
        onClose={() => setIsProductMasterOpen(false)}
        products={productMaster}
        onSaveProducts={(updated) => setProductMaster(updated)}
      />

      <ReportHeaderModal
        isOpen={isHeaderModalOpen}
        onClose={() => setIsHeaderModalOpen(false)}
        header={header}
        onSaveHeader={(updated) => {
          setHeader(updated);
          showToast('Dispatch header saved');
        }}
      />

      <EditItemModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEditedItem}
        onDelete={handleDeleteItem}
      />

      <FeatureGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
