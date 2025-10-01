"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

type ItemRow = {
  id: number;
  item: string;
  qty: number;
  rate: number;
  amount: number;
  taxType?: string;
  taxRate?: number;
};

type Vendor = {
  id: number;
  display_name: string;
  address?: string;
  state?: string;
};

export default function NewBillOrderPage() {
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [billNumber, setBillNumber] = useState(`BILL-${Date.now()}`);
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [dealNumber, setDealNumber] = useState(""); // Changed from orderNumber
  const [rows, setRows] = useState<ItemRow[]>([
    { id: 1, item: "", qty: 1, rate: 0, amount: 0, taxType: "cgst_sgst", taxRate: 18 },
  ]);

  const [country, setCountry] = useState("India");
  const [exchangeRate, setExchangeRate] = useState(1);

  const countries = [
    { code: "INR", name: "India" },
    { code: "USD", name: "USA" },
    { code: "EUR", name: "Europe" },
    { code: "GBP", name: "UK" },
    { code: "AUD", name: "Australia" },
    { code: "CAD", name: "Canada" },
    { code: "SGD", name: "Singapore" },
    { code: "JPY", name: "Japan" },
    { code: "Others", name: "Others" },
  ];

  // Fetch daily exchange rate
  useEffect(() => {
    if (country !== "India") {
      const storedRate = localStorage.getItem(`exchangeRate_${country}`);
      const storedDate = localStorage.getItem(`exchangeRateDate_${country}`);
      const today = new Date().toISOString().split("T")[0];

      if (storedRate && storedDate === today) {
        setExchangeRate(Number(storedRate));
      } else {
        const fetchRate = async () => {
          try {
            const currencyCode = countries.find(c => c.name === country)?.code || "USD";
            const res = await fetch(
              `https://api.exchangerate.host/latest?base=${currencyCode}&symbols=INR`
            );
            const data = await res.json();
            const rate = data?.rates?.INR || 1;
            setExchangeRate(rate);
            localStorage.setItem(`exchangeRate_${country}`, rate.toString());
            localStorage.setItem(`exchangeRateDate_${country}`, today);
          } catch (error) {
            console.error("Error fetching exchange rate", error);
          }
        };
        fetchRate();
      }
    } else {
      setExchangeRate(1);
    }
  }, [country]);

  const handleRowChange = (id: number, field: keyof ItemRow, value: any) => {
    setRows(prev =>
      prev.map(row =>
        row.id === id
          ? {
              ...row,
              [field]: value,
              amount:
                field === "qty" || field === "rate"
                  ? (field === "qty" ? value : row.qty) * (field === "rate" ? value : row.rate)
                  : row.amount,
            }
          : row
      )
    );
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      { id: Date.now(), item: "", qty: 1, rate: 0, amount: 0, taxType: "cgst_sgst", taxRate: 18 },
    ]);
  };

  const removeRow = (id: number) => {
    setRows(prev => prev.filter(row => row.id !== id));
  };

  const subTotal = rows.reduce((sum, r) => sum + r.amount, 0);
  const taxAmount = country === "India" ? rows.reduce((sum, r) => sum + ((r.amount * (r.taxRate || 0)) / 100), 0) : 0;
  const total = country === "India" ? subTotal + taxAmount : subTotal * exchangeRate;

  const handleSubmit = () => {
    const newBill = {
      id: Date.now().toString(),
      vendor: vendor || { id: 1, display_name: "Test Vendor" },
      bill_number: billNumber,
      bill_date: billDate,
      deal_number: dealNumber, // Updated
      total_amount: total,
      status: "DRAFT",
      country,
      vendor_address: vendor?.address || "",
      vendor_state: vendor?.state || "",
      items: rows,
      exchange_rate: country === "India" ? null : exchangeRate,
      created_at: new Date().toISOString(),
    };

    const stored = localStorage.getItem("bill_orders");
    const bills = stored ? JSON.parse(stored) : [];
    bills.push(newBill);
    localStorage.setItem("bill_orders", JSON.stringify(bills));

    alert("Bill Order saved!");
    router.push("/books/purchase/bill_order");
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="p-8 space-y-8 bg-white shadow-lg rounded-xl">
          <h1 className="text-3xl font-bold text-green-900">Create Bill Order</h1>

          {/* Vendor Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-medium">Vendor Name *</label>
              <input type="text" value={vendor?.display_name || ""} onChange={e => setVendor({ ...vendor, id: 1, display_name: e.target.value })} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 border rounded-lg">
                {countries.map(c => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Address</label>
              <input
                type="text"
                value={vendor?.address || ""}
                onChange={e =>
                  setVendor(
                    vendor
                      ? { ...vendor, address: e.target.value }
                      : { id: 1, display_name: "", address: e.target.value }
                  )
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">State</label>
              <input
                type="text"
                value={vendor?.state || ""}
                onChange={e =>
                  setVendor(
                    vendor
                      ? { ...vendor, state: e.target.value }
                      : { id: 1, display_name: "", state: e.target.value }
                  )
                }
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Bill #</label>
              <input type="text" value={billNumber} onChange={e => setBillNumber(e.target.value)} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Bill Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Deal Number</label>
              <input type="text" value={dealNumber} onChange={e => setDealNumber(e.target.value)} className="w-full p-2 border rounded-lg" />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h2 className="text-lg font-semibold">Items & Charges</h2>
            <table className="w-full overflow-hidden border rounded-lg">
              <thead className="bg-green-100">
                <tr>
                  <th className="p-2">Item</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Rate</th>
                  <th className="p-2">Amount</th>
                  {country === "India" && (
                    <>
                      <th className="p-2">Tax Type</th>
                      <th className="p-2">Tax %</th>
                    </>
                  )}
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td className="p-2">
                      <input type="text" value={row.item} onChange={e => handleRowChange(row.id, "item", e.target.value)} className="w-full p-1 border rounded-md" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={row.qty} onChange={e => handleRowChange(row.id, "qty", Number(e.target.value))} className="w-20 p-1 text-center border rounded-md" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={row.rate} onChange={e => handleRowChange(row.id, "rate", Number(e.target.value))} className="w-24 p-1 text-center border rounded-md" />
                    </td>
                    <td className="p-2 text-right">₹{row.amount.toFixed(2)}</td>
                    {country === "India" && (
                      <>
                        <td className="p-2">
                          <select value={row.taxType} onChange={e => handleRowChange(row.id, "taxType", e.target.value)} className="p-1 border rounded-md">
                            <option value="cgst_sgst">CGST+SGST</option>
                            <option value="igst">IGST</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select value={row.taxRate} onChange={e => handleRowChange(row.id, "taxRate", Number(e.target.value))} className="p-1 border rounded-md">
                            <option value={5}>5%</option>
                            <option value={18}>18%</option>
                          </select>
                        </td>
                      </>
                    )}
                    <td className="p-2 text-center">
                      <button onClick={() => removeRow(row.id)} className="text-red-600"><X /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addRow} className="mt-3 font-medium text-green-700">+ Add Row</button>
          </div>

          {/* Summary */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between">Sub Total: ₹{subTotal.toFixed(2)}</div>
            {country === "India" ? (
              <div className="flex justify-between">Tax: ₹{taxAmount.toFixed(2)}</div>
            ) : (
              <div className="flex justify-between">Exchange Rate: 1 {country} → ₹{exchangeRate.toFixed(2)}</div>
            )}
            <div className="flex justify-between pt-2 text-lg font-bold text-green-700 border-t">
              Total: ₹{total.toFixed(2)}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSubmit} className="px-6 py-2 text-white bg-green-600 rounded-lg">Save Bill Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}