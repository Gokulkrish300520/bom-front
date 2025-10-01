"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

interface Vendor {
  id: number;
  display_name: string;
}

interface Deal {
  id: number;
  deal_no: string;
}

export default function NewFreightPage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    vendor_id: "", // change to id
    deal_id: "",   // change to id
    item: "",
    description: "",
    itemSpecification: "",
    hsnCode: "",
    brand: "",
    qty: "",
    unitPriceUSD: "",
    totalUSD: "",
    unitPriceINR: "",
    totalINR: "",
    sfNumber: "",
    date: "",
    weight: "",
    freight: "",
    currency: "USD",
  });

  const exchangeRate = 83; // USD → INR

  useEffect(() => {
    // Fetch vendors
    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/")
      .then((res) => res.json())
      .then((data) => setVendors(data.results || []))
      .catch((err) => console.error("Failed to fetch vendors", err));

    // Fetch deals
    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/")
      .then((res) => res.json())
      .then((data) => setDeals(data.results || []))
      .catch((err) => console.error("Failed to fetch deals", err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    let updatedForm = { ...formData, [name]: value };

    if (name === "unitPriceUSD" || name === "qty") {
      const qtyNum = Number(updatedForm.qty) || 0;
      const usdPriceNum = Number(updatedForm.unitPriceUSD) || 0;
      const inrPrice = usdPriceNum * exchangeRate;
      updatedForm.unitPriceINR = inrPrice.toFixed(2);
      updatedForm.totalUSD = (qtyNum * usdPriceNum).toFixed(2);
      updatedForm.totalINR = (qtyNum * inrPrice).toFixed(2);
    }

    if (name === "unitPriceINR" || name === "qty") {
      const qtyNum = Number(updatedForm.qty) || 0;
      const inrPriceNum = Number(updatedForm.unitPriceINR) || 0;
      updatedForm.totalINR = (qtyNum * inrPriceNum).toFixed(2);
    }

    setFormData(updatedForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.unitPriceUSD && (!formData.sfNumber || !formData.weight)) {
      alert("If USD value entered, SF Number and Weight are required.");
      return;
    }
    setIsSaving(true);
    const qty = Number(formData.qty);
    const unitPriceUSD = Number(formData.unitPriceUSD) || undefined;
    const unitPriceINR = Number(formData.unitPriceINR) || 0;
    const totalUSD = unitPriceUSD ? qty * unitPriceUSD : undefined;
    const totalINR = qty * unitPriceINR;

    // Prepare data with IDs as expected by backend
    const newEntry = {
      vendor_id: Number(formData.vendor_id),
      deal_id: Number(formData.deal_id),
      currency: formData.currency,
      item_name: formData.item,
      description: formData.description,
      item_specification: formData.itemSpecification,
      hsn_code: formData.hsnCode,
      brand: formData.brand,
      quantity: qty,
      unit_price_usd: unitPriceUSD,
      total_price_usd: totalUSD,
      unit_price_inr: unitPriceINR,
      total_price_inr: totalINR,
      date: formData.date,
      sf_number: formData.sfNumber || undefined,
      weight: formData.weight || undefined,
      freight_type: formData.freight || undefined,
    };

    // POST to backend instead of localStorage
    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/freights/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    })
      .then((res) => {
        setIsSaving(false);
        if (!res.ok) {
          throw new Error("Failed to create freight");
        }
        return res.json();
      })
     .then(() => {
    setTimeout(() => {
      setSuccessMessage("");
      router.push("/books/purchase/freight");
    }, 2000); // show message for 2 seconds
  })
  .catch((err) => {
    setIsSaving(false);
    alert(err.message);
  });
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">Add New Freight</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 p-6 rounded shadow md:grid-cols-2 bg-green-50"
      >
        {/* Vendor dropdown */}
        <div>
          <label className="block font-medium text-green-800">
            Vendor <span className="text-red-500">*</span>
          </label>
          <select
            name="vendor_id"
            value={formData.vendor_id}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.display_name}
              </option>
            ))}
          </select>
        </div>

        {/* Deal number dropdown */}
        <div>
          <label className="block font-medium text-green-800">
            Deal Number <span className="text-red-500">*</span>
          </label>
          <select
            name="deal_id"
            value={formData.deal_id}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Deal</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.deal_no}
              </option>
            ))}
          </select>
        </div>

        {/* Rest of fields as before but keys updated */}
        {[
          { label: "Item", name: "item", type: "text" },
          { label: "Description", name: "description", type: "text" },
          { label: "Item Specification", name: "itemSpecification", type: "text" },
          { label: "HSN Code", name: "hsnCode", type: "text" },
          { label: "Brand", name: "brand", type: "text" },
          { label: "Qty/PCS", name: "qty", type: "number", required: true },
          { label: "Unit Price (USD)", name: "unitPriceUSD", type: "number" },
          { label: "Total (USD)", name: "totalUSD", type: "number", readOnly: true },
          { label: "Unit Price (INR)", name: "unitPriceINR", type: "number" },
          { label: "Total (INR)", name: "totalINR", type: "number", readOnly: true },
          { label: "SF Number", name: "sfNumber", type: "text" },
          { label: "Date", name: "date", type: "date", required: true },
          { label: "Weight", name: "weight", type: "text" },
          { label: "Freight", name: "freight", type: "number" },
          { label: "Currency", name: "currency", type: "select" }, // keep as dropdown inside original
        ].map((field, idx) => {
          if (field.name === 'currency') {
            return null; // already handled above
          }
          return (
            <div key={idx}>
              <label className="block font-medium text-green-800">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={(formData as any)[field.name]}
                onChange={handleChange}
                readOnly={field.readOnly}
                className="w-full p-2 border rounded"
                required={field.required}
              />
            </div>
          );
        })}

        <div className="flex justify-end col-span-2 gap-4 mt-4">
          <button
            type="button"
            onClick={() => router.push("/books/purchase/freight")}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
                  <button
          type="submit"
          disabled={isSaving}
          className={`px-4 py-2 text-white rounded ${
            isSaving ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}>
          {isSaving ? "Saving..." : successMessage ? "Saved" : "Save"}
        </button>
        {successMessage && (
  <div className="mb-4 p-2 text-green-700 bg-green-100 border border-green-300 rounded">
    {successMessage}
  </div>
)}
        </div>
      </form>
    </div>
  );
}
