"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface Vendor {
  id: number;
  display_name: string;
}

interface Deal {
  id: number;
  deal_no: string;
}

interface FreightRow {
  item_name: string;
  description: string;
  item_specification: string;
  hsn_code: string;
  brand: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  sf_number?: string;
  weight?: string;
  freight_type?: string;
}

export default function NewFreightPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState(83); // default USD → INR
  const [rows, setRows] = useState<FreightRow[]>([
    {
      item_name: "",
      description: "",
      item_specification: "",
      hsn_code: "",
      brand: "",
      quantity: 0,
      unit_price: 0,
      sf_number: "",
      weight: "",
      freight_type: "",
    },
  ]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedDeal, setSelectedDeal] = useState("");
  const [date, setDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sample exchange rates (could later be fetched dynamically)
  const exchangeRates: Record<string, number> = {
    USD: 1,
    INR: 83,
    EUR: 0.93,
  };

  useEffect(() => {
    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/")
      .then((res) => res.json())
      .then((data) => setVendors(data.results || []))
      .catch(() => toast.error("Failed to fetch vendors"));

    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/")
      .then((res) => res.json())
      .then((data) => setDeals(data.results || []))
      .catch(() => toast.error("Failed to fetch deals"));
  }, []);

  // 🔁 When currency changes, automatically adjust all item prices
  useEffect(() => {
    const rate = exchangeRates[currency] || 1;
    setExchangeRate(rate);

    setRows((prevRows) =>
      prevRows.map((r) => ({
        ...r,
        unit_price: parseFloat((r.unit_price * rate).toFixed(2)),
        total_price: parseFloat((r.quantity * r.unit_price * rate).toFixed(2)),
      }))
    );
  }, [currency]);

  const handleRowChange = (index: number, field: keyof FreightRow, value: string | number) => {
    setRows((prev) => {
      const updated = [...prev];
      const newVal = ["quantity", "unit_price"].includes(field) ? Number(value) || 0 : value;
      updated[index] = { ...updated[index], [field]: newVal };

      const row = updated[index];
      updated[index].total_price = Number((row.quantity * row.unit_price).toFixed(2));
      return updated;
    });
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        item_name: "",
        description: "",
        item_specification: "",
        hsn_code: "",
        brand: "",
        quantity: 0,
        unit_price: 0,
        sf_number: "",
        weight: "",
        freight_type: "",
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVendor || !selectedDeal || !date) {
      toast.error("Vendor, Deal, and Date are required!");
      return;
    }

    const payload = {
      vendor_id: Number(selectedVendor),
      deal_id: Number(selectedDeal),
      date,
      currency,
      items: rows.map(({ total_price, ...item }) => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    };

    setIsSaving(true);
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/freights/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }

      toast.success("Freight records saved successfully!");
      router.push("/books/purchase/freight");
    } catch (error) {
      toast.error("Error saving freight records!");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <Breadcrumb />
      <h1 className="mb-6 text-2xl font-bold text-green-700">Create Freights</h1>

      <form onSubmit={handleSubmit} className="p-6 rounded shadow bg-green-50">
        {/* Top Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="font-medium text-green-800">Vendor *</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium text-green-800">Deal *</label>
            <select
              value={selectedDeal}
              onChange={(e) => setSelectedDeal(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Deal</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deal_no}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium text-green-800">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="font-medium text-green-800">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {Object.keys(exchangeRates).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto mb-6">
          <table className="w-full border-collapse border border-green-300">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="border px-3 py-2">Item</th>
                <th className="border px-3 py-2">Description</th>
                <th className="border px-3 py-2">Specification</th>
                <th className="border px-3 py-2">HSN</th>
                <th className="border px-3 py-2">Brand</th>
                <th className="border px-3 py-2">Qty</th>
                <th className="border px-3 py-2">Unit Price ({currency})</th>
                <th className="border px-3 py-2">Total ({currency})</th>
                <th className="border px-3 py-2">SF No.</th>
                <th className="border px-3 py-2">Weight</th>
                <th className="border px-3 py-2">Freight</th>
                <th className="border px-3 py-2 text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-green-50">
                  {["item_name", "description", "item_specification", "hsn_code", "brand"].map(
                    (field) => (
                      <td key={field} className="border px-2 py-1">
                        <input
                          type="text"
                          className="w-full p-1 border rounded"
                          value={(row as any)[field]}
                          onChange={(e) =>
                            handleRowChange(i, field as keyof FreightRow, e.target.value)
                          }
                        />
                      </td>
                    )
                  )}
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="w-full p-1 border rounded text-right"
                      value={row.quantity}
                      onChange={(e) => handleRowChange(i, "quantity", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      className="w-full p-1 border rounded text-right"
                      value={row.unit_price}
                      onChange={(e) => handleRowChange(i, "unit_price", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1 text-right">{row.total_price?.toFixed(2) || "0.00"}</td>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={row.sf_number}
                      onChange={(e) => handleRowChange(i, "sf_number", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={row.weight}
                      onChange={(e) => handleRowChange(i, "weight", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={row.freight_type}
                      onChange={(e) => handleRowChange(i, "freight_type", e.target.value)}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-red-600 hover:text-red-800"
                      >
                        X
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center px-4 py-2 mb-4 text-green-700 border border-green-500 rounded hover:bg-green-100"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Row
        </button>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/books/purchase/freight")}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`px-4 py-2 text-white rounded ${
              isSaving ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSaving ? "Saving..." : "Save Freights"}
          </button>
        </div>
      </form>
    </div>
  );
}
