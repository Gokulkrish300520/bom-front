"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/auth/tokenservice";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface Vendor {
  id: number;
  display_name: string;
}

interface Deal {
  id: number;
  deal_no: string;
}

interface Row {
  id?: number;
  sf_number: string;
  weight: number;
  freight_type: string;
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

export default function EditFreightPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const currencyOptions = ["USD", "INR", "EUR", "GBP", "AUD", "CAD", "JPY"];
  const [selectedDeal, setSelectedDeal] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;

      try {
        const [freightRes, vendorsRes, dealsRes] = await Promise.all([
          fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/freights/${params.id}/`),
          fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/"),
          fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/"),
        ]);

        if (!freightRes.ok) throw new Error("Failed to fetch freight");
        if (!vendorsRes.ok) throw new Error("Failed to fetch vendors");
        if (!dealsRes.ok) throw new Error("Failed to fetch deals");

        const freightData = await freightRes.json();
        const vendorData: Vendor[] = (await vendorsRes.json()).results;
        const dealData: Deal[] = (await dealsRes.json()).results;

        // Map deal_no to deal object
        const dealObj = dealData.find(d => d.deal_no === freightData.deal_no);

        setVendors(vendorData);
        setDeals(dealData);
        setSelectedVendor(freightData.vendor.id);
        setSelectedDeal(dealObj?.id || null);
        setDate(freightData.date);
        setCurrency(freightData.currency);

        const mappedItems = freightData.items.map((i: any) => ({
          ...i,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          total_price: Number(i.total_price),
        }));
        setRows(mappedItems);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load freight data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) return <p className="p-6 text-green-700">Loading...</p>;

  const handleRowChange = <K extends keyof Row>(index: number, field: K, value: Row[K]) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;

    if (field === "quantity" || field === "unit_price") {
      updatedRows[index].total_price = Number(
        (updatedRows[index].quantity * updatedRows[index].unit_price).toFixed(2)
      );
    }

    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        sf_number: "",
        weight: 0,
        freight_type: "air",
        item_name: "",
        description: "",
        item_specification: "",
        hsn_code: "",
        brand: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  const removeRow = (index: number) => {
    const updatedRows = [...rows];
    if (updatedRows[index].id) {
      updatedRows[index].deleted = true;
    } else {
      updatedRows.splice(index, 1);
    }
    setRows(updatedRows);
  };

  const totalAmount = rows.filter(r => !r.deleted).reduce((sum, r) => sum + r.total_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVendor || !selectedDeal) {
      toast.error("Vendor and Deal are required");
      return;
    }

    const payload = {
      vendor_id: selectedVendor,
      deal_id: selectedDeal,
      date,
      currency,
      items: rows
        .filter(r => !r.deleted)
        .map(r => ({
          ...(r.id ? { id: r.id } : {}),
          sf_number: r.sf_number,
          weight: r.weight,
          freight_type: r.freight_type,
          item_name: r.item_name,
          description: r.description,
          item_specification: r.item_specification,
          hsn_code: r.hsn_code,
          brand: r.brand,
          quantity: r.quantity,
          unit_price: r.unit_price,
          total_price: r.total_price,
        })),
    };

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/freights/${params.id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to update freight");
      toast.success("Freight updated successfully");
      router.push("/books/purchase/freight");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update freight");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <button
        onClick={() => router.back()}
        className="flex items-center mb-4 text-green-700 hover:text-green-900"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-green-900">Edit Freight</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Deal */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-semibold text-green-700">Vendor</label>
            <select
              value={selectedVendor || ""}
              onChange={(e) => setSelectedVendor(Number(e.target.value))}
              className="w-full p-2 border border-green-300 rounded"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Deal</label>
            <select
              value={selectedDeal || ""}
              onChange={(e) => setSelectedDeal(Number(e.target.value))}
              className="w-full p-2 border border-green-300 rounded"
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.deal_no}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-green-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-green-300 rounded"
            />
          </div>

          <div>
          <label className="block mb-1 font-semibold text-green-700">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full p-2 border border-green-300 rounded"
          >
            {currencyOptions.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </div>
        </div>


        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-collapse border-green-200 table-auto">
            <thead className="text-green-900 bg-green-100">
              <tr>
                <th className="p-2 border border-green-300">SF Number</th>
                <th className="p-2 border border-green-300">Weight</th>
                <th className="p-2 border border-green-300">Freight Type</th>
                <th className="p-2 border border-green-300">Item Name</th>
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
              {rows.map((row, index) =>
                !row.deleted && (
                  <tr key={index}>
                    <td className="p-2 border border-green-300">
                      <input
                        type="text"
                        value={row.sf_number}
                        onChange={(e) => handleRowChange(index, "sf_number", e.target.value)}
                        className="w-full p-1 border border-green-200 rounded"
                      />
                    </td>
                    <td className="p-2 border border-green-300">
                      <input
                        type="number"
                        value={row.weight}
                        onChange={(e) => handleRowChange(index, "weight", Number(e.target.value))}
                        className="w-full p-1 border border-green-200 rounded"
                      />
                    </td>
                    <td className="p-2 border border-green-300">
                      <select
                        value={row.freight_type}
                        onChange={(e) => handleRowChange(index, "freight_type", e.target.value)}
                        className="w-full p-1 border border-green-200 rounded"
                      >
                        <option value="air">Air</option>
                        <option value="water">Water</option>
                        <option value="road">Road</option>
                      </select>
                    </td>
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
                      {row.total_price.toFixed(2)}
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
          Update Freight
        </button>
      </form>
    </div>
  );
}
