"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Define the type for a single purchase entry with an ID
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
}: {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
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
      className="w-full p-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500"
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
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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

// Main form component
export default function NewEntryForm({
  onSave = () => {},
  onCancel = () => {},
}: {
  onSave?: (entry: PurchaseEntry) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();

  // Default empty entry (without id and total)
  const emptyEntry: Omit<PurchaseEntry, "id" | "total"> = {
    vendor: "",
    dealNumber: "",
    item: "",
    description: "",
    itemSpecification: "",
    hsnCode: "",
    brand: "",
    quantity: 0,
    unitPriceINR: 0,
    invoiceDate: "",
    billUpload: "",
    gstNumber: "", // ✅ GST field
    paymentRequest: "Low",
    paymentStatus: "Unpaid",
    paymentReferenceNo: "",
    paidBy: "N/A",
  };

  const [formData, setFormData] = useState(emptyEntry);

  // Handle input/select changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const isNumeric = name === "quantity" || name === "unitPriceINR";
    setFormData((prev) => ({
      ...prev,
      [name]: isNumeric ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.quantity * formData.unitPriceINR;
    const newEntry: PurchaseEntry = {
      ...formData,
      id: uuidv4(), // Generate UUID
      total,
    };

    // Save to localStorage
    const storedData = localStorage.getItem("purchaseData");
    const data: PurchaseEntry[] = storedData ? JSON.parse(storedData) : [];
    data.push(newEntry);
    localStorage.setItem("purchaseData", JSON.stringify(data));

    onSave(newEntry);
    router.push("/books/purchase/gst"); // navigate back after saving
  };

  // Handle cancel button
  const handleCancel = () => {
    onCancel();
    router.push("/books/purchase/gst");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8">
          <h2 className="mb-6 text-2xl font-bold text-green-700">
            Add New Purchase Record
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <InputField
              label="Vendor"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              required
            />
            <InputField
              label="Deal Number"
              name="dealNumber"
              value={formData.dealNumber}
              onChange={handleChange}
              required
            />
            <InputField
              label="Item"
              name="item"
              value={formData.item}
              onChange={handleChange}
            />
            <InputField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
            <InputField
              label="Item Specification"
              name="itemSpecification"
              value={formData.itemSpecification}
              onChange={handleChange}
            />
            <InputField
              label="HSN Code"
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleChange}
            />
            <InputField
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
            />
            <InputField
              label="Quantity/PCS"
              name="quantity"
              type="number"
              value={String(formData.quantity)}
              onChange={handleChange}
              required
            />
            <InputField
              label="Unit Price (INR)"
              name="unitPriceINR"
              type="number"
              value={String(formData.unitPriceINR)}
              onChange={handleChange}
              required
            />
            <div className="p-3 rounded-md bg-green-50">
              <label className="block text-sm font-medium text-green-800">
                Total (INR)
              </label>
              <div className="mt-1 text-lg font-semibold text-gray-800">
                {(formData.quantity * formData.unitPriceINR).toLocaleString(
                  "en-IN"
                )}
              </div>
            </div>
            <InputField
              label="Invoice Date"
              name="invoiceDate"
              type="date"
              value={formData.invoiceDate}
              onChange={handleChange}
              required
            />
            <InputField
              label="Bill Upload"
              name="billUpload"
              type="file"
              value={formData.billUpload}
              onChange={handleChange}
            />
            <InputField
              label="GST Number"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
            />
            <SelectField
              label="Payment Request"
              name="paymentRequest"
              value={formData.paymentRequest}
              onChange={handleChange}
              options={["Low", "High"]}
            />
            <SelectField
              label="Payment Status"
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              options={["Unpaid", "Partially paid", "Paid"]}
            />
            <InputField
              label="Payment Reference No"
              name="paymentReferenceNo"
              value={formData.paymentReferenceNo}
              onChange={handleChange}
            />
            <SelectField
              label="Paid By"
              name="paidBy"
              value={formData.paidBy}
              onChange={handleChange}
              options={["N/A", "SBI", "ICICI", "IOB", "Petty Cash"]}
            />
          </div>

          <div className="flex justify-end col-span-3 gap-4 pt-4 mt-8 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}