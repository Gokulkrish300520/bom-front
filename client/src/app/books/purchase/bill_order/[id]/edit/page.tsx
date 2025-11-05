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
  brand: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  deleted?: boolean;
}

interface Deal {
  id: number;
  deal_no: string;
}

interface Vendor {
  id: number;
  display_name: string;
}

interface BillOrder {
  id: number;
  vendor: Vendor;
  deal_no: string;
  deal_id?: number | null;
  bill_number: string;
  status: string;
  bill_date: string;
  due_date: string;
  notes: string;
  subtotal: number;
  tax_type: string;
  tax_percentage: number;
  adjustments: number;
  total_amount: number;
  amount_to_pay: number;
  billorder_items: Row[];
  payment_request: string;
  payment_status: string;
  transactions: Array<{
    amount: number;
    paid_by: string;
    payment_reference_no: string;
    payment_option: string;
  }>;
}

export default function EditBillOrderPage() {
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState<BillOrder | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOption, setPaymentOption] = useState<"Low" | "High">("Low");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!params.id) return;

        const [billRes, vendorRes, dealRes] = await Promise.all([
          fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/billorders/${params.id}/`),
          fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/"),
          fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/"),
        ]);

        if (!billRes.ok) throw new Error("Failed to fetch bill order");
        if (!vendorRes.ok) throw new Error("Failed to fetch vendors");
        if (!dealRes.ok) throw new Error("Failed to fetch deals");

        const billData = await billRes.json();
        const vendorDataRaw = await vendorRes.json();
        const dealDataRaw = await dealRes.json();

        const vendorData: Vendor[] = vendorDataRaw.results;
        const dealData: Deal[] = dealDataRaw.results;

        const vendorObj = vendorData.find((v) => v.display_name === billData.vendor);
        const dealObj = dealData.find((d) => d.deal_no === billData.deal_no);

        setBill({
          id: billData.id,
          vendor: vendorObj || { id: 0, display_name: billData.vendor },
          deal_no: billData.deal_no,
          deal_id: dealObj ? dealObj.id : null,
          bill_number: billData.bill_number,
          status: billData.status,
          bill_date: billData.bill_date,
          due_date: billData.due_date,
          notes: billData.notes,
          subtotal: Number(billData.subtotal),
          tax_type: billData.tax_type,
          tax_percentage: Number(billData.tax_percentage),
          adjustments: Number(billData.adjustments),
          total_amount: Number(billData.total_amount),
          amount_to_pay: Number(billData.amount_to_pay),
          transactions: billData.transactions,
          payment_request: billData.payment_request,
          payment_status: billData.payment_status,
          billorder_items: billData.billorder_items.map((r: any) => ({
            id: r.id,
            item_name: r.item_name,
            description: r.description,
            item_specification: r.item_specification,
            brand: r.brand,
            hsn_code: r.hsn_code,
            quantity: Number(r.quantity),
            unit_price: Number(r.unit_price),
            total_price: Number(r.total_price),
          })),
        });
        console.log(billData.transactions);

        setPaymentOption(billData.payment_request || "High");
        console.log(paymentOption);
        setVendors(vendorData);
        setDeals(dealData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load bill order data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) return <p className="p-6 text-green-700">Loading...</p>;
  if (!bill) return <p className="p-6 text-red-700">Bill order not found.</p>;

  // Row update
  const handleRowChange = <K extends keyof Row>(index: number, field: K, value: Row[K]) => {
    const updatedRows = [...bill.billorder_items];
    updatedRows[index][field] = value;

    if (field === "quantity" || field === "unit_price") {
      const q = updatedRows[index].quantity;
      const p = updatedRows[index].unit_price;
      updatedRows[index].total_price = Number((q * p).toFixed(2));
    }

    setBill({ ...bill, billorder_items: updatedRows });
  };

  // Add item row
  const addRow = () => {
    setBill({
      ...bill,
      billorder_items: [
        ...bill.billorder_items,
        {
          item_name: "",
          description: "",
          item_specification: "",
          brand: "",
          hsn_code: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
        },
      ],
    });
  };

  // Remove item row
  const removeRow = (index: number) => {
    const updatedRows = [...bill.billorder_items];
    if (updatedRows[index].id) {
      updatedRows[index].deleted = true;
    } else {
      updatedRows.splice(index, 1);
    }
    setBill({ ...bill, billorder_items: updatedRows });
  };

  // Calculate totals
  const itemsTotal = bill.billorder_items.filter((r) => !r.deleted).reduce((s, r) => s + r.total_price, 0);
  const totalAmount = itemsTotal + bill.adjustments + (itemsTotal * bill.tax_percentage) / 100;

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      vendor_id: bill.vendor.id,
      deal_id: bill.deal_id,
      bill_number: bill.bill_number,
      status: bill.status,
      bill_date: bill.bill_date,
      due_date: bill.due_date,
      notes: bill.notes,
      subtotal: itemsTotal,
      tax_type: bill.tax_type,
      tax_percentage: bill.tax_percentage,
      adjustments: bill.adjustments,
      total_amount: totalAmount,
      amount_to_pay: totalAmount,
      payment_request: paymentOption,
      transactions: bill.transactions,
      payment_status: bill.payment_status,
      billorder_items: bill.billorder_items
        .filter((r) => !r.deleted)
        .map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          item_name: r.item_name,
          description: r.description,
          item_specification: r.item_specification,
          brand: r.brand,
          hsn_code: r.hsn_code,
          quantity: r.quantity,
          unit_price: r.unit_price,
          total_price: r.total_price,
        })),
    };

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/billorders/${bill.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to update bill order");
      router.push("/books/purchase/bill_order");
      toast.success("Bill order updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bill order");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div><Breadcrumb /></div>
      <button onClick={() => router.back()} className="flex items-center mb-4 text-green-700 hover:text-green-900">
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-green-900">Edit Bill Order</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Deal */}
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
            <label className="block mb-1 font-semibold text-green-700">Deal Number</label>
            <select
              value={bill.deal_id || ""}
              onChange={(e) => {
                const selectedDeal = deals.find((d) => d.id === Number(e.target.value));
                setBill({
                  ...bill,
                  deal_id: selectedDeal?.id || null,
                  deal_no: selectedDeal?.deal_no || bill.deal_no,
                });
              }}
              className="w-full p-2 border border-green-300 rounded"
            >
              <option value={bill.deal_id || ""}>{bill.deal_no}</option>
              {deals
                .filter((d) => d.deal_no !== bill.deal_no)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deal_no}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Dates and Notes */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Bill Date</label>
            <input
              type="date"
              value={bill.bill_date}
              onChange={(e) => setBill({ ...bill, bill_date: e.target.value })}
              className="w-full p-2 border border-green-300 rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Due Date</label>
            <input
              type="date"
              value={bill.due_date}
              onChange={(e) => setBill({ ...bill, due_date: e.target.value })}
              className="w-full p-2 border border-green-300 rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Notes</label>
            <input
              type="text"
              value={bill.notes}
              onChange={(e) => setBill({ ...bill, notes: e.target.value })}
              className="w-full p-2 border border-green-300 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Bill No</label>
            <input
              type="text"
              value={bill.bill_number}
              onChange={(e) => setBill({ ...bill, bill_number: e.target.value })}
              className="w-full p-2 border border-green-300 rounded"
              required
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-collapse border-green-200 table-auto">
            <thead className="text-green-900 bg-green-100">
              <tr>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Specification</th>
                <th className="p-2 border">HSN Code</th>
                <th className="p-2 border">Brand</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Unit Price</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Remove</th>
              </tr>
            </thead>
            <tbody>
              {bill.billorder_items.map(
                (row, i) =>
                  !row.deleted && (
                    <tr key={i}>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={row.item_name}
                          onChange={(e) => handleRowChange(i, "item_name", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => handleRowChange(i, "description", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={row.item_specification}
                          onChange={(e) => handleRowChange(i, "item_specification", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={row.hsn_code}
                          onChange={(e) => handleRowChange(i, "hsn_code", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={row.brand}
                          onChange={(e) => handleRowChange(i, "brand", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleRowChange(i, "quantity", Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={row.unit_price}
                          onChange={(e) => handleRowChange(i, "unit_price", Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border font-semibold">{(row.quantity * row.unit_price).toFixed(2)}</td>
                      <td className="p-2 text-center border">
                        <button type="button" onClick={() => removeRow(i)} className="text-red-600 hover:text-red-800">
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
          <Plus className="mr-2" /> Add Item
        </button>

        <div className="text-lg font-bold text-right text-green-900 mt-2">
          Items Total: {itemsTotal.toFixed(2)} | Total Amount: {totalAmount.toFixed(2)}
        </div>

        <div className="grid md:grid-cols-4 gap-4 bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
        <label>
                Payment Option:
                <select value={paymentOption} onChange={(e) => setPaymentOption(e.target.value as "Low" | "High")} className="border border-green-400 rounded p-1 ml-2">
                  <option value="Low">Low</option>
                  <option value="High">High</option>
                </select>
              </label>
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Payment Status</label>
          <select
            name="paymentStatus"
            value={bill.payment_status}
            onChange={(e => setBill({...bill, payment_status: e.target.value}))}
            className="border p-2 rounded w-full"
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Paid Partially">Partially Paid</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Paid By</label>
          <select
            name="paid_by"
            value={bill.transactions[0].paid_by}
            onChange={(e => {
              const updatedTransactions = [...bill.transactions];
              updatedTransactions[0].paid_by = e.target.value;
              setBill({...bill, transactions: updatedTransactions});
            }
            )}
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
            value={bill.transactions[0].payment_reference_no}
            onChange={(e => {
              const updatedTransactions = [...bill.transactions];
              updatedTransactions[0].payment_reference_no = e.target.value;
              setBill({...bill, transactions: updatedTransactions});
            
            })}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

        <button type="submit" className="px-6 py-2 text-white bg-green-700 rounded hover:bg-green-800">
          Update Bill Order
        </button>
      </form>
    </div>
  );
}
