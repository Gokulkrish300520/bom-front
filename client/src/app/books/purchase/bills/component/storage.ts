// Local storage helpers (namespaced) for bills & vendors + attachments.

import { Bill, Vendor } from "./types";

const K = {
  BILLS: "glx_bills",
  VENDORS: "glx_vendors",
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  // Bills
  getBills(): Bill[] {
    return safeRead<Bill[]>(K.BILLS, []);
  },
  setBills(bills: Bill[]) {
    safeWrite(K.BILLS, bills);
  },
  addBill(b: Bill): Bill {
    const all = storage.getBills();
    const next = [b, ...all];
    storage.setBills(next);
    return b;
  },

  // Vendors
  getVendors(): Vendor[] {
    return safeRead<Vendor[]>(K.VENDORS, []);
  },
  setVendors(vendors: Vendor[]) {
    safeWrite(K.VENDORS, vendors);
  },
  upsertVendor(v: Vendor): Vendor {
    const all = storage.getVendors();
    const idx = all.findIndex((x) => x.id === v.id);
    const next = idx >= 0 ? [...all.slice(0, idx), v, ...all.slice(idx + 1)] : [v, ...all];
    storage.setVendors(next);
    return v;
  },
};