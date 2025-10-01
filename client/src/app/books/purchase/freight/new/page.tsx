"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFreightPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    vendor: "",
    dealNumber: "",
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
    currency: "USD", // NEW FIELD
  });

  const exchangeRate = 83; // USD → INR

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

    const qty = Number(formData.qty);
    const unitPriceUSD = Number(formData.unitPriceUSD) || undefined;
    const unitPriceINR = Number(formData.unitPriceINR) || 0;
    const totalUSD = unitPriceUSD ? qty * unitPriceUSD : undefined;
    const totalINR = qty * unitPriceINR;

    const newEntry = {
      vendor: formData.vendor,
      dealNumber: formData.dealNumber,
      item: formData.item,
      description: formData.description,
      itemSpecification: formData.itemSpecification,
      hsnCode: formData.hsnCode,
      brand: formData.brand,
      qty,
      unitPriceUSD,
      totalUSD,
      unitPriceINR,
      totalINR,
      sfNumber: formData.sfNumber || undefined,
      date: formData.date,
      weight: formData.weight || undefined,
      freight: Number(formData.freight) || undefined,
      currency: formData.currency,
    };

    const storedData = localStorage.getItem("freightData");
    const data = storedData ? JSON.parse(storedData) : [];
    data.push(newEntry);
    localStorage.setItem("freightData", JSON.stringify(data));

    router.push("/books/purchase/freight");
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">
        Add New Freight
      </h1>

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
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Vendor</option>
            <option value="Vendor A">Vendor A</option>
            <option value="Vendor B">Vendor B</option>
            <option value="Vendor C">Vendor C</option>
          </select>
        </div>

        {/* Currency dropdown */}
        <div>
          <label className="block font-medium text-green-800">
            Currency <span className="text-red-500">*</span>
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
          </select>
        </div>

        {/* Rest of the fields */}
        {[
          { label: "Deal Number", name: "dealNumber", type: "text", required: true },
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
        ].map((field, idx) => (
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
        ))}

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
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}