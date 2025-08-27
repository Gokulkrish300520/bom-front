export type Vendor = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type BillItem = {
  id: string;
  name: string;
  qty: number;
  rate: number;
};

export type Bill = {
  id: string;
  billNo: string;
  date: string;
  dueDate?: string;
  vendorId: string;
  vendorSnapshot: Vendor; // snapshot at creation
  referenceNumber?: string;
  status: "DRAFT" | "PAID" | "UNPAID" | "PARTIAL";
  notes?: string;
  items: BillItem[];
  amount: number;     // subtotal
  tax?: number;       // optional tax total
  total: number;      // amount + tax
  balanceDue: number; // computed from total - payments (payments omitted here)
};