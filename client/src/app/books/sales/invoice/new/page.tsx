"use client";

import { Upload, Plus, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

type CustomerType = {
  id: number;
  display_name: string;
};

type Customer = {
  id: number;
  display_name: string;
  billing_attention: string;
  billing_street1: string;
  billing_street2: string;
  billing_city: string;
  billing_state: string;
  billing_pin_code: string;
  billing_country: string;
  billing_phone: string;
  shipping_attention: string;
  shipping_street1: string;
  shipping_street2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pin_code: string;
  shipping_country: string;
  shipping_phone: string;
};

type ItemType = {
  id: number;
  name: string;
  sales_selling_price: number | string;
};

type InvoiceItem = {
  id: string;
  itemId?: number;
  name: string;
  qty: number;
  rate: number;
};

type DealType = {
  id: number;
  deal_no: string;
};

export default function InvoiceFormPage() {
  const router = useRouter();

  // Invoice fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [selectedDealId, setSelectedDealId] = useState<number | "">("");
  const [customerDeals, setCustomerDeals] = useState<DealType[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${Math.floor(Date.now() / 1000) % 100000}`
  );
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [projectName, setProjectName] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("Thanks for your business.");
  const [terms, setTerms] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(18);
  const [taxType, setTaxType] = useState<"TDS" | "TCS">("TDS");
  const [adjustment, setAdjustment] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 },
  ]);
  const [files, setFiles] = useState<File[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [itemsList, setItemsList] = useState<ItemType[]>([]);

  // Load customers and items
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/customers/");
        const data = await res.json();
        setCustomers(data.results || []);
      } catch (e) {
        // handle error
      }
    }
    async function fetchItems() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/items/");
        const data = await res.json();
        setItemsList(data.results || []);
      } catch (e) {
        // handle error
      }
    }
    fetchCustomers();
    fetchItems();
  }, []);

  // Load deals when customer is selected
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDeals([]);
      setSelectedDealId("");
      return;
    }
    async function loadCustomerDeals() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/deals/?customer_id=${selectedCustomerId}`
        );
        const data = await res.json();
        setCustomerDeals(data.results || []);
        setSelectedDealId("");
      } catch (err) {
        setCustomerDeals([]);
        setSelectedDealId("");
      }
    }
    loadCustomerDeals();
  }, [selectedCustomerId]);

  // Items Table logic
  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.length > 1 ? items.filter((item) => item.id !== id) : items);
  };

  const updateItemSelection = (id: string, itemId: number) => {
    const selectedItem = itemsList.find((item) => item.id === itemId);
    if (!selectedItem) return;
    setItems((currItems) =>
      currItems.map((item) =>
        item.id === id
          ? {
              ...item,
              itemId,
              name: selectedItem.name,
              rate: typeof selectedItem.sales_selling_price === "string"
                ? Number(selectedItem.sales_selling_price)
                : selectedItem.sales_selling_price,
            }
          : item
      )
    );
  };

  // Computed totals
  const subTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.qty * item.rate), 0),
    [items]
  );
  const discountAmount = useMemo(() => (subTotal * discountPct) / 100, [subTotal, discountPct]);
  const taxAmount = useMemo(() => {
    const base = (subTotal - discountAmount) * (taxPct / 100);
    return taxType === "TDS" ? -base : base;
  }, [subTotal, discountAmount, taxPct, taxType]);
  const total = useMemo(
    () => subTotal - discountAmount + taxAmount + adjustment,
    [subTotal, discountAmount, taxAmount, adjustment]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Save invoice handler, with POST to backend
  const saveInvoice = async (status: "DRAFT" | "SENT") => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    const payload = {
      customer_id: selectedCustomerId,
      invoice_number: invoiceNumber,
      deal_id: selectedDealId || null,
      order_number: orderNumber,
      invoice_date: invoiceDate,
      due_date: expiryDate,
      salesperson: salesPerson,
      project_name: projectName,
      subject,
      customer_notes: notes,
      terms_and_conditions: terms,
      subtotal: subTotal.toFixed(2),
      discount: discountPct.toFixed(2),
      tax_type: taxType,
      tax_percentage: taxPct.toString(),
      adjustment: adjustment.toFixed(2),
      total_amount: total.toFixed(2),
      status,
      item_details: items
        .filter((i) => i.itemId !== undefined)
        .map((i) => ({
          item_id: i.itemId,
          quantity: i.qty,
          rate: i.rate,
          amount: (i.qty * i.rate).toFixed(2),
        })),
      // handle files upload separately or via multipart form data
    };

    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/invoices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to save invoice: ${JSON.stringify(err)}`);
        return;
      }
      alert(`Invoice ${status === "SENT" ? "Sent" : "saved as DRAFT"} successfully.`);
      router.push("/books/sales/invoice");
    } catch (err) {
      alert("Error saving invoice.");
      console.error(err);
    }
  };

  // UI Render
  return (
    <div className="min-h-screen bg-green-50 p-6">
      <h1 className="text-3xl mb-6 text-green-800 font-semibold">
        New Invoice
      </h1>
      <div className="bg-white p-6 rounded-xl shadow max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium text-green-700 mb-1">
              Customer
            </label>
            <select
              className="w-full border border-green-300 rounded px-3 py-2"
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(Number(e.target.value))}
            >
              <option value="">Select or add a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Invoice Number</label>
            <input
              type="text"
              className="w-full border border-green-300 rounded px-3 py-2 bg-gray-50"
              value={invoiceNumber}
              readOnly
            />
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Deal No</label>
            <select
              className="w-full border border-green-300 rounded px-3 py-2"
              value={selectedDealId}
              onChange={e => setSelectedDealId(Number(e.target.value))}
              disabled={customerDeals.length === 0}
            >
              <option value="">Select Deal</option>
              {customerDeals.map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.deal_no}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block font-medium text-green-700 mb-1">Invoice Date</label>
            <input
              type="date"
              className="w-full border border-green-300 rounded px-3 py-2"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Expiry Date</label>
            <input
              type="date"
              className="w-full border border-green-300 rounded px-3 py-2"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Salesperson</label>
            <input
              type="text"
              className="w-full border border-green-300 rounded px-3 py-2"
              value={salesPerson}
              onChange={e => setSalesPerson(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Project Name</label>
            <input
              type="text"
              className="w-full border border-green-300 rounded px-3 py-2"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
            />
          </div>
        </div>

        {/* Subject */}
        <div className="mt-6">
          <label className="block font-medium text-green-700 mb-1">Subject</label>
          <textarea
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full border border-green-300 rounded px-3 py-2"
          />
        </div>

        {/* Items Table */}
        <div className="overflow-hidden border rounded-xl mt-6">
          <table className="w-full">
            <thead className="text-green-900 bg-green-100">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Rate</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="bg-green-50">
                  <td className="p-2">
                    <select
                      className="w-full border border-green-300 rounded px-2 py-1"
                      value={item.itemId ?? ""}
                      onChange={e => updateItemSelection(item.id, Number(e.target.value))}
                    >
                      <option value="">Select item</option>
                      {itemsList.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={item.qty}
                      onChange={e =>
                        setItems(items.map(it =>
                          it.id === item.id ? { ...it, qty: Number(e.target.value) } : it
                        ))
                      }
                      className="w-20 border border-green-300 rounded px-3 py-2"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.rate}
                      readOnly
                      className="w-24 border border-green-300 rounded px-3 py-2"
                    />
                  </td>
                  <td className="p-2 text-right font-semibold">
                    {(item.qty * item.rate).toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => removeItem(item.id)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={addItem}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Add Item
          </button>
        </div>

        {/* Totals and footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block font-semibold text-green-700 mb-1">
              Customer Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
              placeholder="Notes for customer"
            />
          </div>
          <div className="p-6 bg-green-50 rounded border border-green-200 space-y-3">
            <div className="flex justify-between">
              Subtotal <span>₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Discount %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPct}
                onChange={e => setDiscountPct(Number(e.target.value))}
                className="w-20 border border-green-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    checked={taxType === "TDS"}
                    onChange={() => setTaxType("TDS")}
                  />{" "}
                  TDS
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    checked={taxType === "TCS"}
                    onChange={() => setTaxType("TCS")}
                  />{" "}
                  TCS
                </label>
              </div>
              <select
                value={taxPct}
                onChange={e => setTaxPct(Number(e.target.value))}
                className="border border-green-300 rounded px-3 py-2"
              >
                {[0, 5, 12, 18, 28].map(t => (
                  <option key={t} value={t}>
                    {t}%
                  </option>
                ))}
              </select>
              <div>
                {taxType === "TDS" ? "-" : "+"} ₹{Math.abs(taxAmount).toFixed(2)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Adjustment</span>
              <input
                type="number"
                value={adjustment}
                onChange={e => setAdjustment(Number(e.target.value))}
                className="w-24 border border-green-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-between border-t border-green-300 pt-2 font-semibold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-6">
          <label className="block font-semibold text-green-700 mb-1">
            Terms &amp; Conditions
          </label>
          <textarea
            value={terms}
            onChange={e => setTerms(e.target.value)}
            className="w-full border border-green-300 rounded px-3 py-2"
            placeholder="Terms & Conditions"
          />
        </div>

        {/* File Upload */}
        <div className="mt-6">
          <label className="block font-semibold text-green-700 mb-1">
            Attach File(s)
          </label>
          <div className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
            <Upload size={16} className="text-green-600" />
            <input type="file" multiple onChange={handleFileChange} className="text-sm" />
            {files.length > 0 && (
              <span className="text-xs ml-2">{files.map(f => f.name).join(", ")}</span>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex mt-5 flex-wrap justify-end gap-3">
          <button
            onClick={() => saveInvoice("DRAFT")}
            className="px-4 py-2 border rounded-lg hover:bg-green-100"
          >
            Save as Draft
          </button>
          <button
            onClick={() => saveInvoice("SENT")}
            className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
          >
            Save and Send
          </button>
          <button
            onClick={() => router.push("/books/sales/invoice")}
            className="px-4 py-2 border rounded-lg hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
