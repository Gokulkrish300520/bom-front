"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

type Vendor = { id: string; display_name: string };
type Deal = { id: string; deal_no: string };

interface DutyItemRow {
  item: string;
  description: string;
  item_specification: string;
  hsn_code: string;
  brand: string;
  quantity: number;
  unit_price: number;
  assessable_value: number;
  igst: number;
  social_welfare: number;
  cess: number;
  duty_amount: number;
  addl_duty: number;
}

export default function NewDutyImportBill() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currency, setCurrency] = useState("INR");

  const [rows, setRows] = useState<DutyItemRow[]>([
    {
      item: "",
      description: "",
      item_specification: "",
      hsn_code: "",
      brand: "",
      quantity: 0,
      unit_price: 0,
      assessable_value: 0,
      igst: 0,
      social_welfare: 0,
      cess: 0,
      duty_amount: 0,
      addl_duty: 0,
    },
  ]);

  const [form, setForm] = useState({
    vendorId: "",
    dealId: "",
    date: "",
    airway_bill: "",
    paymentRequest: "Low",
    paymentStatus: "Unpaid",
    paidBy: "SBI",
    paymentRef: "",
  });

  const numericFields: (keyof DutyItemRow)[] = [
    "quantity",
    "unit_price",
    "assessable_value",
    "igst",
    "social_welfare",
    "cess",
    "duty_amount",
    "addl_duty",
  ];

  useEffect(() => {
    fetchVendors();
    fetchDeals();
  }, []);

  async function fetchVendors() {
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/");
      const data = await res.json();
      setVendors(data.results || []);
    } catch {
      setVendors([]);
    }
  }

  async function fetchDeals() {
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/");
      const data = await res.json();
      setDeals(data.results || []);
    } catch {
      setDeals([]);
    }
  }

  const toNumber = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

  const handleRowChange = (index: number, field: keyof DutyItemRow, value: any) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: numericFields.includes(field) ? toNumber(value) : value,
      };
      return updated;
    });
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        item: "",
        description: "",
        item_specification: "",
        hsn_code: "",
        brand: "",
        quantity: 0,
        unit_price: 0,
        assessable_value: 0,
        igst: 0,
        social_welfare: 0,
        cess: 0,
        duty_amount: 0,
        addl_duty: 0,
      },
    ]);

  const removeRow = (i: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorId || !form.dealId || !form.date) {
      toast.error("Please fill vendor, deal, and date fields");
      return;
    }

    const dutyItemsPayload = rows.map((r) => ({
      item_name: r.item,
      description: r.description,
      item_specification: r.item_specification,
      brand: r.brand,
      hsn_code: r.hsn_code,
      quantity: +r.quantity.toFixed(2),
      unit_price: +r.unit_price.toFixed(2),
      assessable_value: +r.assessable_value.toFixed(2),
      igst: +r.igst.toFixed(2),
      social_welfare: +r.social_welfare.toFixed(2),
      cess: +r.cess.toFixed(2),
      duty_amount: +r.duty_amount.toFixed(2),
      addl_duty: +r.addl_duty.toFixed(2),
    }));

    const payload = {
      vendor_id: +form.vendorId,
      deal_id: +form.dealId,
      currency,
      date: form.date,
      payment_request: form.paymentRequest,      // <-- added
      payment_status: form.paymentStatus,        // <-- added
      paid_by: form.paidBy,                      // <-- added
      payment_reference_no: form.paymentRef,
      airway_bill: form.airway_bill || "",
      duty_items: dutyItemsPayload,
    };

    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/duties/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save duty bill");
      toast.success("Duty Import Bill Saved!");
      router.push("/books/purchase/duty");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <Breadcrumb />
      <h1 className="text-3xl font-semibold text-green-700 mb-6">New Duty Entry</h1>

      {/* --- BASIC INFO --- */}
      <div className="grid md:grid-cols-3 gap-4 mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
        <select
          name="vendorId"
          value={form.vendorId}
          onChange={handleFormChange}
          className="border p-2 rounded"
        >
          <option value="">Select Vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.display_name}
            </option>
          ))}
        </select>
        <select
          name="dealId"
          value={form.dealId}
          onChange={handleFormChange}
          className="border p-2 rounded"
        >
          <option value="">Select Deal</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.deal_no}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleFormChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="airway_bill"
          value={form.airway_bill}
          onChange={handleFormChange}
          className="border p-2 rounded"
        />
      </div>

      {/* --- ITEM TABLE --- */}
      <div className="overflow-x-auto border rounded-lg mb-6">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-green-100 text-green-900 sticky top-0">
            <tr>
              {[
                "Item",
                "Description",
                "Specification",
                "HSN",
                "Brand",
                "Qty",
                "Unit Price",
                "Assessable",
                "IGST",
                "SWS",
                "Cess",
                "Duty",
                "Addl Duty",
                "Action",
              ].map((h) => (
                <th key={h} className="border px-2 py-2 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="even:bg-green-50">
                {(["item","description","item_specification","hsn_code","brand"] as const).map((f) => (
                  <td key={f} className="border p-1">
                    <input
                      className="w-full border rounded px-1 py-1"
                      type="text"
                      value={row[f]}
                      onChange={(e) => handleRowChange(i, f, e.target.value)}
                    />
                  </td>
                ))}

                {(["quantity","unit_price","assessable_value","igst","social_welfare","cess","duty_amount","addl_duty"] as const).map((f) => (
                  <td key={f} className="border p-1">
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded px-1 py-1 text-right"
                      value={row[f]}
                      onChange={(e) => handleRowChange(i, f, e.target.value)}
                    />
                  </td>
                ))}

                <td className="border text-center">
                  <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mb-6 px-4 py-2 bg-green-200 text-green-800 rounded-lg hover:bg-green-300 flex items-center gap-2"
      >
        <Plus size={16} /> Add Item
      </button>

      {/* --- PAYMENT INFO --- */}
      <div className="grid md:grid-cols-4 gap-4 bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Payment Request</label>
          <select
            name="paymentRequest"
            value={form.paymentRequest}
            onChange={handleFormChange}
            className="border p-2 rounded w-full"
          >
            <option value="Low">Low</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Payment Status</label>
          <select
            name="paymentStatus"
            value={form.paymentStatus}
            onChange={handleFormChange}
            className="border p-2 rounded w-full"
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Paid By</label>
          <select
            name="paidBy"
            value={form.paidBy}
            onChange={handleFormChange}
            className="border p-2 rounded w-full"
          >
            <option value="SBI">SBI</option>
            <option value="IOB">IOB</option>
            <option value="ICICI">ICICI</option>
            <option value="Petty Cash">Petty Cash</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Payment Reference</label>
          <input
            type="text"
            name="paymentRef"
            value={form.paymentRef}
            onChange={handleFormChange}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* --- ACTION BUTTONS --- */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => router.push("/books/purchase/duty")}
          className="px-6 py-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}
