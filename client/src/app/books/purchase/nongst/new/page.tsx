
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface Row {
  item_name: string;
  description: string;
  item_specification: string;
  hsn_code: string;
  brand: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}
interface Vendor {
  id: string;
  display_name: string;
}

interface Deal {
  id: string;
  deal_no: string;
}

export default function NewImportBill() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [rows, setRows] = useState<Row[]>([
    {
      item_name: "",
      description: "",
      item_specification: "",
      hsn_code: "",
      brand: "",
      quantity: 0,
      unit_price: 0,
      total_price: 0,

    },
  ]);
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  const [exchangeRates] = useState<Record<string, number>>({
    USD: 1,
    INR: 83,
    EUR: 0.92,
    GBP: 0.8,
    JPY: 114,
  });

  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [billUpload, setBillUpload] = useState<File | null>(null);
  const [paymentRequest, setPaymentRequest] = useState("Low");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [paidBy, setPaidBy] = useState("SBI");
  const [paymentRef, setPaymentRef] = useState("");

  function formatErrors(errors: any, prefix = ''): string {
  if (typeof errors === 'string') {
    return prefix ? `${prefix}: ${errors}` : errors;
  }
  if (Array.isArray(errors)) {
    return errors
      .map((err, idx) => {
        if (typeof err === 'string') return prefix ? `${prefix}: ${err}` : err;
        return formatErrors(err, `${prefix}[${idx + 1}]`);
      })
      .join('\n');
  }
  if (typeof errors === 'object' && errors !== null) {
    return Object.entries(errors)
      .map(([key, val]) => formatErrors(val, prefix ? `${prefix} > ${key}` : key))
      .join('\n');
  }
  return String(errors);
}


  useEffect(() => {
    fetchVendors();
    fetchDeals();
  }, []);

  async function fetchVendors() {
    const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/");
    const data = await res.json();
    setVendors(data.results);
  }

  async function fetchDeals() {
    const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals");
    const data = await res.json();
    setDeals(data.results);
  }

  const handleCurrencyChange = (newCurrency: string) => {
    const oldRate = exchangeRates[currency]; // old currency rate
  const newRate = exchangeRates[newCurrency]; // new currency rate
    setCurrency(newCurrency);
    const rate = exchangeRates[newCurrency];
    setRows((oldRows) =>
      oldRows.map((row) => {
        const unitPriceBase = row.unit_price / oldRate;
        const newUnitPrice = unitPriceBase * rate;
        const newTotal = newUnitPrice * row.quantity;
        return { ...row, unit_price: newUnitPrice, total_price: newTotal };
      })
    );
  };

  const handleRowChange = (index: number, field: keyof Row, value: string | number) => {
    setRows((oldRows) => {
      const newRows = [...oldRows];
      let val: any = value;
      if (field === "quantity" || field === "unit_price") {
        val = Number(value);
        if (isNaN(val) || val < 0) val = 0;
      }
      newRows[index] = { ...newRows[index], [field]: val };
      newRows[index].total_price = newRows[index].unit_price * newRows[index].quantity;
      return newRows;
    });
  };
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
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
        total_price: 0,
      },
    ]);
  };

  const totalAmount = rows.reduce((sum, row) => sum + row.total_price, 0);

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !selectedDeal || !invoiceDate) {
      toast.error("Vendor, Deal, and Date are required!");
      return;
    }

    const payload = {
      vendor_id: selectedVendor,
      deal_id: selectedDeal,
      date: invoiceDate,
      currency,
      payment_request: paymentRequest,
      payment_reference_no: paymentRef,
      payment_status: paymentStatus,
      paid_by: paidBy,
      items: rows.map((r) => ({
        ...r,
        quantity: Number(r.quantity),
        unit_price: Number(r.unit_price),
      })),
    };
    setSaving(true);
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/nongsts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Non-Gst Bill Created Successfully");
        router.push("/books/purchase/nongst");
      } else {
        const errData = await res.json();
        const errorMessage = formatErrors(errData);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    }finally {
      setSaving(false);
    }
    
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-md shadow-md">
      <div>
        <Breadcrumb/>
      <h1 className="text-3xl font-semibold text-green-700 mb-6">New Non-GST Bill</h1>
    </div>
      <div className="mb-4">
        <label className="mr-4 font-semibold text-green-700">Currency: </label>
        <select
          className="border border-green-400 rounded p-2"
          value={currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
        >
          {Object.entries(currencySymbols).map(([code, symbol]) => (
            <option key={code} value={code}>
              {code} ({symbol})
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <select
            required
            className="border border-green-400 rounded p-2"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
          >
            <option value="">Select Vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.display_name}
              </option>
            ))}
          </select>

          <select
            required
            className="border border-green-400 rounded p-2"
            value={selectedDeal}
            onChange={(e) => setSelectedDeal(e.target.value)}
          >
            <option value="">Select Deal</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.deal_no}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="mr-4 font-semibold text-green-700" >Invoice Date</label>
          <input type="date" className="border border-green-400 ml-4 rounded p-2" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
        </div>

        {/* Bill Upload, Payment Info, Table etc. remain same */}
        {/* Just make sure row fields match your interface keys */}

        <div className="mt-5 mb-4">
        <label className="block text-sm font-medium text-green-700 mb-2">Bill Upload (PDF)</label>
        <div className="flex items-center space-x-4">
          <label htmlFor="bill-upload" className="cursor-pointer bg-green-600 hover:bg-green-700 text-white rounded py-2 px-4 font-semibold transition">
            Select File
          </label>
          <span className="text-gray-700 italic">
            {billUpload ? billUpload.name : "No file selected"}
          </span>
        </div>
        <input
          id="bill-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setBillUpload(e.target.files?.[0] || null)}
        />
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
          <label className="block mb-1 text-green-700 font-semibold" htmlFor="paymentRequest">Payment Request</label>
          <select value={paymentRequest} onChange={(e) => setPaymentRequest(e.target.value)} className="border border-green-400 rounded p-2">
            <option value="Low">Low</option>
            <option value="High">High</option>
          </select>
          </div>

          <div>
          <label className="block mb-1 text-green-700 font-semibold" htmlFor="paymentRequest">Payment Status</label>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="border border-green-400 rounded p-2">
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
          </div>

          <div>
          <label className="block mb-1 text-green-700 font-semibold" htmlFor="paymentRequest">Paid by</label>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="border border-green-400 rounded p-2">
            <option value="SBI">SBI</option>
            <option value="IOB">IOB</option>
            <option value="ICICI">ICICI</option>
            <option value="Petty Cash">Petty Cash</option>
          </select>
          </div>
        </div>
        
        <label className="block mt-2 mb-1 text-green-700 font-semibold" htmlFor="paymentRequest">Payment Reference Number</label>
        <input
          type="text"
          value={paymentRef}
          onChange={(e) => setPaymentRef(e.target.value)}
          placeholder="Payment Reference Number"
          className="border border-green-400 rounded p-2 mb-4 w-full"
        />

        <div className="overflow-auto">
          <table className="w-full min-w-max border-collapse border border-green-200">
            <thead className="bg-green-100 text-green-800">
              <tr>
                <th className="border border-green-300 px-3 py-2 text-left">Item</th>
                <th className="border border-green-300 px-3 py-2 text-left">Description</th>
                <th className="border border-green-300 px-3 py-2 text-left">Specification</th>
                <th className="border border-green-300 px-3 py-2 text-left">HSN</th>
                <th className="border border-green-300 px-3 py-2 text-left">Brand</th>
                <th className="border border-green-300 px-3 py-2 text-right">Qty</th>
                <th className="border border-green-300 px-3 py-2 text-right">Unit Price ({currency})</th>
                <th className="border border-green-300 px-3 py-2 text-right">Total ({currency})</th>
                <th className="border border-green-300 px-3 py-2 text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-green-50 transition">
                  <td className="border border-green-300 px-2 py-1">
                    <input
                      type="text"
                      className="w-full px-1 py-1 border border-green-200 rounded"
                      value={row.item_name}
                      onChange={(e) => handleRowChange(idx, "item_name", e.target.value)}
                    />
                  </td>
                  <td className="border border-green-300 px-2 py-1">
                    <input
                      type="text"
                      className="w-full px-1 py-1 border border-green-200 rounded"
                      value={row.description}
                      onChange={(e) => handleRowChange(idx, "description", e.target.value)}
                    />
                  </td>
                  <td className="border border-green-300 px-2 py-1">
                    <input
                      type="text"
                      className="w-full px-1 py-1 border border-green-200 rounded"
                      value={row.item_specification}
                      onChange={(e) => handleRowChange(idx, "item_specification", e.target.value)}
                    />
                  </td>
                  <td className="border border-green-300 px-2 py-1">
                    <input
                      type="text"
                      className="w-full px-1 py-1 border border-green-200 rounded"
                      value={row.hsn_code}
                      onChange={(e) => handleRowChange(idx, "hsn_code", e.target.value)}
                    />
                  </td>
                  <td className="border border-green-300 px-2 py-1">
                    <input
                      type="text"
                      className="w-full px-1 py-1 border border-green-200 rounded"
                      value={row.brand}
                      onChange={(e) => handleRowChange(idx, "brand", e.target.value)}
                    />
                  </td>
                  <td className="border border-green-300 px-2 py-1 text-right">
                    <input
                      type="number"
                      className="w-full px-1 py-1 border border-green-200 rounded"
                      value={row.quantity}
                      min={0}
                      onChange={(e) => handleRowChange(idx, "quantity", Number(e.target.value))}
                    />
                  </td>
                  <td className="border border-green-300 px-2 py-1 text-right">
                    <input
                      type="number"
                      className="w-full px-1 py-1 border border-green-200 rounded"
                      value={row.unit_price}
                      min={0}
                      onChange={(e) => handleRowChange(idx, "unit_price", Number(e.target.value))}
                    />
                    <div className="text-xs mt-1 text-gray-500">{currency} ({currencySymbols[currency]})</div>
                  </td>
                  <td className="border border-green-300 px-2 py-1 text-right font-semibold">
                    {row.total_price.toFixed(2)} {currency}
                  </td>
                  <td className="border border-green-300 px-2 py-1 text-center">
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(idx)} className="text-red-600 hover:text-red-800">
                        X
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" className="mt-2 mb-6 px-4 py-2 rounded bg-green-200 text-green-700 hover:bg-green-300 flex items-center gap-2" onClick={() => addRow()}>
          <Plus size={16} /> Add Row
        </button>

        <div className="text-right text-lg font-bold mb-6">
          Total Amount: {currency} {totalAmount.toFixed(2)}
        </div>

        <div className="flex justify-end space-x-6">
          <button
            type="button"
            onClick={() => router.push("/books/purchase/nongst")}
            className="px-6 py-2 rounded border hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

