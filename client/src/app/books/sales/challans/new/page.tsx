"use client";

import { Upload, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { generatePDF } from "@/lib/pdf/pdfgenerator";

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

type ChallanItem = {
  id: string;
  itemId?: number;
  name: string;
  qty: number;
  rate: number;
};

export default function NewChallanPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [itemsList, setItemsList] = useState<ItemType[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [challanNumber, setChallanNumber] = useState(`DC-${Math.floor(Date.now() / 1000) % 100000}`);
  const [orderNumber, setOrderNumber] = useState("");
  const [challanDate, setChallanDate] = useState(new Date().toISOString().slice(0, 10));

  const [items, setItems] = useState<ChallanItem[]>([
      { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 },
    ]);
  
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/customers/");
        const data = await res.json();
        setCustomers(data.results || []);
      } catch (e) {
        console.error("Failed to load customers", e);
      }
    }
    fetchCustomers();
  }, []);

  // --- Fetch Items ---
  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/items/");
        const data = await res.json();
        setItemsList(data.results || []);
      } catch (e) {
        console.error("Failed to load items", e);
      }
    }
    fetchItems();
  }, []);

  // --- Load selected customer details ---
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomer(null);
      setCustomerName("");
      return;
    }
    const cust = customers.find((c) => c.id === selectedCustomerId);
    setCustomerName(cust?.display_name || "");
    async function loadCustomer() {
      try {
        const res = await fetchWithAuth(
          `https://bom-front-production.up.railway.app/api/customers/${selectedCustomerId}/`
        );
        const data = await res.json();
        setCustomer(data);
      } catch (err) {
        console.error("Failed to load customer", err);
      }
    }
    loadCustomer();
  }, [selectedCustomerId, customers]);

  function formatAddress(cust: Customer, type: "billing" | "shipping") {
    return [
      cust[`${type}_attention` as keyof Customer],
      cust[`${type}_street1` as keyof Customer],
      cust[`${type}_street2` as keyof Customer],
      `${cust[`${type}_city` as keyof Customer]}, ${cust[`${type}_state` as keyof Customer]} ${cust[`${type}_pin_code` as keyof Customer]}`,
      cust[`${type}_country` as keyof Customer],
      cust[`${type}_phone` as keyof Customer] ? `Phone: ${cust[`${type}_phone` as keyof Customer]}` : null,
    ].filter(Boolean).join("\n");
  }

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.rate, 0);
  const taxRate = 18; // Example tax
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item with selected item info
  const updateItemSelection = (index: number, itemId: number) => {
    const selectedItem = itemsList.find((item) => item.id === itemId);
    if (!selectedItem) return;
    setItems((currItems) =>
      currItems.map((item, i) =>
        i === index
          ? {
              ...item,
              itemId,
              name: selectedItem.name,
              rate: typeof selectedItem.sales_selling_price === "string" ? Number(selectedItem.sales_selling_price) : selectedItem.sales_selling_price,
            }
          : item
      )
    );
  };

  const saveChallan = async (status: "draft"| "delivered" | "sent" | "failed") => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    const payload = {
      customer_id: selectedCustomerId,
      invoice_number: challanNumber,
      order_number: orderNumber,
      invoice_date: challanDate,
      total_amount: total.toFixed(2), // Adjust as needed
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
      const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/deliverychallans/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to save delivery-challan: ${JSON.stringify(err)}`);
        return;
      }
       if (status === "sent") {
            const customerObj = customers.find((c) => c.id === selectedCustomerId);
            if (!customerObj) {
              alert("Customer data not available for PDF generation");
            } else {
              const billTo = formatAddress(customer!, "billing");
              const shipTo = formatAddress(customer!, "shipping");
              generatePDF({
                title: "INVOICE",
                documentNumber: challanNumber,
                documentDate: challanDate,
                expiryDate: "", // optionally add if relevant
                customerName: customerName,
                billTo: billTo, // add billing address if available
                shipTo: shipTo, // add shipping address if available
                placeOfSupply: "", // add state or country if available
                items: items.map((i) => ({
                  name: i.name,
                  hsn: "853200", // replace with actual HSN code if available
                  qty: i.qty,
                  rate: i.rate,
                })),
                subTotal: subtotal,
                taxBreakup: [
                  { label: "GST", pct: taxRate, amount: taxAmount },
                ],
                total,
                totalInWords: "Indian Rupees " + total.toFixed(2) + " Only",
                notes: "",
                terms: ""
              });
            }
          }
      
            alert(`Challan ${status === "sent" ? "sent" : "saved as draft"} successfully.`);
            router.push("/books/sales/challans");
          } catch (err) {
            alert("Error saving invoice.");
            console.error(err);
          }
        };


  //   // Redirect back to challans list
  //   router.push("/books/sales/challans");
  // };

  // --- PDF Generation ---
  
  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="mb-4 text-2xl font-bold text-green-800">
        New Delivery Challan
      </h1>

        {/* Customer */}
        <div>
            <label className="block mb-1 text-sm font-medium text-green-800">Customer Name *</label>
            <select
              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-green-500"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            >
              <option value="">Select or add a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

        {/* Challan Info */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1 font-medium text-green-800">
              Delivery Challan#
            </label>
            <input
              type="text"
              value={challanNumber}
              className="w-full px-3 py-2 border border-green-300 rounded-lg"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">
              Reference#
            </label>
            <input
              type="text"
              name="referenceNo"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border border-green-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">Date</label>
            <input
              type="date"
              name="date"
              value={challanDate}
              onChange={(e) => setChallanDate(e.target.value)}
              className="w-full px-3 py-2 border border-green-300 rounded-lg"
            />
          </div>
        </div>

        {/* Challan Type */}
        {/* <div>
          <label className="block mb-1 font-medium text-green-800">
            Challan Type*
          </label>
          <select
            name="challanType"
            value={form.challanType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-green-300 rounded-lg"
            required
          >
            <option value="">Choose</option>
            <option>Supply of Liquid Gas</option>
            <option>Job Work</option>
            <option>Supply on Approval</option>
            <option>Others</option>
          </select>
        </div> */}

        {/* Items Table */}
        <div>
          <h2 className="mb-2 text-lg font-semibold text-green-800">Items</h2>
          <table className="w-full border rounded-lg">
            <thead className="text-green-800 bg-green-100">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Rate</th>
                <th className="p-2">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item,idx) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">
                    <select
                          className="w-full p-1 border rounded"
                          value={item.itemId ?? ""}
                          onChange={(e) => updateItemSelection(idx, Number(e.target.value))}
                        >
                          <option value="">Select item</option>
                          {itemsList.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                  </td>
                  <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          className="w-full p-1 border rounded"
                          value={item.qty}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) =>
                                i === idx ? { ...it, qty: Number(e.target.value) } : it
                              )
                            )
                          }
                        />
                      </td>
                  <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          className="w-full p-1 border rounded"
                          value={item.rate}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) =>
                                i === idx ? { ...it, rate: Number(e.target.value) } : it
                              )
                            )
                          }
                        />
                      </td>
                  <td className="p-2 text-right">
                    {(item.qty * item.rate).toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                        <button onClick={() => removeItem(idx)}>
                          <X size={16} className="text-red-500" />
                        </button>
                      </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addItem}
            className="px-4 py-2 mt-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            + Add Item
          </button>
        </div>

        {/* Totals */}
        <div className="p-4 space-y-2 rounded-lg bg-green-50">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">GST ({taxRate}%)</span>
                <span className="text-sm">₹{taxAmount.toFixed(2)}</span>
              </div>
          <div className="flex justify-between font-semibold">
            <span>Total (₹)</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/books/sales/challans")}
            className="px-6 py-2 bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <div className="sticky bottom-0 flex justify-end gap-2 py-3 mt-4 border-t bg-gray-50">
        <button
          onClick={() => saveChallan("draft")}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
        >
          Save as Draft
        </button>
          {/* <button
            type="button"
            onClick={generatePDF}
            className="px-6 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            Download PDF
          </button> */}
        </div>
    </div>
    </div>
  );
}
