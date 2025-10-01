"use client";

import { useState, useMemo, useEffect, FC } from "react";
import { v4 as uuidv4 } from "uuid";
// Removed: import { useRouter } from "next/navigation";
// Removed: import * as XLSX from "xlsx";
// Removed: import { saveAs } from "file-saver";

// The XLSX and FileSaver libraries are expected to be available globally,
// typically loaded via <script> tags in the main HTML file.
declare var XLSX: any;
declare var saveAs: any;


// --- Type Definitions ---
// This is the main data structure for a GST entry.
export type PurchaseEntry = {
  id: string;
  vendor: string;
  gstNumber: string; // <-- Added GST Number
  dealNumber: string;
  item: string;
  description: string;
  itemSpecification: string;
  hsnCode: string; // GST-specific field
  brand: string;
  quantity: number;
  unitPriceINR: number;
  total: number;
  invoiceDate: string;
  billUpload: string; // Stores the Base64 data of the PDF for viewing
  paymentRequest: "High" | "Low";
  paymentStatus: "Paid" | "Unpaid" | "Partially paid";
  paymentReferenceNo: string;
  paidBy: "SBI" | "ICICI" | "IOB" | "Petty Cash" | "N/A";
};

// --- Prop Type Definitions ---
type InputFieldProps = {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  required?: boolean;
  readOnly?: boolean;
};

type SelectFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
};

