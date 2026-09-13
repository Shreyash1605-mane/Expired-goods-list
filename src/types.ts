export type ItemCondition = 'Normal' | 'Seal Open' | 'Damaged' | 'Expired';

export interface DamageItem {
  id: string;
  sn: number;
  barcode: string;
  productName: string;
  mrp: number;
  batchNo: string;
  mfgDate: string;
  expDate: string;
  nos: number;
  condition: ItemCondition;
  notes?: string;
  createdAt: string;
}

export interface ReportHeader {
  company: string;
  reportTitle: string;
  partyName: string;
  town: string;
  date: string;
  vehicleNo: string;
  driverName: string;
  driverSign: string;
  preparedBy: string;
}

export interface ProductMasterItem {
  barcode: string;
  productName: string;
  mrp: number;
  category?: string;
}

export interface OCRResult {
  batchNo: string;
  mfgDate: string;
  expDate: string;
  barcode?: string;
  confidenceNotes?: string;
  rawTextFound?: string;
  source?: string;
  message?: string;
  success?: boolean;
  error?: string;
}
