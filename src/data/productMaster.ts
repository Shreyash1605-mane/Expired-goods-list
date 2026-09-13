import { ProductMasterItem } from '../types';

export const DEFAULT_PRODUCT_MASTER: ProductMasterItem[] = [
  {
    barcode: "8901234567890",
    productName: "KitKat 45g",
    mrp: 25,
    category: "Confectionery",
  },
  {
    barcode: "8901234567891",
    productName: "Munch 10g",
    mrp: 10,
    category: "Confectionery",
  },
  {
    barcode: "8901030012345",
    productName: "Maggi 2-Minute Noodles 70g",
    mrp: 14,
    category: "Instant Food",
  },
  {
    barcode: "8901063012345",
    productName: "Parle-G Gold Biscuits 100g",
    mrp: 10,
    category: "Biscuits",
  },
  {
    barcode: "8901725181234",
    productName: "Amul Gold Milk Powder 500g",
    mrp: 240,
    category: "Dairy",
  },
  {
    barcode: "8901030789012",
    productName: "Nescafe Classic Coffee 50g",
    mrp: 185,
    category: "Beverages",
  },
  {
    barcode: "8901314567890",
    productName: "Colgate Strong Teeth 100g",
    mrp: 65,
    category: "Oral Care",
  },
  {
    barcode: "8901058850029",
    productName: "Dettol Original Soap 75g",
    mrp: 42,
    category: "Personal Care",
  },
  {
    barcode: "8901030383838",
    productName: "Britannia Good Day Butter 120g",
    mrp: 35,
    category: "Biscuits",
  },
  {
    barcode: "8901803001122",
    productName: "Tata Salt Vacuum Evaporated 1kg",
    mrp: 28,
    category: "Grocery",
  },
  {
    barcode: "8906014411122",
    productName: "Haldiram Aloo Bhujia 200g",
    mrp: 60,
    category: "Snacks",
  },
  {
    barcode: "8901207010203",
    productName: "Cadbury Dairy Milk Silk 60g",
    mrp: 85,
    category: "Confectionery",
  },
  {
    barcode: "8901499009801",
    productName: "Aashirvaad Shudh Chakki Atta 5kg",
    mrp: 260,
    category: "Grocery",
  },
  {
    barcode: "8901030382900",
    productName: "Surf Excel Easy Wash 1kg",
    mrp: 145,
    category: "Detergent",
  }
];

export const DEFAULT_REPORT_HEADER = {
  company: "SHREE BALAJI LOGISTICS & GODOWN SERVICES",
  reportTitle: "GODOWN DAMAGE & EXPIRY GOODS RETURN REPORT",
  partyName: "Metro Cash & Carry India Pvt. Ltd.",
  town: "Central Godown, Sector 9",
  date: new Date().toISOString().split("T")[0],
  vehicleNo: "MH 12 AB 3456",
  driverName: "Ramesh Kumar",
  driverSign: "Ramesh (Verified)",
  preparedBy: "Godown Supervisor",
};
