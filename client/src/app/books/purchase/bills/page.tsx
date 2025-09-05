"use client";

import { useEffect, useState } from "react";
import { storage } from "./component/storage";
import { Bill } from "./component/types";
import BillTable from "./component/BillTable";
import NewBillDrawer from "./component/NewBillDrawer";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setBills(storage.getBills());
  }, []);

  return (
    <div className="p-4 space-y-4 md:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl text-emerald-700">All Bills</h1>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 text-white rounded-xl bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setOpen(true)}
          >
            + New
          </button>
        </div>
      </div>

      {/* Table */}
      <BillTable bills={bills} />

      {/* Drawer for creating a bill */}
      <NewBillDrawer
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(b) => {
          const next = [b, ...storage.getBills().filter((x) => x.id !== b.id)];
          storage.setBills(next);
          setBills(next);
        }}
      />
    </div>
  );
}