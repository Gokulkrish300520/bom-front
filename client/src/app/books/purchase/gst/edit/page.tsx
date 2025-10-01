"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Purchase Entry type with GST Number
export type PurchaseEntry = {
  id: string; 
  vendor: string;
  dealNumber: string;
  item: string;
  description: string;
  itemSpecification: string;
  hsnCode: string;
  brand: string;
  quantity: number;
  unitPriceINR: number;
  total: number;
  invoiceDate: string;
  billUpload: string;
  gstNumber: string; // ✅ Added GST Number
  paymentRequest: "High" | "Low";
  paymentStatus: "Paid" | "Unpaid" | "Partially paid";
  paymentReferenceNo: string;
  paidBy: "SBI" | "ICICI" | "IOB" | "Petty Cash" | "N/A";
};

// Reusable InputField component
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  readOnly = false,
}: {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: any) => void;
  required?: boolean;
  readOnly?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-green-800">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      className={`w-full p-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500 ${
        readOnly ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
    />
  </div>
);

// Reusable SelectField component
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: any) => void;
  options: string[];
  required?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-green-800">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full p-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default function EditPurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id");

  const [formData, setFormData] = useState<PurchaseEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing entry
  useEffect(() => {
    if (entryId) {
      const storedData = localStorage.getItem("purchaseData");
      if (storedData) {
        const data: PurchaseEntry[] = JSON.parse(storedData);
        const entryToEdit = data.find((entry) => entry.id === entryId);
        if (entryToEdit) {
          setFormData({ ...entryToEdit, gstNumber: entryToEdit.gstNumber || "" });
        }
      }
    }
    setLoading(false);
  }, [entryId]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    const isNumeric = ["quantity", "unitPriceINR"].includes(name);
    setFormData((prev) => ({
      ...prev!,
      [name]: isNumeric ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData || !formData.id) {
      alert("Error: Form data is missing.");
      return;
    }

    const storedData = localStorage.getItem("purchaseData");
    if (!storedData) {
      alert("Error: Could not find data to update.");
      return;
    }

    let data: PurchaseEntry[] = JSON.parse(storedData);
    const total = (formData.quantity || 0) * (formData.unitPriceINR || 0);

    const updatedEntry: PurchaseEntry = { ...formData, total };

    const entryIndex = data.findIndex((entry) => entry.id === formData.id);

    if (entryIndex !== -1) {
      data[entryIndex] = updatedEntry;
      localStorage.setItem("purchaseData", JSON.stringify(data));
      router.push("/books/purchase/gst");
    } else {
      alert("Error: Could not find the original record to update. It may have been deleted.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading editor...</div>;
  }

  if (!formData && !loading) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Could not load the entry with the specified ID.
      </div>
    );
  }

  return (
    formData && (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-6 text-3xl font-bold text-green-800">Edit Purchase Record</h1>
          <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField label="Record ID" name="id" value={formData.id} onChange={() => {}} readOnly />
              <InputField label="Vendor" name="vendor" value={formData.vendor} onChange={handleChange} required />
              <InputField label="Deal Number" name="dealNumber" value={formData.dealNumber} onChange={handleChange} required />
              <InputField label="Item" name="item" value={formData.item} onChange={handleChange} />
              <InputField label="Description" name="description" value={formData.description} onChange={handleChange} />
              <InputField label="Item Specification" name="itemSpecification" value={formData.itemSpecification} onChange={handleChange} />
              <InputField label="HSN Code" name="hsnCode" value={formData.hsnCode} onChange={handleChange} />
              <InputField label="Brand" name="brand" value={formData.brand} onChange={handleChange} />
              <InputField label="Quantity/PCS" name="quantity" type="number" value={String(formData.quantity)} onChange={handleChange} required />
              <InputField label="Unit Price (INR)" name="unitPriceINR" type="number" value={String(formData.unitPriceINR)} onChange={handleChange} required />
              <div className="p-3 bg-green-50 rounded-md">
                <label className="block text-sm font-medium text-green-800">Total (INR)</label>
                <div className="mt-1 text-lg font-semibold text-gray-800">
                  {(formData.quantity * formData.unitPriceINR).toLocaleString("en-IN")}
                </div>
              </div>
              <InputField label="Invoice Date" name="invoiceDate" type="date" value={formData.invoiceDate} onChange={handleChange} required />
              <InputField label="Bill Upload (Filename)" name="billUpload" value={formData.billUpload} onChange={handleChange} />
              <InputField label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} /> {/* ✅ GST field */}
              <SelectField label="Payment Request" name="paymentRequest" value={formData.paymentRequest} onChange={handleChange} options={["Low", "High"]} />
              <SelectField label="Payment Status" name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} options={["Unpaid", "Partially paid", "Paid"]} />
              <InputField label="Payment Reference No" name="paymentReferenceNo" value={formData.paymentReferenceNo} onChange={handleChange} />
              <SelectField label="Paid By" name="paidBy" value={formData.paidBy} onChange={handleChange} options={["N/A", "SBI", "ICICI", "IOB", "Petty Cash"]} />
            </div>

            <div className="flex justify-end col-span-3 gap-4 pt-6 mt-8 border-t">
              <button
                type="button"
                onClick={() => router.push("/books/purchase/gst")}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Update Record
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
}