"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function EditDutyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const indexParam = searchParams.get("index"); // index of the duty entry to edit

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
    amountINR: "",
    airwayBillNumber: "",
    date: "",
    dealNumber2: "",
    assessableValue: "",
    igst: "",
    socialWelfare: "",
    chess: "",
    duty: "",
    addDuty: "",
    total: "",
  });

  const exchangeRate = 83; // USD → INR

  // Load data for editing
  useEffect(() => {
    if (indexParam !== null) {
      const storedData = localStorage.getItem("dutyData");
      const data = storedData ? JSON.parse(storedData) : [];
      const entry = data[Number(indexParam)];
      if (entry) {
        setFormData(entry);
      }
    }
  }, [indexParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let updatedForm = { ...formData, [name]: value };

    // Auto calculate
    if (name === "unitPriceUSD" || name === "qty") {
      const qtyNum = Number(updatedForm.qty) || 0;
      const usdPriceNum = Number(updatedForm.unitPriceUSD) || 0;
      const inrPrice = usdPriceNum * exchangeRate;
      updatedForm.unitPriceINR = inrPrice.toFixed(2);
      updatedForm.totalUSD = (qtyNum * usdPriceNum).toFixed(2);
      updatedForm.amountINR = (qtyNum * inrPrice).toFixed(2);
    }

    if (name === "unitPriceINR" || name === "qty") {
      const qtyNum = Number(updatedForm.qty) || 0;
      const inrPriceNum = Number(updatedForm.unitPriceINR) || 0;
      updatedForm.amountINR = (qtyNum * inrPriceNum).toFixed(2);
    }

    const assessable = Number(updatedForm.assessableValue) || 0;
    const igst = Number(updatedForm.igst) || 0;
    const socialWelfare = Number(updatedForm.socialWelfare) || 0;
    const chess = Number(updatedForm.chess) || 0;
    const duty = Number(updatedForm.duty) || 0;
    const addDuty = Number(updatedForm.addDuty) || 0;

    updatedForm.total = (assessable + igst + socialWelfare + chess + duty + addDuty).toFixed(2);

    setFormData(updatedForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const storedData = localStorage.getItem("dutyData");
    const data = storedData ? JSON.parse(storedData) : [];

    if (indexParam !== null) {
      data[Number(indexParam)] = formData; // update existing entry
    }

    localStorage.setItem("dutyData", JSON.stringify(data));

    router.push("/books/purchase/duty");
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">Edit Duty</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 p-6 rounded shadow md:grid-cols-2 bg-green-50"
      >
        <div>
          <label className="block font-medium text-green-800">
            Choose Vendor <span className="text-red-500">*</span>
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

        {[
          { label: "Deal Number", name: "dealNumber" },
          { label: "Item", name: "item" },
          { label: "Description", name: "description" },
          { label: "Item Specification", name: "itemSpecification" },
          { label: "HSN Code", name: "hsnCode" },
          { label: "Brand", name: "brand" },
          { label: "Qty/PCS", name: "qty", type: "number" },
          { label: "Unit Price (USD)", name: "unitPriceUSD", type: "number" },
          { label: "Total (USD)", name: "totalUSD", type: "number", readOnly: true },
          { label: "Unit Price (INR)", name: "unitPriceINR", type: "number" },
          { label: "Amount INR", name: "amountINR", type: "number", readOnly: true },
          { label: "Airway Bill Number", name: "airwayBillNumber" },
          { label: "Date", name: "date", type: "date" },
          { label: "Deal Number", name: "dealNumber2" },
          { label: "Assessable Value", name: "assessableValue", type: "number" },
          { label: "IGST", name: "igst", type: "number" },
          { label: "Social Welfare", name: "socialWelfare", type: "number" },
          { label: "Chess", name: "chess", type: "number" },
          { label: "Duty", name: "duty", type: "number" },
          { label: "Add. Duty", name: "addDuty", type: "number" },
          { label: "Total", name: "total", type: "number", readOnly: true },
        ].map((field, idx) => (
          <div key={idx}>
            <label className="block font-medium text-green-800">{field.label}</label>
            <input
              type={field.type || "text"}
              name={field.name}
              value={(formData as any)[field.name]}
              onChange={handleChange}
              readOnly={field.readOnly}
              className="w-full p-2 border rounded"
            />
          </div>
        ))}

        <div className="flex justify-end col-span-2 gap-4 mt-4">
          <button
            type="button"
            onClick={() => router.push("/books/purchase/duty")}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
}