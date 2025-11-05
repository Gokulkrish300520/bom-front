"use client";

import { useRouter } from "next/navigation";
import React from 'react';
import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";

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


type Item = {
  id: number;
  name: string;
  hsn_code: string;
  sales_description?: string;
  sales_selling_price: string;
};


type QuoteItemRow = {
  id: string;
  isManual: boolean;
  itemId: number | null;
  hsn_code?: string;
  name: string;
  qty: number;
  rate: number;
  description?: string;
};


const STORAGE_KEY = "quotes";

// function to generate quote number //

export default function NewQuote() {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerFetchError, setCustomerFetchError] = useState("");

  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const currentYear = new Date().getFullYear();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");

  const [customerName, setCustomerName] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("Q-" + (Math.floor(Date.now() / 1000) % 100000));
  const [dealno, setDealno] = useState("D-" + (Math.floor(Date.now() / 1000) % 10000000));
  const [lastDealId, setLastDealId] = useState(0);

  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [projectName, setProjectName] = useState("");

  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("Looking forward to your business.");
  const [terms, setTerms] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [deals, setDeals] = useState<{ id: number; deal_no: string; customer: number }[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [showDealModal, setShowDealModal] = useState(false);
  const [quoteItems, setQuoteItems] = useState<QuoteItemRow[]>([
    { id: crypto.randomUUID(), isManual: false,itemId: null, name: "", qty: 1, rate: 0 },
  ]);

  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [adjustment, setAdjustment] = useState(0);
  const [banks, setBanks] = useState<{id:number, name:string, number:string, bank_name:string, ifsc:string, swift:string}[]>([]);

  const [selectedBankId, setSelectedBankId] = useState<number | "">("");
  const [selectedDealId, setSelectedDealId] = useState<number | "">("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");




  function formatAddress(cust: Customer, type: "billing" | "shipping") {
    return [
      cust[`${type}_attention`],
      cust[`${type}_street1`],
      cust[`${type}_street2`],
      `${cust[`${type}_city`]}, ${cust[`${type}_state`]} ${cust[`${type}_pin_code`]}`,
      cust[`${type}_country`],
      cust[`${type}_phone`] ? `Phone: ${cust[`${type}_phone`]}` : null,
    ].filter(Boolean).join("\n");
  }

  useEffect(() => {
    const storedId = localStorage.getItem(`lastDealId-${currentYear}`);
    setLastDealId(storedId ? Number(storedId) : 0);
  }, [currentYear]);

  useEffect(() => {
    const newDealno = `D-${currentYear}-${String(lastDealId + 1).padStart(2, "0")}`;
    setDealno(newDealno);
  }, [lastDealId, currentYear]);

  // Fetch customers //
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/customers/");
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data = await res.json();
        setCustomers(data.results || []);
        setCustomerFetchError("");
      } catch {
        setCustomerFetchError("Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

  // Fetching deals //
  useEffect(() => {
  async function loadDeals() {
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/");
      if (!res.ok) throw new Error("Failed to fetch deals");
      const data = await res.json();
      setDeals(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeals(false);
    }
  }
  loadDeals();
}, []);

  // Fetching items //
  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/items/");
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = await res.json();
        setItemsList(data.results || []);
      } catch {
        // handle error if desired
      } finally {
        setLoadingItems(false);
      }
    }
    loadItems();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomer(null);
      setCustomerName("");
      return;
    }

    // Fetch selected customer details //
    async function fetchCustomerDetails() {
      try {
        const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/customers/${selectedCustomerId}/`);
        if (!res.ok) throw new Error("Failed to fetch customer details");
        const data = await res.json();
        setCustomer(data);
        setCustomerName(data.display_name);
      } catch {
        setCustomer(null);
      }
    }
    fetchCustomerDetails();
  }, [selectedCustomerId]);

  // Fetching banks //
  useEffect(() => {
  async function loadBanks() {
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/bank-details/");
      if (!res.ok) throw new Error("Failed to fetch banks");
      const data = await res.json();
      setBanks(data.results || []);
    } catch (err) {
      console.error(err);
    }
  }
  loadBanks();
}, []);


  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerName("");
      return;
    }
    const cust = customers.find(c => c.id === selectedCustomerId);
    setCustomerName(cust?.display_name ?? "");
  }, [selectedCustomerId, customers]);

  // Calculations //
  const subTotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  }, [quoteItems]);

  const discountAmount = useMemo(() => (subTotal * discountPct) / 100, [subTotal, discountPct]);

  const taxAmount = useMemo(() => {
    const base = (subTotal - discountAmount) * (taxPct / 100);
    return base;
  }, [subTotal, discountAmount, taxPct]);

  const total = useMemo(() => subTotal - discountAmount + taxAmount + adjustment, [subTotal, discountAmount, taxAmount, adjustment]);

  // Handlers for quote items table //

  const addRow = () => {
    setQuoteItems(curr => [...curr, { id: crypto.randomUUID(),isManual: false,  itemId: null, name: "", qty: 1, rate: 0 }]);
  };

  const removeRow = (id: string) => {
    setQuoteItems(curr => (curr.length > 1 ? curr.filter(row => row.id !== id) : curr));
  };

  const updateRow = (id: string, patch: Partial<QuoteItemRow>) => {
    setQuoteItems(curr => curr.map(row => row.id === id ? { ...row, ...patch } : row));
  };

  async function saveQuote(status: 'draft' | 'sent') {
    setIsLoading(true);
  if (!selectedCustomerId) {
    toast.error("Please select a customer");
    return;
  }
  if (!dealno) {
    toast.error("Please enter deal number");
    return;
  }
  if (!quoteDate || !expiryDate) {
    toast.error("Please enter start and end date");
    return;
  }
  const invalidItems = quoteItems.filter(item => {
      if (item.isManual) {
        return !item.name || !item.qty || !item.rate;
      } else {
        return !item.itemId;
      }
    });

    if (invalidItems.length > 0) {
      toast.error("Please fill all item details");
      setIsLoading(false);
      return;
    }


    // Compute total in words function (adjust as per requirements)
    function numberToWords(num: number) {
      return num.toFixed(2) + " only";
    }

    try {
    // Post quote with deal_id returned by backend
    const payload = {
      customer_id: selectedCustomerId,
      deal_id: selectedDealId,
      quote_number: quoteNumber,
      quote_date: quoteDate,
      due_date: expiryDate,
      salesperson,
      project_name: projectName,
      subject,
      customer_notes: notes,
      terms_and_conditions: terms,
      discount_percentage: discountPct.toFixed(2),
      tax_percentage: taxPct.toString(),
      adjustment_amount: adjustment,
      place_of_supply: placeOfSupply,
      status,
      bank_detail_id: selectedBankId,
      item_details: quoteItems.map(item => {
          if (item.isManual) {
            // Manual item
            return {
              is_manual_item: true,
              manual_item_name: item.name,
              manual_item_description: item.description || "",
              manual_hsn_code: item.hsn_code || "",
              quantity: item.qty,
              rate: item.rate,
            };
          } else {
            // Inventory item
            return {
              is_manual_item: false,
              item_id: item.itemId!,
              quantity: item.qty,
              rate: item.rate,
            };
          }
        }),
      };

      const quoteRes = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/quotes/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!quoteRes.ok) {
        const err = await quoteRes.json();
        toast.error(`Failed to save quote: ${JSON.stringify(err)}`);
        return;
      }

      const savedQuote = await quoteRes.json();
      const selectedBank = banks.find(b => b.id === selectedBankId);
      // Transform the saved quote to match backend PDF expect format
    const pdfPayload = {
      customer_id: savedQuote.customer.id,
      document_number: savedQuote.quote_number,
      document_date: savedQuote.quote_date,
      place_of_supply: savedQuote.place_of_supply,
      items: savedQuote.item_details.map((item: any) => ({
        name: item.item_name,  // Use computed field from backend
        hsn: item.hsn_code || "",
        description: item.description || "",
        quantity: item.quantity,
        rate: Number(item.rate),
        amount: Number(item.amount)
      })),
      totals: {
        subtotal_amount: Number(savedQuote.subtotal_amount),
        gst_amount: Number(savedQuote.gst_amount),
        total_amount: Number(savedQuote.total_amount)
      },
      total_in_words: numberToWords(Number(savedQuote.total_amount)),
      notes: [savedQuote.customer_notes || ""],
      bank_details: selectedBank || {
      name: "",
      number: "",
      bank_name: "",
      ifsc: "",
      swift: ""
    }
    };

  const loadingToastId = toast.loading('Generating PDF, please wait...');

    // Call PDF generation endpoint
    const pdfRes = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/generate-pdf/", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_type: 'quote',
        document_data: pdfPayload
      })
    });
    toast.dismiss(loadingToastId);

    if (!pdfRes.ok) {
      let errorMsg = "Failed to generate PDF";
      try {
        const errorData = await pdfRes.json();
        errorMsg += `: ${JSON.stringify(errorData)}`;
      } catch {
        // ignore
      }
      toast.error(errorMsg);
      return;
    }

    if (pdfRes.ok) {
  const blob = await pdfRes.blob();
  const reader = new FileReader();

  reader.readAsDataURL(blob);

  reader.onloadend = () => {
    const base64data = reader.result?.toString().split(",")[1]; // extract base64
    toast.success("PDF generated successfully!");
    // Instead of passing PDF in URL
    sessionStorage.setItem("quotePDF", base64data || "");
    sessionStorage.setItem("quoteSubject", subject);
    sessionStorage.setItem("quoteCustomerName", customerName);
    router.push("/books/sales/send-email");


    // ⚡ Redirect to the email sending page
    router.push(
      `/books/sales/send-email`
    );
  };

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote_${savedQuote.quote_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

      toast.success("Quote saved successfully");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }
    finally {
    setIsLoading(false);  // Always reset loading state here
  }
  }


  return (
    <div className="min-h-screen bg-green-50 p-6">
      <h1 className="text-3xl mb-6 text-green-800 font-semibold">New Quote</h1>
      <div className="bg-white p-6 rounded-xl shadow max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium text-green-700 mb-1">Customer</label>
            {loadingCustomers ? (
              <p>Loading customers...</p>
            ) : customerFetchError ? (
              <p className="text-red-600">{customerFetchError}</p>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-green-300 rounded px-3 py-2"
              >
                <option value="">Select customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.display_name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Quote Number</label>
            <input
              type="text"
              value={quoteNumber}
              onChange={e => setQuoteNumber(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
          <label className="block font-medium text-green-700 mb-1">Deal</label>
          <div className="flex items-center gap-2">
            {loadingDeals ? (
              <p>Loading deals...</p>
            ) : (
              <select
                value={selectedDealId}
                onChange={e => setSelectedDealId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-green-300 rounded px-3 py-2"
              >
                <option value="">Select deal</option>
                {deals.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.deal_no}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowDealModal(true)}
              className="text-green-700 text-2xl font-bold hover:text-green-900"
              title="Add new deal"
            >
              +
            </button>
          </div>
        </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-green-700 mb-1">Quote Date</label>
              <input
                type="date"
                value={quoteDate}
                onChange={e => setQuoteDate(e.target.value)}
                className="w-full border border-green-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium text-green-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full border border-green-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-green-700 mb-1">Salesperson</label>
            <input
              type="text"
              value={salesperson}
              onChange={e => setSalesperson(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium text-green-700 mb-1">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
            />
          </div>
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

        {/* Items table */}
        <div className="mt-5 overflow-hidden border rounded-xl">
          <table className="w-full">
            <thead className="text-green-900 bg-green-100">
              <tr>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Hsn code</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Rate</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.map(item => (
                <tr key={item.id} className="bg-green-50">
                  <td className="p-2">
                    <select
                      className="w-full border border-green-300 rounded px-2 py-1"
                      value={item.isManual ? "manual" : "inventory"}
                      onChange={e => {
                        const isManual = e.target.value === "manual";
                        updateRow(item.id, {
                          isManual,
                          itemId: null,
                          name: "",
                          hsn_code: "",
                          description: "",
                          rate: 0
                        });
                      }}
                    >
                      <option value="inventory">Inventory</option>
                      <option value="manual">Manual</option>
                    </select>
                  </td>

                  {/* ✅ NEW: Conditional item/name field */}
                  <td className="p-2">
                    {item.isManual ? (
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={item.name}
                        onChange={e => updateRow(item.id, { name: e.target.value })}
                        className="w-full border border-green-300 rounded px-2 py-1"
                      />
                    ) : (
                      <select
                        className="w-full border border-green-300 rounded px-2 py-1"
                        value={item.itemId ?? ""}
                        onChange={e => {
                          const id = Number(e.target.value);
                          const selectedItem = itemsList.find(i => i.id === id);
                          updateRow(item.id, {
                            itemId: id,
                            name: selectedItem?.name ?? "",
                            hsn_code: selectedItem?.hsn_code ?? "",
                            description: selectedItem?.sales_description ?? "",
                            rate: selectedItem ? Number(selectedItem.sales_selling_price) : 0,
                          });
                        }}
                      >
                        <option value="">Select item</option>
                        {itemsList.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* ✅ NEW: HSN code field */}
                  <td className="p-2">
                    {item.isManual ? (
                      <input
                        type="text"
                        placeholder="HSN Code"
                        value={item.hsn_code || ""}
                        onChange={e => updateRow(item.id, { hsn_code: e.target.value })}
                        className="w-full border border-green-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="px-2">{item.hsn_code || "—"}</span>
                    )}
                  </td>

                  {/* ✅ NEW: Description field */}
                  <td className="p-2">
                    {item.isManual ? (
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description || ""}
                        onChange={e => updateRow(item.id, { description: e.target.value })}
                        className="w-full border border-green-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="px-2 text-sm text-gray-600">
                        {item.description ? item.description.substring(0, 30) + "..." : "—"}
                      </span>
                    )}
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={item.qty}
                      onChange={e => updateRow(item.id, { qty: Number(e.target.value) })}
                      className="w-20 border border-green-300 rounded px-3 py-2"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      value={item.rate}
                      readOnly={!item.isManual}
                      onChange={item.isManual ? (e => updateRow(item.id, { rate: Number(e.target.value) })) : undefined}
                      className="w-24 border border-green-300 rounded px-3 py-2"
                    />
                  </td>
                  <td className="p-2 text-right font-semibold">{(item.qty * item.rate).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button className="text-red-600 hover:text-red-800" onClick={() => removeRow(item.id)} title="Remove">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            + Add Item
          </button>
        </div>

        {/* Totals and footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block font-semibold text-green-700 mb-1">Customer Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
              placeholder="Notes for customer"
            />
                  {/* Place of Supply field below notes */}
          <label className="block font-semibold text-green-700 mt-4 mb-1">Place of Supply</label>
          <input
            type="text"
            value={placeOfSupply}
            onChange={e => setPlaceOfSupply(e.target.value)}
            className="w-full border border-green-300 rounded px-3 py-2"
            placeholder="e.g., Maharashtra"
          />
          </div>
          <div className="p-6 bg-green-50 rounded border border-green-200 space-y-3">
            <div className="flex justify-between">Subtotal <span>₹{subTotal.toFixed(2)}</span></div>
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
            {/* Show discount amount */}
            <div className="flex justify-between text-gray-700">
              <span>Discount Amount</span>
              <span>₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex gap-4">
                <span>Tax %</span>
              </div>
              <select value={taxPct} onChange={e => setTaxPct(Number(e.target.value))} className="border border-green-300 rounded px-3 py-2">
                {[0,5,12,18,28].map(t => <option key={t} value={t}>{t}%</option>)}
              </select>
            </div>
            {/* Show GST amount */}
            <div className="flex justify-between text-gray-700">
              <span>GST Amount</span>
              <span>₹{taxAmount.toFixed(2)}</span>
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
        <div className="mt-4">
        <label className="block font-medium text-green-700 mb-1">Bank</label>
        <select
          value={selectedBankId}
          onChange={e => setSelectedBankId(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full border border-green-300 rounded px-3 py-2"
        >
          <option value="">Select Bank</option>
          {banks.map(b => (
            <option key={b.id} value={b.id}>{b.name} - {b.bank_name}</option>
          ))}
        </select>
      </div>


        {/* Footer buttons */}
        <div className="flex mt-5 flex-wrap justify-end gap-3">
          <button onClick={() => saveQuote("draft")}
          disabled={isLoading}
          className="px-4 py-2 border rounded-lg hover:bg-green-100">
            Save as Draft
          </button>
          <button
            onClick={() => saveQuote("sent")}
            disabled={isLoading}
            className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
          >
            Save and Send
          </button>
          <button onClick={() => router.push("/books/sales/quotes")} 
          disabled={isLoading}
          className="px-4 py-2 border rounded-lg hover:bg-red-100">
            Cancel
          </button>
        </div>
      </div>
      {showDealModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-semibold text-green-800 mb-4">Add New Deal</h2>
      <div className="space-y-3">
        <div>
          <label className="block font-medium text-green-700 mb-1">Customer</label>
          <input
            type="text"
            value={customerName}
            readOnly
            className="w-full border border-green-300 rounded px-3 py-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="block font-medium text-green-700 mb-1">Deal No</label>
          <input
            type="text"
            value={dealno}
            onChange={e => setDealno(e.target.value)}
            className="w-full border border-green-300 rounded px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-green-700 mb-1">Start Date</label>
            <input
              type="date"
              value={quoteDate}
              onChange={e => setQuoteDate(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">End Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-5">
        <button
          onClick={() => setShowDealModal(false)}
          className="px-4 py-2 rounded border hover:bg-red-100"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!selectedCustomerId || !dealno || !quoteDate || !expiryDate) {
              toast.error("Please fill all fields");
              return;
            }
            try {
              const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer_id: selectedCustomerId,
                  deal_no: dealno,
                  start_date: quoteDate,
                  end_date: expiryDate
                })
              });
              if (!res.ok) throw new Error("Failed to create deal");
              const newDeal = await res.json();
              setDeals(prev => [...prev, newDeal]);
              setSelectedDealId(newDeal.id);
              toast.success("New deal added!");
              setShowDealModal(false);
            } catch (err) {
              console.error(err);
              toast.error("Failed to save deal");
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save Deal
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
