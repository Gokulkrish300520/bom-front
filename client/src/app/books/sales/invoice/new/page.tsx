"use client";

import { Upload } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";

type CustomerType = { id: number; display_name: string };
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
type ItemType = { id: number; name: string; sales_selling_price: number | string };
type InvoiceItem = { id: string; itemId?: number; name: string; qty: number; rate: number };
type DealType = { id: number; deal_no: string };

export default function InvoiceFormPage() {
  const router = useRouter();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [selectedDealId, setSelectedDealId] = useState<number | "">("");
  const [customerDeals, setCustomerDeals] = useState<DealType[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(Date.now() / 1000) % 100000}`);
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [projectName, setProjectName] = useState("");
  const [subject, setSubject] = useState("");
  const [place_of_supply, setPlaceOfSupply] = useState("");
  const [notes, setNotes] = useState("Thanks for your business.");
  const [terms, setTerms] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(18);
  const [adjustment, setAdjustment] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 },
  ]);
  const [files, setFiles] = useState<File[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [itemsList, setItemsList] = useState<ItemType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load customers and items
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/customers/");
        const data = await res.json();
        setCustomers(data.results || []);
      } catch (e) {}
    }
    async function fetchItems() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/items/");
        const data = await res.json();
        setItemsList(data.results || []);
      } catch (e) {}
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

  // Items logic
  const addItem = () => setItems([...items, { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 }]);
  const removeItem = (id: string) => setItems(items.length > 1 ? items.filter(i => i.id !== id) : items);
  const updateItemSelection = (id: string, itemId: number) => {
    const selectedItem = itemsList.find(i => i.id === itemId);
    if (!selectedItem) return;
    setItems(curr => curr.map(i => i.id === id ? { ...i, itemId, name: selectedItem.name, rate: Number(selectedItem.sales_selling_price) } : i));
  };

  // Computed totals
  const subTotal = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.rate, 0), [items]);
  const discountAmount = useMemo(() => (subTotal * discountPct) / 100, [subTotal, discountPct]);
  const taxAmount = useMemo(() => (subTotal - discountAmount) * (taxPct / 100), [subTotal, discountAmount, taxPct]);
  const total = useMemo(() => subTotal - discountAmount + taxAmount + adjustment, [subTotal, discountAmount, taxAmount, adjustment]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  // Save invoice / draft
  const saveInvoice = async (status: "DRAFT" | "SENT") => {
    const newErrors: Record<string, string> = {};

    // Basic item validation
  if (items.filter(i => i.itemId).length === 0) newErrors.items = "At least one item must be selected.";
  items.forEach(i => {
    if (i.qty <= 0) newErrors[`qty-${i.id}`] = "Quantity must be greater than 0.";
    if (i.rate <= 0) newErrors[`rate-${i.id}`] = "Rate must be greater than 0.";
  });

  // Strict validation for SENT invoices
  if (status === "SENT") {
    if (!selectedCustomerId) newErrors.customer = "Customer is required.";
    if (!invoiceNumber) newErrors.invoiceNumber = "Invoice number is required.";
    if (!invoiceDate) newErrors.invoiceDate = "Invoice date is required.";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    toast.error("Please fix validation errors.");
    return;
  }
  setErrors({});

    const payload =
  status === "DRAFT"
    ? {
        customer: selectedCustomerId || null,
        deal: selectedDealId || null,
        invoice_number: invoiceNumber,
        place_of_supply: place_of_supply || null,
        invoice_date: invoiceDate || null,
        due_date: expiryDate || null,
        customer_notes: notes,
        terms_and_conditions: terms,
        status,
        discount_percentage: discountPct || 0,
        adjustment_amount: adjustment || 0,
        item_details: items
          .filter(i => i.itemId)
          .map(i => ({
            item: i.itemId,
            quantity: i.qty,
            rate: i.rate,
          })),
      }
    : {
        customer_id: selectedCustomerId, // ✅ correct key for InvoiceSerializer
        deal_id: selectedDealId, // ✅ correct key for InvoiceSerializer
        invoice_number: invoiceNumber,
        place_of_supply: place_of_supply,
        invoice_date: invoiceDate,
        due_date: expiryDate,
        salesperson: salesPerson,
        project_name: projectName,
        subject,
        customer_notes: notes,
        terms_and_conditions: terms,
        discount_percentage: discountPct.toFixed(2),
        adjustment_amount: adjustment.toFixed(2),
        status,
        item_details: items
          .filter(i => i.itemId)
          .map(i => ({
            item_id: i.itemId,
            quantity: i.qty,
            rate: i.rate,
          })),
      };


      function numberToWords(num: number) {
      return num.toFixed(2) + " only";
    }

    try {
      const url = status === "DRAFT"
        ? "https://web-production-6baf3.up.railway.app/api/draft-invoices/"
        : "https://web-production-6baf3.up.railway.app/api/invoices/";

      const res = await fetchWithAuth(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(`Failed to save invoice: ${JSON.stringify(err)}`);
        return;
      }

      const savedInvoice = await res.json();
      console.log("Saved Invoice:", savedInvoice);
      toast.success(`Invoice ${status === "SENT" ? "Sent" : "saved as DRAFT"} successfully.`);

    // Only generate PDF for SENT invoices
    if (status === "SENT") {
      const pdfPayload = {
        customer_id: savedInvoice.customer_id,
        document_number: savedInvoice.invoice_number,
        document_date: savedInvoice.invoice_date,
        place_of_supply: savedInvoice.place_of_supply,
        items: savedInvoice.item_details.map((item: any) => ({
          name: itemsList.find(i => i.id === item.item_id)?.name ?? "",
          hsn: item.hsn_code || "",
          quantity: item.quantity,
          rate: Number(item.rate),
          amount: Number(item.rate * item.quantity),
        })),
        totals: {
          subtotal: Number(subTotal),
          cgst: 0,
          sgst: 0,
          total: Number(total),
        },
        total_in_words: numberToWords(Number(savedInvoice.total_amount)),
        notes: [savedInvoice.customer_notes || ""],
        bank_details: {
        name: "GLONIX ELECTRONICS PRIVATE LIMITED",
        number: "1234567890",
        bank_name: "HDFC Bank",
        ifsc: "HDFC0001234",
        swift: "HDFCINBBXXX"
      }
      };

      const loadingToastId = toast.loading("Generating PDF, please wait...");
      const pdfRes = await fetchWithAuth(
        "https://web-production-6baf3.up.railway.app/api/generate-pdf/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document_type: "invoice", document_data: pdfPayload }),
        }
      );
      toast.dismiss(loadingToastId);

      if (!pdfRes.ok) {
        toast.error("Failed to generate PDF");
        return;
      }

      const blob = await pdfRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${savedInvoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Wait a little to let download start, then redirect
      setTimeout(() => {
        router.push("/books/sales/invoice");
      }, 500);
      return;
    }
    router.push("/books/sales/invoice/drafts");
    } catch (err) {
      toast.error("Error saving invoice.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <h1 className="text-3xl mb-6 text-green-800 font-semibold">New Invoice</h1>
      <div className="bg-white p-6 rounded-xl shadow max-w-7xl mx-auto">
        {/* Customer & Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium text-green-700 mb-1">Customer</label>
            <select
              className={`w-full border rounded px-3 py-2 ${errors.customer ? "border-red-500" : "border-green-300"}`}
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(Number(e.target.value))}
            >
              <option value="">Select or add a customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
            {errors.customer && <p className="text-red-600 text-sm mt-1">{errors.customer}</p>}
          </div>

          <div>
            <label className="block font-medium text-green-700 mb-1">Invoice Number</label>
            <input
              type="text"
              className={`w-full border rounded px-3 py-2 ${errors.invoiceNumber ? "border-red-500" : "border-green-300"}`}
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
            />
            {errors.invoiceNumber && <p className="text-red-600 text-sm mt-1">{errors.invoiceNumber}</p>}
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

        {/* Invoice & Project */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block font-medium text-green-700 mb-1">Invoice Date</label>
            <input
              type="date"
              className={`w-full border rounded px-3 py-2 ${errors.invoiceDate ? "border-red-500" : "border-green-300"}`}
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
            />
            {errors.invoiceDate && <p className="text-red-600 text-sm mt-1">{errors.invoiceDate}</p>}
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
          <div className="mt-6">
          <label className="block font-medium text-green-700 mb-1">Subject</label>
          <textarea
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full border border-green-300 rounded px-3 py-2"
          />
        </div>
        <div className="mt-6">
          <label className="block font-medium text-green-700 mb-1">Place Of Supply</label>
          <textarea
            value={place_of_supply}
            onChange={e => setPlaceOfSupply(e.target.value)}
            placeholder="Place of Supply"
            className="w-full border border-green-300 rounded px-3 py-2"
          />
        </div>
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
                      className={`w-full border rounded px-2 py-1 ${errors[`item-${item.id}`] ? "border-red-500" : "border-green-300"}`}
                      value={item.itemId ?? ""}
                      onChange={e => updateItemSelection(item.id, Number(e.target.value))}
                    >
                      <option value="">Select item</option>
                      {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    {errors.items && <p className="text-red-600 text-xs mt-1">{errors.items}</p>}
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={item.qty}
                      onChange={e => setItems(curr => curr.map(it => it.id === item.id ? { ...it, qty: Number(e.target.value) } : it))}
                      className={`w-20 border rounded px-3 py-2 ${errors[`qty-${item.id}`] ? "border-red-500" : "border-green-300"}`}
                    />
                    {errors[`qty-${item.id}`] && <p className="text-red-600 text-xs mt-1">{errors[`qty-${item.id}`]}</p>}
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.rate}
                      readOnly
                      className={`w-24 border rounded px-3 py-2 ${errors[`rate-${item.id}`] ? "border-red-500" : "border-green-300"}`}
                    />
                    {errors[`rate-${item.id}`] && <p className="text-red-600 text-xs mt-1">{errors[`rate-${item.id}`]}</p>}
                  </td>
                  <td className="p-2 text-right font-semibold">{(item.qty * item.rate).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-800">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addItem} className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Add Item</button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block font-semibold text-green-700 mb-1">Customer Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
              placeholder="Notes for customer"
            />
          </div>
          <div className="p-6 bg-green-50 rounded border border-green-200 space-y-3">
            <div className="flex justify-between">Subtotal <span>₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center">
              <span>Discount %</span>
              <input type="number" min={0} max={100} value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} className="w-20 border rounded px-3 py-2" />
            </div>
            <div className="flex justify-between">GST ({taxPct}%) <span>₹{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between items-center">
              <span>Adjustment</span>
              <input type="number" value={adjustment} onChange={e => setAdjustment(Number(e.target.value))} className="w-24 border rounded px-3 py-2" />
            </div>
            <div className="flex justify-between border-t border-green-300 pt-2 font-semibold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-6">
          <label className="block font-semibold text-green-700 mb-1">Terms & Conditions</label>
          <textarea value={terms} onChange={e => setTerms(e.target.value)} className="w-full border border-green-300 rounded px-3 py-2" placeholder="Terms & Conditions" />
        </div>

        {/* File Upload */}
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
          <button onClick={() => saveInvoice("DRAFT")} className="px-4 py-2 border rounded-lg hover:bg-green-100">Save as Draft</button>
          <button onClick={() => saveInvoice("SENT")} className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700">Save and Send</button>
          <button onClick={() => router.push("/books/sales/invoice")} className="px-4 py-2 border rounded-lg hover:bg-red-100">Cancel</button>
        </div>
      </div>
    </div>
  );
}
