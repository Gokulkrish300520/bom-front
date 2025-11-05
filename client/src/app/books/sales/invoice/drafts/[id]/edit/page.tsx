"use client";

import { Upload } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

type CustomerType = { id: number; display_name: string };
type ItemType = { id: number; name: string; sales_selling_price: number | string };
type DealType = { id: number; deal_no: string };

type InvoiceItem = {
  id: string;
  itemId?: number;
  name: string;
  qty: number;
  rate: number;
};

export default function EditDraftInvoicePage() {
  const router = useRouter();
  const { id } = useParams();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [itemsList, setItemsList] = useState<ItemType[]>([]);
  const [customerDeals, setCustomerDeals] = useState<DealType[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [selectedDealId, setSelectedDealId] = useState<number | "">("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxPct, setTaxPct] = useState(18);
  const [taxType, setTaxType] = useState<"TDS" | "TCS">("TDS");
  const [files, setFiles] = useState<File[]>([]);

  // --- Load Draft, Customers, Items ---
  useEffect(() => {
    async function loadData() {
      try {
        const [draftRes, customersRes, itemsRes] = await Promise.all([
          fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/draft-invoices/${id}/`),
          fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/customers/`),
          fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/items/`)
        ]);

        const draft = await draftRes.json();
        const customersData = await customersRes.json();
        const itemsData = await itemsRes.json();

        setInvoiceData(draft);
        setCustomers(customersData.results || []);
        setItemsList(itemsData.results || []);

        // Initialize form fields from draft
        setSelectedCustomerId(draft.customer || "");
        setSelectedDealId(draft.deal || "");
        setInvoiceNumber(draft.invoice_number || "");
        setOrderNumber(draft.order_number || "");
        setInvoiceDate(draft.invoice_date || "");
        setExpiryDate(draft.due_date || "");
        setNotes(draft.customer_notes || "");
        setTerms(draft.terms_and_conditions || "");
        setAdjustment(draft.adjustment || 0);

        const mappedItems = (draft.item_details || []).map((item: any) => ({
          id: String(item.id),
          itemId: item.item,
          name: item.item_name || item.name,
          qty: item.quantity,
          rate: item.rate,
        }));
        setItems(mappedItems);

      } catch (err) {
        toast.error("Failed to load draft data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // --- Load Deals for selected customer ---
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDeals([]);
      setSelectedDealId("");
      return;
    }
    async function loadDeals() {
      try {
        const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/deals/?customer_id=${selectedCustomerId}`);
        const data = await res.json();
        setCustomerDeals(data.results || []);
      } catch {
        setCustomerDeals([]);
      }
    }
    loadDeals();
  }, [selectedCustomerId]);

  // --- Item handlers ---
  const addItem = () => setItems([...items, { id: crypto.randomUUID(), qty: 1, rate: 0, name: "", itemId: undefined }]);
  const removeItem = (id: string) => setItems(items.length > 1 ? items.filter(i => i.id !== id) : items);
  const updateItemSelection = (id: string, itemId: number) => {
    const selectedItem = itemsList.find(i => i.id === itemId);
    if (!selectedItem) return;
    setItems(curr => curr.map(i => i.id === id ? {
      ...i,
      itemId,
      name: selectedItem.name,
      rate: typeof selectedItem.sales_selling_price === "string" ? Number(selectedItem.sales_selling_price) : selectedItem.sales_selling_price,
    } : i));
  };

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

  // --- File upload ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  // --- Save / Publish ---
  const saveDraft = async (status: "DRAFT" | "SENT") => {

    const payload = {
      customer: selectedCustomerId || null,
      deal: selectedDealId || null,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: expiryDate,
      customer_notes: notes,
      terms_and_conditions: terms,
      tax_percentage: taxPct.toString(),
      status,
      item_details: items.map(i => ({ id:i.id, item: i.itemId, quantity: i.qty, rate: i.rate})),
    };
    
    try {
      const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/draft-invoices/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("Saving draft with payload:", payload);
      if (!res.ok) throw new Error("Failed to save draft");
      toast.success(`Draft ${status === "SENT" ? "published" : "saved"} successfully`);
      router.push("/books/sales/invoice/drafts");
    } catch (err) {
      toast.error("Error saving draft");
      console.error(err);
    }
  };
const publishDraft = async () => {
  try {
    const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/draft-invoices/${id}/publish/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to publish draft");
    toast.success("Draft published successfully");
    router.push("/books/sales/invoice/drafts");
  } catch (err) {
    toast.error("Error publishing draft");
    console.error(err);
  }
};

  if (loading) return <div className="p-6">Loading draft...</div>;
  if (!invoiceData) return <div className="p-6 text-red-600">Draft not found.</div>;

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <h1 className="text-3xl mb-6 text-green-800 font-semibold">Edit Draft Invoice</h1>
      <div className="bg-white p-6 rounded-xl shadow max-w-7xl mx-auto">
        {/* Customer, Invoice Number, Deal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium text-green-700 mb-1">Customer</label>
            <select
              className="w-full border border-green-300 rounded px-3 py-2"
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(Number(e.target.value))}
            >
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Invoice Number</label>
            <input
              type="text"
              className="w-full border border-green-300 rounded px-3 py-2"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
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
              {customerDeals.map(d => <option key={d.id} value={d.id}>{d.deal_no}</option>)}
            </select>
          </div>
        </div>

        {/* Dates */}
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
        </div>

        {/* Items Table */}
        <div className="overflow-hidden border rounded-xl mt-6">
          <table className="w-full">
            <thead className="text-green-900 bg-green-100">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Qty</th>
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
                      {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={item.qty}
                      onChange={e => setItems(items.map(it => it.id === item.id ? { ...it, qty: Number(e.target.value) } : it))}
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
                  <td className="p-2 text-right font-semibold">{(item.qty * item.rate).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button className="text-red-600 hover:text-red-800" onClick={() => removeItem(item.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addItem} className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Add Item</button>
        </div>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block font-semibold text-green-700 mb-1">Customer Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-green-300 rounded px-3 py-2" />
          </div>
          <div className="p-6 bg-green-50 rounded border border-green-200 space-y-3">
            <div className="flex justify-between">Subtotal <span>₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center">
              <span>Discount %</span>
              <input type="number" min={0} max={100} value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} className="w-20 border border-green-300 rounded px-3 py-2" />
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-1">
                  <input type="radio" checked={taxType === "TDS"} onChange={() => setTaxType("TDS")} /> TDS
                </label>
                <label className="inline-flex items-center gap-1">
                  <input type="radio" checked={taxType === "TCS"} onChange={() => setTaxType("TCS")} /> TCS
                </label>
              </div>
              <select value={taxPct} onChange={e => setTaxPct(Number(e.target.value))} className="border border-green-300 rounded px-3 py-2">
                {[0, 5, 12, 18, 28].map(p => <option key={p} value={p}>{p}%</option>)}
              </select>
            </div>
            <div className="flex justify-between">Tax Amount <span>₹{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between">
              <span>Adjustment</span>
              <input type="number" value={adjustment} onChange={e => setAdjustment(Number(e.target.value))} className="w-24 border border-green-300 rounded px-3 py-2" />
            </div>
            <div className="flex justify-between font-bold text-lg">Total <span>₹{total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Terms & File Upload */}
        <div className="mt-6">
          <label className="block font-semibold text-green-700 mb-1">Terms & Conditions</label>
          <textarea value={terms} onChange={e => setTerms(e.target.value)} className="w-full border border-green-300 rounded px-3 py-2" />
        </div>
        <div className="mt-6">
          <label className="block font-semibold text-green-700 mb-1">Attach File(s)</label>
          <div className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
            <Upload size={16} className="text-green-600" />
            <input type="file" multiple onChange={handleFileChange} className="text-sm" />
            {files.length > 0 && <span className="text-xs ml-2">{files.map(f => f.name).join(", ")}</span>}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex mt-5 flex-wrap justify-end gap-3">
          <button onClick={() => saveDraft("DRAFT")} className="px-4 py-2 border rounded-lg hover:bg-green-100">Save as Draft</button>
          <button onClick={publishDraft} className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700">Publish</button>
          <button onClick={() => router.push("/books/sales/invoice/drafts")} className="px-4 py-2 border rounded-lg hover:bg-red-100">Cancel</button>
        </div>
      </div>
    </div>
  );
}
