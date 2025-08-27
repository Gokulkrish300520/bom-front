"use client";

import { useEffect, useMemo, useState } from "react";
import { Bill, BillItem, Vendor } from "./types";
import { storage } from "./storage";
import VendorModal from "./VendorModel";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (bill: Bill) => void;
};

type FileBlob = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
};

const btnGreen = "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2";
const input = "border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500";

export default function NewBillDrawer({ open, onClose, onSaved }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);

  // bill fields
  const [billNo, setBillNo] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>("");
  const [vendorId, setVendorId] = useState("");
  const [status, setStatus] = useState<Bill["status"]>("PAID");
  const [notes, setNotes] = useState("");

  // attachments
  const [files, setFiles] = useState<FileBlob[]>([]);

  // items
  const [items, setItems] = useState<(BillItem & { desc?: string; taxPct?: number })[]>([
    { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 },
  ]);

  useEffect(() => setVendors(storage.getVendors()), [open]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0),
    [items]
  );
  const taxTotal = useMemo(
    () => items.reduce((sum, it) => sum + ((Number(it.qty) || 0) * (Number(it.rate) || 0)) * ((Number(it.taxPct) || 0) / 100), 0),
    [items]
  );
  const total = subtotal + taxTotal;

  const addRow = () =>
    setItems((rows) => [...rows, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 }]);

  const removeRow = (id: string) =>
    setItems((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));

  const updateRow = (id: string, field: keyof (BillItem & { desc?: string; taxPct?: number }), value: string | number) =>
    setItems((rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: field === "name" || field === "desc" ? String(value) : Number(value) } : r))
    );

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files;
    if (!f) return;
    const toRead = Array.from(f).slice(0, Math.max(0, 10 - files.length));
    const read = await Promise.all(
      toRead.map(
        (file) =>
          new Promise<FileBlob>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () =>
              res({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, dataUrl: String(reader.result) });
            reader.onerror = rej;
            reader.readAsDataURL(file);
          })
      )
    );
    setFiles((prev) => [...prev, ...read]);
    e.currentTarget.value = "";
  };
  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const submit = () => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return alert("Please select a vendor (or create one).");
    if (!billNo.trim()) return alert("Bill # is required.");

    const cleanItems = items
      .map((i) => ({ ...i, qty: Number(i.qty) || 0, rate: Number(i.rate) || 0, taxPct: Number(i.taxPct) || 0 }))
      .filter((i) => i.name.trim() && i.qty > 0);

    const baseBill: Bill = {
      id: crypto.randomUUID(),
      billNo: billNo.trim(),
      date,
      dueDate: dueDate || undefined,
      vendorId,
      vendorSnapshot: vendor,
      referenceNumber: referenceNumber || undefined,
      status,
      notes: notes || undefined,
      items: cleanItems.map(({ id, name, qty, rate }) => ({ id, name, qty, rate })),
      amount: subtotal,
      tax: taxTotal,
      total,
      balanceDue: total,
    };

    // keep attachments and extra item fields under meta (still fully persisted)
    const billWithMeta = {
      ...baseBill,
      meta: {
        files,
        itemsExtended: cleanItems, // includes description + taxPct
      },
    } as unknown as Bill;

    storage.addBill(billWithMeta);
    onSaved(billWithMeta);
    onClose();

    // reset minimal
    setBillNo(""); setReferenceNumber(""); setVendorId(""); setNotes("");
    setItems([{ id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 }]);
    setFiles([]);
  };

  if (!open) return null;

  return (
    <>
      <VendorModal
        open={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onCreated={(v) => {
          setVendors(storage.getVendors());
          setVendorId(v.id);
        }}
      />

      <div className="fixed inset-0 z-40">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute top-0 right-0 w-full h-full max-w-5xl p-6 overflow-y-auto bg-white shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-emerald-700">Create New Bill</h2>
            <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200">Close</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Vendor</label>
              <div className="flex gap-2">
                <select className={`${input} w-full`} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setShowVendorModal(true)}
                        className="px-3 border whitespace-nowrap rounded-xl bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100">
                  + New Vendor
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Bill #</label>
              <input className={input} value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="e.g. B-1001" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Reference #</label>
              <input className={input} value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Status</label>
              <select className={input} value={status} onChange={(e) => setStatus(e.target.value as Bill["status"])}>
                <option value="PAID">PAID</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Bill Date</label>
              <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-gray-600">Due Date</label>
              <input type="date" className={input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Items */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-emerald-700">Items</h3>
              <button type="button" onClick={addRow} className={`${btnGreen}`}>+ Add Item</button>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="min-w-[900px] w-full">
                <thead className="bg-emerald-50">
                  <tr className="text-sm text-left text-emerald-800">
                    <th className="p-3">Item</th>
                    <th className="w-64 p-3">Description</th>
                    <th className="w-24 p-3">Qty</th>
                    <th className="p-3 w-28">Rate</th>
                    <th className="p-3 w-28">Tax %</th>
                    <th className="w-32 p-3">Amount</th>
                    <th className="w-12 p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const amt = (Number(it.qty) || 0) * (Number(it.rate) || 0) * (1 + ((Number(it.taxPct) || 0) / 100));
                    return (
                      <tr key={it.id} className="border-t">
                        <td className="p-2">
                          <input className={`${input} w-full`} placeholder="Item name"
                            value={it.name} onChange={(e) => updateRow(it.id, "name", e.target.value)} />
                        </td>
                        <td className="p-2">
                          <input className={`${input} w-full`} placeholder="Description"
                            value={it.desc || ""} onChange={(e) => updateRow(it.id, "desc", e.target.value)} />
                        </td>
                        <td className="p-2">
                          <input type="number" min={0} className={`${input} w-full`}
                            value={it.qty} onChange={(e) => updateRow(it.id, "qty", e.target.value)} />
                        </td>
                        <td className="p-2">
                          <input type="number" min={0} step="0.01" className={`${input} w-full`}
                            value={it.rate} onChange={(e) => updateRow(it.id, "rate", e.target.value)} />
                        </td>
                        <td className="p-2">
                          <input type="number" min={0} step="0.01" className={`${input} w-full`}
                            value={it.taxPct ?? 0} onChange={(e) => updateRow(it.id, "taxPct", e.target.value)} />
                        </td>
                        <td className="p-2">₹ {amt.toFixed(2)}</td>
                        <td className="p-2">
                          <button type="button" onClick={() => removeRow(it.id)}
                            className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200">×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attachments */}
          <div className="mt-6">
            <h4 className="mb-2 font-semibold text-emerald-700">Attachments</h4>
            <div className="flex flex-wrap items-center gap-3">
              <label className="px-3 py-2 border cursor-pointer rounded-xl border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                Upload Files
                <input type="file" className="hidden" multiple onChange={onPickFiles} />
              </label>
              {files.map((f) => (
                <span key={f.id} className="flex items-center gap-2 px-2 py-1 text-sm bg-gray-100 rounded-xl">
                  {f.name}
                  <button onClick={() => removeFile(f.id)} className="text-gray-500 hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Notes & Totals */}
          <div className="grid gap-6 mt-6 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm text-gray-600">Notes</label>
              <textarea className={`${input} w-full`} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl h-fit">
              <div className="flex justify-between py-1">
                <span>Subtotal</span>
                <span>₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Tax</span>
                <span>₹ {taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 mt-2 font-semibold border-t text-emerald-800">
                <span>Total</span>
                <span>₹ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button onClick={submit} className={btnGreen}>Save Bill</button>
          </div>
        </div>
      </div>
    </>
  );
}