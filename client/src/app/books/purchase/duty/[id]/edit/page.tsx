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
  assessable_value?: number;
  igst: number;
  social_welfare: number;
  cess: number;
  duty_amount: number;
  addl_duty: number;
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

interface Duty {
  id: number;
  vendor: Vendor;
  deal_no: string;
  deal_id?:number | null;
  currency: "USD" | "INR";
  date: string;
  airway_bill: string;
  assessable_value: number;
  igst: number;
  social_welfare: number;
  cess: number;
  duty: number;
  addl_duty: number;
  total: number;
  duty_items: Row[];
  paymentRequest: "Low" | "High";
  paymentStatus: "Unpaid" | "Paid" | "Partially Paid";
  paidBy: string;
  paymentRef: string;
}

export default function EditDutyPage() {
  const router = useRouter();
  const params = useParams();
  const [duty, setDuty] = useState<Duty | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!params.id) return;

        const [dutyRes, vendorRes,dealRes] = await Promise.all([
          fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/duties/${params.id}/`),
          fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/"),
          fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/"),
        ]);

        if (!dutyRes.ok) throw new Error("Failed to fetch duty");
        if (!vendorRes.ok) throw new Error("Failed to fetch vendors");
        if (!dealRes.ok) throw new Error("Failed to fetch deals");


        const dutyData = await dutyRes.json();
        const vendorDataRaw = await vendorRes.json();
        const dealDataRaw = await dealRes.json();

        const vendorData: Vendor[] = vendorDataRaw.results;
        const dealData: Deal[] = dealDataRaw.results;

        // Find vendor object
        const vendorObj = vendorData.find((v) => v.display_name === dutyData.vendor);
        const dealObj = dealData.find((d) => d.deal_no === dutyData.deal_no);

        setDuty({
          id: dutyData.id,
          vendor: vendorObj || { id: 0, display_name: dutyData.vendor },
          deal_no: dutyData.deal_no,
          currency: dutyData.currency,
          date: dutyData.date,
          airway_bill: dutyData.airway_bill,
          assessable_value: Number(dutyData.assessable_value),
          igst: Number(dutyData.igst),
          social_welfare: Number(dutyData.social_welfare),
          cess: Number(dutyData.cess),
          duty: Number(dutyData.duty),
          addl_duty: Number(dutyData.addl_duty),
          total: Number(dutyData.total),
          duty_items: dutyData.duty_items.map((r: any) => ({
            id: r.id,
            item_name: r.item_name,
            description: r.description,
            item_specification: r.item_specification,
            brand: r.brand,
            hsn_code: r.hsn_code,
            quantity: Number(r.quantity),
            unit_price: Number(r.unit_price),
            total_price: Number(r.total_price),
            assessable_value: Number(r.assessable_value),
            igst: Number(r.igst),
            social_welfare: Number(r.social_welfare),
            cess: Number(r.cess),
            duty_amount: Number(r.duty_amount),
            addl_duty: Number(r.addl_duty),
          })),
          deal_id: dealObj ? dealObj.id : null,
          paymentRequest: dutyData.payment_request || "Low",
          paymentStatus: dutyData.payment_status || "Unpaid",
          paidBy: dutyData.paid_by || "",
          paymentRef: dutyData.payment_reference_no || "",
        } as Duty & { deal_id?: number });

        setVendors(vendorData);
        setDeals(dealData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load duty data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) return <p className="p-6 text-green-700">Loading...</p>;
  if (!duty) return <p className="p-6 text-red-700">Duty not found.</p>;

  // Row update
  const handleRowChange = <K extends keyof Row>(index: number, field: K, value: Row[K]) => {
    const updatedRows = [...duty!.duty_items];
    updatedRows[index][field] = value;

    if (field === "quantity" || field === "unit_price") {
      const q = updatedRows[index].quantity;
      const p = updatedRows[index].unit_price;
      updatedRows[index].total_price = Number((q * p).toFixed(2));
    }

    setDuty({ ...duty!, duty_items: updatedRows });
  };

  // Add item row
  const addRow = () => {
    setDuty({
      ...duty!,
      duty_items: [
        ...duty!.duty_items,
        {
          item_name: "",
          description: "",
          item_specification: "",
          brand: "",
          hsn_code: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          assessable_value: 0,
          igst: 0,
          social_welfare: 0,
          cess: 0,
          duty_amount: 0,
          addl_duty: 0,
        },
      ],
    });
  };

  // Remove item row
  const removeRow = (index: number) => {
    const updatedRows = [...duty!.duty_items];
    if (updatedRows[index].id) {
      updatedRows[index].deleted = true;
    } else {
      updatedRows.splice(index, 1);
    }
    setDuty({ ...duty!, duty_items: updatedRows });
  };

  // Total recalc
  const itemsTotal = duty.duty_items.filter((r) => !r.deleted).reduce((s, r) => s + r.total_price, 0);
  const dutyTotal =
    duty.assessable_value + duty.igst + duty.social_welfare + duty.cess + duty.duty + duty.addl_duty;

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      vendor_id: duty.vendor.id,
      deal_id: duty.deal_id,
      currency: duty.currency,
      date: duty.date,
      airway_bill: duty.airway_bill,
      assessable_value: duty.assessable_value,
      igst: duty.igst,
      social_welfare: duty.social_welfare,
      cess: duty.cess,
      duty: duty.duty,
      addl_duty: duty.addl_duty,
      total: dutyTotal,
      payment_request: duty.paymentRequest,
      payment_status: duty.paymentStatus,
      paid_by: duty.paidBy,
      payment_reference_no: duty.paymentRef,
      duty_items: duty.duty_items
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
          assessable_value: r.assessable_value,
          igst: r.igst,
          social_welfare: r.social_welfare,
          cess: r.cess,
          duty_amount: r.duty_amount,
          addl_duty: r.addl_duty,
        })),
    };

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/duties/${duty.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to update duty");
      router.push("/books/purchase/duty");
      toast.success("Duty updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update duty");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div> <Breadcrumb/></div>
      <button onClick={() => router.back()} className="flex items-center mb-4 text-green-700 hover:text-green-900">
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-green-900">Edit Duty</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Deal */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Vendor</label>
            <select
              value={duty.vendor.id}
              onChange={(e) =>
                setDuty({ ...duty, vendor: vendors.find((v) => v.id === Number(e.target.value))! })
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
          value={duty.deal_id || ""}
          onChange={(e) => {
            const selectedDeal = deals.find((d) => d.id === Number(e.target.value));
            setDuty({
              ...duty,
              deal_id: selectedDeal?.id || null,
              deal_no: selectedDeal?.deal_no || duty.deal_no,
            });
          }}
          className="w-full p-2 border border-green-300 rounded"
        >
          {/* Current deal first */}
          <option value={duty.deal_id || ""}>{duty.deal_no}</option>
          {/* Other deals */}
          {deals
            .filter((d) => d.deal_no !== duty.deal_no)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.deal_no}
              </option>
            ))}
        </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Currency</label>
            <select
              value={duty.currency}
              onChange={(e) => setDuty({ ...duty, currency: e.target.value as "USD" | "INR" })}
              className="w-full p-2 border border-green-300 rounded"
            >
              <option>USD</option>
              <option>INR</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Invoice Date</label>
            <input
              type="date"
              value={duty.date}
              onChange={(e) => setDuty({ ...duty, date: e.target.value })}
              className="w-full p-2 border border-green-300 rounded"
              required
            />
          </div>
        </div>

        {/* Other Fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "Airway Bill", name: "airway_bill", type: "text" },
          ].map((f, i) => (
            <div key={i}>
              <label className="block mb-1 font-semibold text-green-700">{f.label}</label>
              <input
              type={f.type}
              value={
                f.type === "number"
                  ? Number.isFinite((duty as any)[f.name])
                    ? (duty as any)[f.name]
                    : ""
                  : ((duty as any)[f.name] ?? "")
              }
              onChange={(e) =>
                setDuty({
                  ...duty,
                  [f.name]:
                    f.type === "number"
                      ? (e.target.value !== "" ? Number(e.target.value) : 0)
                      : e.target.value, // ✅ text remains editable
                })
              }
              className="w-full p-2 border border-green-300 rounded"
            />
            </div>
          ))}
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
                <th className="p-2 border">Assessable</th>
                <th className="p-2 border">IGST</th>
                <th className="p-2 border">SWS</th>
                <th className="p-2 border">Cess</th>
                <th className="p-2 border">Duty</th>
                <th className="p-2 border">Addl Duty</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Remove</th>
              </tr>
            </thead>
            <tbody>
              {duty.duty_items.map(
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
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={row.assessable_value}
                          onChange={(e) => handleRowChange(i, "assessable_value", Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={row.igst}
                          onChange={(e) => handleRowChange(i, "igst", Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={row.social_welfare}
                          onChange={(e) => handleRowChange(i, "social_welfare", Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={row.cess}
                          onChange={(e) => handleRowChange(i, "cess", Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={row.duty_amount}
                          onChange={(e) => handleRowChange(i, "duty_amount", Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={row.addl_duty}
                          onChange={(e) => handleRowChange(i, "addl_duty", Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border font-semibold">
                        {(row.quantity * row.unit_price).toFixed(2)}
                      </td>
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
          Items Total: {itemsTotal.toFixed(2)} | Duty Total: {dutyTotal.toFixed(2)}
        </div>

        <div className="grid md:grid-cols-4 gap-4 bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Payment Request</label>
          <select
            name="paymentRequest"
            value={duty.paymentRequest}
            onChange={(e) =>
              setDuty({ ...duty, paymentRequest: e.target.value as "Low" | "High" })
            }
            className="border p-2 rounded w-full"
          >
            <option value="Low">Low</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Payment Status</label>
          <select
            name="paymentStatus"
            value={duty.paymentStatus}
            onChange={(e) =>
              setDuty({ ...duty, paymentStatus: e.target.value as "Unpaid" | "Paid" | "Partially Paid" })
            }
            className="border p-2 rounded w-full"
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-green-700 font-semibold">Paid By</label>
          <select
            name="paidBy"
            value={duty.paidBy}
            onChange={(e) =>
              setDuty({ ...duty, paidBy: e.target.value })
            }
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
            value={duty.paymentRef}
            onChange={(e) =>
              setDuty({ ...duty, paymentRef: e.target.value })
            }
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

        <button type="submit" className="px-6 py-2 text-white bg-green-700 rounded hover:bg-green-800">
          Update Duty
        </button>
      </form>
    </div>
  );
}
