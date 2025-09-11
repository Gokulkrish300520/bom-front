// bills/component/types.ts
export type BillStatus = "PAID" | "UNPAID" | "PARTIAL" | "DRAFT" | string;

export interface VendorSnapshot {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  // allow extra
  [key: string]: any;
}

export interface BillMeta {
  itemsExtended?: any[];
  files?: { id?: string; name?: string }[];
  [k: string]: any;
}

export interface Bill {
  id: string;

  // date / identifiers (support both snake_case and camelCase)
  billDate?: string;
  bill_date?: string;
  billNumber?: string;
  bill_number?: string;
  billNo?: string;
  date?: string;

  referenceNumber?: string;
  reference_number?: string;

  dueDate?: string;
  due_date?: string;

  // vendor: sometimes API returns vendorId, sometimes a vendor object or snapshot
  vendorId?: string;
  vendor?: VendorSnapshot | string | null;
  vendorSnapshot?: VendorSnapshot | null;

  // amounts (both naming styles)
  totalAmount?: number;
  total_amount?: number;
  subtotal?: number;
  amount?: number;
  tax?: number;
  total?: number;
  balanceDue?: number;
  balance_due?: number;

  // status
  status?: BillStatus;

  // items / meta
  items?: any[];
  meta?: BillMeta;

  notes?: string;

  // allow other fields
  [key: string]: any;
}
