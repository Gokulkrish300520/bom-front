"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

export default function EditFreightPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [vendors, setVendors] = useState<{id: number; display_name: string}[]>([]);
  const [deals, setDeals] = useState<{id: number; deal_no: string}[]>([]);

  const [formData, setFormData] = useState({
    vendor_id: 0,
    deal_id: 0,
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
  });

  const exchangeRate = 83;

  useEffect(() => {
    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/")
      .then(res => res.json())
      .then(data => setVendors(data.results || []))
      .catch(console.error);

    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/")
      .then(res => res.json())
      .then(data => setDeals(data.results || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (id) {
      fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/freights/${id}/`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch freight entry");
          return res.json();
        })
        .then(freight => {
          setFormData(prev => ({
          ...prev,
          vendor: freight.vendor.display_name,
          // ...
          deal_id: 0, // placeholder
          dealNumber: freight.deal_no,
          // other fields
        }));
        fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/deals/?deal_no=${freight.deal_no}`)
          .then(res => res.json())
          .then(data => {
            if (data.results && data.results.length > 0) {
              const matchedDeal = data.results[0];
              setFormData(prev => ({
                ...prev,
                deal_id: matchedDeal.id,
              }));
            }
          });
          setFormData({
            vendor_id: freight.vendor.id,
            deal_id: freight.deal_id, // assuming deal_id exists in response
            item: freight.item_name,
            description: freight.description,
            itemSpecification: freight.item_specification,
            hsnCode: freight.hsn_code,
            brand: freight.brand,
            qty: freight.quantity,
            unitPriceUSD: freight.unit_price_usd || "",
            totalUSD: freight.total_price_usd || "",
            unitPriceINR: freight.unit_price_inr,
            totalINR: freight.total_price_inr,
            sfNumber: freight.sf_number || "",
            date: freight.date,
            weight: freight.weight || "",
            freight: freight.freight_type || "",
          });
        })
        .catch(console.error);
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const updatedEntry = {
      vendor_id: Number(formData.vendor_id),
      deal_id: Number(formData.deal_id),
      item_name: formData.item,
      description: formData.description,
      item_specification: formData.itemSpecification,
      hsn_code: formData.hsnCode,
      brand: formData.brand,
      quantity: Number(formData.qty),
      unit_price_usd: Number(formData.unitPriceUSD),
      total_price_usd: Number(formData.totalUSD),
      unit_price_inr: Number(formData.unitPriceINR),
      total_price_inr: Number(formData.totalINR),
      sf_number: formData.sfNumber || undefined,
      date: formData.date,
      weight: Number(formData.weight),
      freight_type: formData.freight || undefined,
    };

    fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/freights/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedEntry),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to update freight");
        router.push("/books/purchase/freight");
      })
      .catch(err => alert(err.message));
  };


  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">Edit Freight Entry</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 p-6 rounded shadow md:grid-cols-2 bg-green-50">
        <div>
          <label className="block font-medium text-green-800 mb-1">Vendor</label>
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

        <div>
          <label className="block font-medium text-green-800 mb-1">Deal Number</label>
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

        {[
          { label: "Item", name: "item", type: "text" },
          { label: "Description", name: "description", type: "text" },
          { label: "Item Specification", name: "itemSpecification", type: "text" },
          { label: "HSN Code", name: "hsnCode", type: "text" },
          { label: "Brand", name: "brand", type: "text" },
          { label: "Qty/PCS", name: "qty", type: "number" },
          { label: "Unit Price (USD)", name: "unitPriceUSD", type: "number" },
          { label: "Total (USD)", name: "totalUSD", type: "number", readOnly: true },
          { label: "Unit Price (INR)", name: "unitPriceINR", type: "number" },
          { label: "Total (INR)", name: "totalINR", type: "number", readOnly: true },
          { label: "SF Number", name: "sfNumber", type: "text" },
          { label: "Date", name: "date", type: "date" },
          { label: "Weight", name: "weight", type: "text" },
          { label: "Freight", name: "freight", type: "number" },
        ].map((field, idx) => (
          <div key={idx}>
            <label className="block font-medium text-green-800">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={(formData as any)[field.name]}
              onChange={handleChange}
              readOnly={field.readOnly ?? false}
              className="w-full p-2 border rounded"
            />
          </div>
        ))}

        <div className="flex justify-end col-span-2 gap-4 mt-4">
          <button
            type="button"
            onClick={() => router.push("/books/purchase/freight")}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Update</button>
        </div>
      </form>
    </div>
  );
}
