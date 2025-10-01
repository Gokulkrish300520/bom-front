"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";

const requiredHeaders = [
  "Choose Vendor",
  "Deal Number",
  "Item",
  "Description",
  "Item Specification",
  "HSN Code",
  "Brand",
  "Qty/PCS",
  "Unit Price (USD)",
  "Total (USD)",
  "Unit Price INR",
  "Amount INR",
];

export default function ImportModulePage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);

  // Download sample file
  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([requiredHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, "Freight_Sample.xlsx");
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Validate headers
      const headers = Object.keys(json[0] || {});
      const missing = requiredHeaders.filter((h) => !headers.includes(h));

      if (missing.length > 0) {
        alert("Invalid file! Missing: " + missing.join(", "));
        return;
      }

      setData(json);
    };
    reader.readAsBinaryString(file);
  };

  // Save uploaded data to localStorage
  const handleSave = () => {
    const storedData = localStorage.getItem("freightData");
    const existingData = storedData ? JSON.parse(storedData) : [];
    const updatedData = [...existingData, ...data];
    localStorage.setItem("freightData", JSON.stringify(updatedData));
    alert("Data imported successfully!");
    router.push("/books/purchase/freight");
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">
        Import Freight Data
      </h1>

      {/* Step 1: Download Sample */}
      <div className="mb-6">
        <button
          onClick={downloadSample}
          className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
        >
          📥 Download Sample Form
        </button>
      </div>

      {/* Step 2: Upload File */}
      <div className="mb-6">
        <label className="flex flex-col items-center px-4 py-6 bg-[#fff3dc] text-[#4d3802] rounded-lg shadow-lg tracking-wide uppercase border border-[#dc6c0c] cursor-pointer hover:bg-[#ffe1b3]">
          📤 Select File
          <input
            type="file"
            className="hidden"
            accept=".xlsx,.csv"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* Step 3: Preview */}
      {data.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr>
                {requiredHeaders.map((h) => (
                  <th
                    key={h}
                    className="border px-2 py-1 bg-[#ffe1b3] text-[#5b4106]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-[#fff8ec]" : "bg-white"}
                >
                  {requiredHeaders.map((h) => (
                    <td key={h} className="px-2 py-1 border">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Step 4: Save */}
      {data.length > 0 && (
        <button
          onClick={handleSave}
          className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
        >
          💾 Save Imported Data
        </button>
      )}
    </div>
  );
}