// --- Reusable UI Components ---
const InputField: FC<InputFieldProps> = ({ label, name, type = "text", value, onChange, required = false, readOnly = false }) => (
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
      className={`w-full p-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500 ${readOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
    />
  </div>
);

const SelectField: FC<SelectFieldProps> = ({ label, name, value, onChange, options, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-green-800">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select name={name} value={value} onChange={onChange} required={required} className="w-full p-2 mt-1 border rounded-md focus:ring-green-500 focus:border-green-500">
      {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
    </select>
  </div>
);

// --- Entry Form Modal Component ---
const EntryForm = ({ entry, onSave, onCancel }: { entry?: PurchaseEntry; onSave: (entry: PurchaseEntry) => void; onCancel: () => void; }) => {
  const emptyEntry: Omit<PurchaseEntry, "id" | "total"> = {
    vendor: "", gstNumber: "", dealNumber: "", item: "", description: "", itemSpecification: "", hsnCode: "",
    brand: "", quantity: 0, unitPriceINR: 0, invoiceDate: "", billUpload: "",
    paymentRequest: "Low", paymentStatus: "Unpaid", paymentReferenceNo: "", paidBy: "N/A",
  };

  const [formData, setFormData] = useState(entry ? { ...entry } : emptyEntry);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (entry?.billUpload && entry.billUpload.startsWith("data:application/pdf")) {
      setPreviewUrl(entry.billUpload);
    }
    return () => { if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [entry, previewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ["quantity", "unitPriceINR"].includes(name);
    setFormData((prev) => ({ ...prev, [name]: isNumeric ? (value === "" ? 0 : Number(value)) : value }));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFormData(prev => ({ ...prev, billUpload: entry?.billUpload || "" }));
      setPreviewUrl(entry?.billUpload || null);
      return;
    }
    if (file.type !== "application/pdf") return alert("Please upload a PDF file only.");
    if (file.size > 5 * 1024 * 1024) return alert("File size must be less than 5MB.");
    
    try {
      const base64Data = await convertFileToBase64(file);
      setFormData(prev => ({ ...prev, billUpload: base64Data }));
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (error) {
      console.error("Error converting file to Base64:", error);
      alert("There was an error processing the file.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.billUpload) {
      alert("A bill upload (PDF) is required before saving.");
      return;
    }
    const total = (formData.quantity || 0) * (formData.unitPriceINR || 0);
    const finalEntry: PurchaseEntry = { ...formData, id: entry?.id || uuidv4(), total };
    onSave(finalEntry);
  };

  return (
    <>
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">Bill Preview</h3>
              <button onClick={() => setShowPreview(false)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Close</button>
            </div>
            <iframe src={previewUrl} className="w-full h-full border-0" title="Bill Preview" />
          </div>
        </div>
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8">
            <h2 className="mb-6 text-2xl font-bold text-green-700">{entry ? "Edit" : "Add"} GST Record</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField label="Vendor" name="vendor" value={formData.vendor} onChange={handleChange} required />
              <InputField label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} required />
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
                <div className="mt-1 text-lg font-semibold text-gray-800">{(formData.quantity * formData.unitPriceINR).toLocaleString("en-IN")}</div>
              </div>
              <InputField label="Invoice Date" name="invoiceDate" type="date" value={formData.invoiceDate} onChange={handleChange} required />
              <div>
                <label className="block text-sm font-medium text-green-800">Bill Upload (PDF only) <span className="text-red-500">*</span></label>
                <input type="file" name="billUpload" onChange={handleFileChange} accept=".pdf" className="w-full p-1.5 mt-1 border rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                {previewUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-green-700">File is ready for preview.</p>
                    <button type="button" onClick={() => setShowPreview(true)} className="text-sm font-semibold text-green-600 hover:text-green-800 hover:underline">Preview File</button>
                  </div>
                )}
              </div>
              <SelectField label="Payment Request" name="paymentRequest" value={formData.paymentRequest} onChange={handleChange} options={["Low", "High"]} />
              <SelectField label="Payment Status" name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} options={["Unpaid", "Partially paid", "Paid"]} />
              <InputField label="Payment Reference No" name="paymentReferenceNo" value={formData.paymentReferenceNo} onChange={handleChange} />
              <SelectField label="Paid By" name="paidBy" value={formData.paidBy} onChange={handleChange} options={["N/A", "SBI", "ICICI", "IOB", "Petty Cash"]} />
            </div>
            <div className="flex justify-end col-span-3 gap-4 mt-8 pt-4 border-t">
              <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              <button type="submit" className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">{entry ? "Update" : "Save"}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// --- Main GST Page Component ---
export default function GstPurchasePage() {
  // Removed: const router = useRouter();
  const [data, setData] = useState<PurchaseEntry[]>([]);
  const [showForm, setShowForm] = useState<{ visible: boolean; entry?: PurchaseEntry }>({ visible: false });
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchDeal, setSearchDeal] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const LOCAL_STORAGE_KEY = "purchaseData"; // Key for GST records

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (error) {
        console.error("Could not parse GST data from localStorage:", error);
        setData([]);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save GST data to localStorage:", error);
      alert("Error: Could not save data. Your browser's storage may be full.");
    }
  }, [data]);

  const filteredData = useMemo(() =>
    data.filter(d => {
      let match = true;
      if (filterFrom) match = match && d.invoiceDate >= filterFrom;
      if (filterTo) match = match && d.invoiceDate <= filterTo;
      if (searchVendor) match = match && d.vendor.toLowerCase().includes(searchVendor.toLowerCase());
      if (searchDeal) match = match && d.dealNumber.toLowerCase().includes(searchDeal.toLowerCase());
      return match;
    }),
    [data, filterFrom, filterTo, searchVendor, searchDeal]
  );

  const totals = useMemo(() =>
    filteredData.reduce((acc, row) => {
      acc.quantity += row.quantity;
      acc.total += row.total;
      return acc;
    }, { quantity: 0, total: 0 }),
    [filteredData]
  );

  const statusColors: Record<string, string> = {
    Paid: "bg-green-100 text-green-800",
    Unpaid: "bg-red-100 text-red-800",
    "Partially paid": "bg-yellow-100 text-yellow-800",
  };

  const handleExport = () => {
    if (typeof XLSX === 'undefined' || typeof saveAs === 'undefined') {
        alert("Export functionality is unavailable. Please check your internet connection.");
        return;
    }
    const dataForExport = filteredData.map(({ billUpload, ...rest }) => ({
        ...rest, billUploaded: billUpload ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GstPurchaseData");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "gst_purchase_data.xlsx");
  };

  const confirmDelete = () => {
    if (deleteId) {
      setData(data.filter(d => d.id !== deleteId));
      setDeleteId(null);
    }
  };

  const handleSaveEntry = (entry: PurchaseEntry) => {
    setData(prev => prev.some(d => d.id === entry.id) ? prev.map(d => d.id === entry.id ? entry : d) : [...prev, entry]);
    setShowForm({ visible: false });
  };
  
  // Use window.location for navigation instead of useRouter
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      {showForm.visible && <EntryForm entry={showForm.entry} onSave={handleSaveEntry} onCancel={() => setShowForm({ visible: false })} />}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-8 bg-white rounded-lg shadow-2xl max-w-sm w-full">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Confirm Deletion</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to delete this record?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 font-semibold text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-green-700">GST Records</h1>
        <div className="flex gap-3">
          <button onClick={handleExport} className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Download Excel</button>
          <button onClick={() => setShowForm({ visible: true })} className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">+ New</button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4 p-4 mb-6 bg-gray-50 border rounded-lg">
        <label className="flex flex-col">
          <span className="mb-1 text-sm font-medium text-gray-700">From Date</span>
          <input type="date" className="px-2 py-1 border rounded" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span className="mb-1 text-sm font-medium text-gray-700">To Date</span>
          <input type="date" className="px-2 py-1 border rounded" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span className="mb-1 text-sm font-medium text-gray-700">Vendor</span>
          <input type="text" placeholder="Search vendor..." className="px-2 py-1 border rounded" value={searchVendor} onChange={e => setSearchVendor(e.target.value)} />
        </label>
        <label className="flex flex-col">
          <span className="mb-1 text-sm font-medium text-gray-700">Deal No</span>
          <input type="text" placeholder="Search deal no..." className="px-2 py-1 border rounded" value={searchDeal} onChange={e => setSearchDeal(e.target.value)} />
        </label>
      </div>
      <div className="overflow-x-auto border rounded shadow">
        <table className="w-full border-collapse">
          <thead className="text-green-800 bg-green-100">
            <tr>
              {["Vendor", "GST Number", "Deal Number", "Item", "Description", "Item Specification", "HSN Code", "Brand", "Qty/PCS", "Unit Price INR", "Total", "Invoice Date", "Bill Upload", "Payment Request", "Payment Status", "Payment Ref No", "Paid By", "Actions"].map(h => (
                <th key={h} className="p-2 text-left border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={18} className="p-4 text-center text-gray-500">No records found.</td></tr>
            ) : filteredData.map(row => (
              <tr key={row.id} className="border-b hover:bg-green-50">
                <td className="p-2 border">{row.vendor}</td>
                <td className="p-2 border">{row.gstNumber}</td>
                <td className="p-2 border">{row.dealNumber}</td>
                <td className="p-2 border">{row.item}</td>
                <td className="p-2 border">{row.description}</td>
                <td className="p-2 border">{row.itemSpecification}</td>
                <td className="p-2 border">{row.hsnCode}</td>
                <td className="p-2 border">{row.brand}</td>
                <td className="p-2 border text-right">{row.quantity.toLocaleString("en-IN")}</td>
                <td className="p-2 border text-right">{row.unitPriceINR.toLocaleString("en-IN")}</td>
                <td className="p-2 border text-right font-semibold">{row.total.toLocaleString("en-IN")}</td>
                <td className="p-2 border">{row.invoiceDate}</td>
                <td className="p-2 border">
                  {row.billUpload ? (<span className="text-xs font-semibold text-green-600">Uploaded</span>) : (<span className="text-xs text-red-600">Missing</span>)}
                </td>
                <td className="p-2 border">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.paymentRequest === "High" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>{row.paymentRequest}</span>
                </td>
                <td className="p-2 border">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[row.paymentStatus]}`}>{row.paymentStatus}</span>
                </td>
                <td className="p-2 border">{row.paymentReferenceNo || "-"}</td>
                <td className="p-2 border">{row.paidBy}</td>
                <td className="flex gap-2 p-2 border">
                  <button onClick={() => handleNavigate(`/books/purchase/gst/view?id=${row.id}`)} className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600">View</button>
                  <button onClick={() => setShowForm({ visible: true, entry: row })} className="px-2 py-1 text-xs text-white bg-yellow-500 rounded hover:bg-yellow-600">Edit</button>
                  <button onClick={() => setDeleteId(row.id)} className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
          {filteredData.length > 0 && (
            <tfoot className="bg-green-50 font-bold">
              <tr>
                <td colSpan={8} className="p-2 border text-right">Totals:</td>
                <td className="p-2 border text-right">{totals.quantity.toLocaleString("en-IN")}</td>
                <td className="p-2 border"></td>
                <td className="p-2 border text-right">{totals.total.toLocaleString("en-IN")}</td>
                <td colSpan={7} className="p-2 border"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}