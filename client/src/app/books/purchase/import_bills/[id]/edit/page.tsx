"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

interface Row {
  id?: number;
  item_name: string;
  description: string;
  item_specification: string;
  hsn_code: string;
  brand: string;
  quantity: number;
  unit_price: number;
  total_price: number; 
  deleted?: boolean;
}

interface Vendor {
  id: number;
  display_name: string;
}

interface Deal {
  id: number;
  deal_no: string;
}

interface ImportBill {
  id: number;
  vendor: Vendor;
  deal: Deal;
  invoiceDate: string;
  paymentRequest: "High" | "Low";
  paymentStatus: "Paid" | "Unpaid" | "Partially Paid";
  paymentRef?: string;
  paidBy: "SBI" | "ICICI" | "IOB" | "Petty Cash";
  rows: Row[];
}

export default function EditImportBillPage() {
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState<ImportBill | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");
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

  const [exchangeRates] = useState<Record<string, number>>({
      USD: 1,
      INR: 83,
      EUR: 0.92,
      GBP: 0.8,
      JPY: 114,
    });

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!params.id) return;

        const [billRes, vendorRes, dealRes] = await Promise.all([
          fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/importbills/${params.id}/`),
          fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/"),
          fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/"),
        ]);

        if (!billRes.ok) throw new Error("Failed to fetch bill");
        if (!vendorRes.ok) throw new Error("Failed to fetch vendors");
        if (!dealRes.ok) throw new Error("Failed to fetch deals");

        const billData = await billRes.json();
        const vendorDataRaw = await vendorRes.json();
        const dealDataRaw = await dealRes.json();

        const vendorData: Vendor[] = vendorDataRaw.results;
        const dealData: Deal[] = dealDataRaw.results;

        // Map deal_no to deal object
        const dealObj = dealData.find((d) => d.deal_no === billData.deal_no);
        console.log(billData)

        setBill({
          id: billData.id,
          vendor: { id: billData.vendor.id, display_name: billData.vendor.display_name },
          deal: dealObj!, // store full object
          invoiceDate: billData.date,
          paymentRequest: billData.payment_request,
          paymentStatus: billData.payment_status,
          paymentRef: billData.payment_reference_no,
          paidBy: billData.paid_by,
          rows: billData.bill_items.map((r: any) => ({
            id: r.id,
            item_name: r.item_name,
            description: r.description,
            item_specification: r.item_specification,
            hsn_code: r.hsn_code,
            brand: r.brand,
            quantity: Number(r.quantity),
            unit_price: Number(r.unit_price),
          })),
        });
        setCurrency(billData.currency || "USD");
        setVendors(vendorData);
        setDeals(dealData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) return <p className="p-6 text-green-700">Loading...</p>;
  if (!bill) return <p className="p-6 text-red-700">Import Bill not found.</p>;

  const handleRowChange = <K extends keyof Row>(index: number, field: K, value: Row[K]) => {
    const updatedRows = [...bill!.rows];
  updatedRows[index][field] = value;

  // Recalculate total_price if quantity or unit_price changed
  if (field === "quantity" || field === "unit_price") {
    const quantity = updatedRows[index].quantity;
    const unit_price = updatedRows[index].unit_price;
    updatedRows[index].total_price = Number((quantity * unit_price).toFixed(2));
  }

  setBill({ ...bill!, rows: updatedRows });
};

  const addRow = () => {
    setBill({
      ...bill,
      rows: [
        ...bill.rows,
        {
          item_name: "",
          description: "",
          item_specification: "",
          hsn_code: "",
          brand: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0, // 
        },
      ],
    });
  };

  const removeRow = (index: number) => {
    const updatedRows = [...bill.rows];
    if (updatedRows[index].id) {
      updatedRows[index].deleted = true;
    } else {
      updatedRows.splice(index, 1);
    }
    setBill({ ...bill, rows: updatedRows });
  };

  const totalAmount = bill.rows
    .filter((r) => !r.deleted)
    .reduce((sum, r) => sum + r.quantity * r.unit_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      vendor_id: bill.vendor.id,
      deal_id: bill.deal.id,
      date: bill.invoiceDate,
      currency,
      payment_request: bill.paymentRequest,
      payment_status: bill.paymentStatus,
      payment_reference_no: bill.paymentRef,
      paid_by: bill.paidBy,
      bill_items: bill.rows
        .filter((r) => !r.deleted)
        .map((r) => ({
          ...(r.id ? { id: r.id } : {}), // send id only if exists
          item_name: r.item_name,
          description: r.description,
          item_specification: r.item_specification,
          hsn_code: r.hsn_code,
          brand: r.brand,
          quantity: r.quantity,
          unit_price: r.unit_price,
          total_price: Number((r.quantity * r.unit_price).toFixed(2))
        })),
    };

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/importbills/${bill.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to update bill");
      toast.success("Bill updated successfully");
      router.push("/books/purchase/import_bills");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bill");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div><Breadcrumb/></div>
      <button onClick={() => router.back()} className="flex items-center mb-4 text-green-700 hover:text-green-900">
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-green-900">Edit Import Bill</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Deal */}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Vendor</label>
            <select
              value={bill.vendor.id}
              onChange={(e) =>
                setBill({ ...bill, vendor: vendors.find((v) => v.id === Number(e.target.value))! })
              }
              className="w-full p-2 border border-green-300 rounded"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Deal</label>
            <select
              value={bill.deal.id}
              onChange={(e) => setBill({ ...bill, deal: deals.find((d) => d.id === Number(e.target.value))! })}
              className="w-full p-2 border border-green-300 rounded"
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deal_no}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Invoice Date</label>
            <input
              type="date"
              value={bill.invoiceDate}
              onChange={(e) => setBill({ ...bill, invoiceDate: e.target.value })}
              className="w-full p-2 border border-green-300 rounded"
              required
            />
          </div>
        </div>

        {/* Payment */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Payment Request</label>
            <select
              value={bill.paymentRequest}
              onChange={(e) => setBill({ ...bill, paymentRequest: e.target.value as "High" | "Low" })}
              className="w-full p-2 border border-green-300 rounded"
            >
              <option>High</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Payment Status</label>
            <select
              value={bill.paymentStatus}
              onChange={(e) =>
                setBill({ ...bill, paymentStatus: e.target.value as "Paid" | "Unpaid" | "Partially Paid" })
              }
              className="w-full p-2 border border-green-300 rounded"
            >
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Partially Paid</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-green-700">Paid By</label>
            <select
              value={bill.paidBy}
              onChange={(e) =>
                setBill({ ...bill, paidBy: e.target.value as "SBI" | "ICICI" | "IOB" | "Petty Cash" })
              }
              className="w-full p-2 border border-green-300 rounded"
            >
              <option>SBI</option>
              <option>ICICI</option>
              <option>IOB</option>
              <option>Petty Cash</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 font-semibold text-green-700">Payment Ref</label>
          <input
            type="text"
            value={bill.paymentRef || ""}
            onChange={(e) => setBill({ ...bill, paymentRef: e.target.value })}
            className="w-full p-2 border border-green-300 rounded"
          />
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-collapse border-green-200 table-auto">
            <thead className="text-green-900 bg-green-100">
              <tr>
                <th className="p-2 border border-green-300">Item</th>
                <th className="p-2 border border-green-300">Description</th>
                <th className="p-2 border border-green-300">Specification</th>
                <th className="p-2 border border-green-300">HSN Code</th>
                <th className="p-2 border border-green-300">Brand</th>
                <th className="p-2 border border-green-300">Qty</th>
                <th className="p-2 border border-green-300">Unit Price</th>
                <th className="p-2 border border-green-300">Total</th>
                <th className="p-2 border border-green-300">Remove</th>
              </tr>
            </thead>
            <tbody>
              {bill.rows.map(
                (row, index) =>
                  !row.deleted && (
                    <tr key={index}>
                      <td className="p-2 border border-green-300">
                        <input
                          type="text"
                          value={row.item_name}
                          onChange={(e) => handleRowChange(index, "item_name", e.target.value)}
                          className="w-full p-1 border border-green-200 rounded"
                        />
                      </td>
                      <td className="p-2 border border-green-300">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => handleRowChange(index, "description", e.target.value)}
                          className="w-full p-1 border border-green-200 rounded"
                        />
                      </td>
                      <td className="p-2 border border-green-300">
                        <input
                          type="text"
                          value={row.item_specification}
                          onChange={(e) => handleRowChange(index, "item_specification", e.target.value)}
                          className="w-full p-1 border border-green-200 rounded"
                        />
                      </td>
                      <td className="p-2 border border-green-300">
                        <input
                          type="text"
                          value={row.hsn_code}
                          onChange={(e) => handleRowChange(index, "hsn_code", e.target.value)}
                          className="w-full p-1 border border-green-200 rounded"
                        />
                      </td>
                      <td className="p-2 border border-green-300">
                        <input
                          type="text"
                          value={row.brand}
                          onChange={(e) => handleRowChange(index, "brand", e.target.value)}
                          className="w-full p-1 border border-green-200 rounded"
                        />
                      </td>
                      <td className="p-2 border border-green-300">
                        <input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => handleRowChange(index, "quantity", Number(e.target.value))}
                          className="w-full p-1 border border-green-200 rounded"
                        />
                      </td>
                      <td className="p-2 border border-green-300">
                        <input
                          type="number"
                          min={0}
                          value={row.unit_price}
                          onChange={(e) => handleRowChange(index, "unit_price", Number(e.target.value))}
                          className="w-full p-1 border border-green-200 rounded"
                        />
                      </td>
                      <td className="p-2 font-semibold text-green-900 border border-green-300">
                        {(row.quantity * row.unit_price).toFixed(2)}
                      </td>
                      <td className="p-2 text-center border border-green-300">
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center px-4 py-2 font-semibold text-green-800 bg-green-200 rounded hover:bg-green-300"
        >
          <Plus className="mr-2" /> Add Row
        </button>

        <div className="text-lg font-bold text-right text-green-900 mt-2">
          Total Amount: {currency} {totalAmount.toFixed(2)}
        </div>

        <button type="submit" className="px-6 py-2 text-white bg-green-700 rounded hover:bg-green-800">
          Update Bill
        </button>
      </form>
    </div>
  );
}
