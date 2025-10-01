"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

const requiredHeaders = [
  "Choose Vendor",
  "Deal Number",
  "Item",
  "Description",
  "Item Specification",
  "HSN Code",
  "Brand",
  "Qty/PCS",
  "Unit Price USD",
  "Total (USD)",
  "Unit Price INR",
  "Amount INR",
  "Date",
  "SF Number",
  "Weight",
  "Freight Type",
];

export default function ImportModulePage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([requiredHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, "Freight_Sample.xlsx");
  };
const getNormalizedDate = (val: any) => {
  if (typeof val === 'number') {
    // Excel date number
    const epoch = Date.parse('1899-12-30T00:00:00Z');
    const date = new Date(epoch + val * 86400 * 1000);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } else if (val instanceof Date) {
    // JS Date object
    return val.toISOString().split('T')[0];
  } else if (typeof val === 'string') {
    // Date string, try to parse and format
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  // fallback: return as is or empty string
  return "";
};



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Validate headers
      const headers = Object.keys(json[0] || {});
      const missing = requiredHeaders.filter((h) => !headers.includes(h));

      if (missing.length > 0) {
        alert("Invalid file! Missing columns: " + missing.join(", "));
        return;
      }

      setData(json);
    };
    reader.readAsArrayBuffer(file);
  };

const importData = async () => {
  if (data.length === 0) {
    alert("No data to import.");
    return;
  }
  setLoading(true);
  
  function convertToISODate(dateStr: any): string {
  if (typeof dateStr !== 'string') {
    return '';
  }
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year) {
    return '';
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}


  try {
    for (const row of data) {
        // Get vendor ID
        const vendorResp = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/vendors?display_name=${encodeURIComponent(
            row["Choose Vendor"]
          )}`
        );
        if (!vendorResp.ok) throw new Error("Failed to fetch vendor");
        const vendors = await vendorResp.json();
        if (!vendors.results.length)
          throw new Error(`Vendor not found: ${row["Choose Vendor"]}`);
        const vendorId = vendors.results[0].id;

        // Get deal ID
        const dealResp = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/deals?deal_no=${encodeURIComponent(
            row["Deal Number"]
          )}`
        );
        if (!dealResp.ok) throw new Error("Failed to fetch deal");
        const deals = await dealResp.json();
        if (!deals.results.length)
          throw new Error(`Deal not found: ${row["Deal Number"]}`);
        const dealId = deals.results[0].id;

        const item_name = row["Item"] ? String(row["Item"]).trim() : '';
       const rawDate = row["Date"];
        let isoDate = getNormalizedDate(rawDate);
        if (!isoDate && typeof rawDate === "string") {
          isoDate = convertToISODate(rawDate);
        }

        


        if (!item_name) throw new Error("Missing 'Item' in one row.");
        if (!isoDate) throw new Error("Invalid 'Date' in one row.");
        
        // Map data to backend format
        const payload = {
          vendor_id: vendorId,
          deal_id: dealId,
          item_name, // non-empty string
          description: row["Description"],
          item_specification: row["Item Specification"],
          hsn_code: row["HSN Code"],
          brand: row["Brand"],
          quantity: Number(row["Qty/PCS"]),
          unit_price_usd: Number(row["Unit Price USD"]),
          total_price_usd: Number(row["Total (USD)"]),
          unit_price_inr: Number(row["Unit Price INR"]),
          total_price_inr: Number(row["Amount INR"]),
          date: isoDate,
          sf_number: row["SF Number"] || undefined,
          weight: row["Weight"] || undefined,
          freight_type: row["Freight Type"] || undefined,
        };
        console.log("Sending payload:", payload);
        // Post freight data
        const postResp = await fetchWithAuth(
          "https://web-production-6baf3.up.railway.app/api/freights/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const postData = await postResp.json();
        console.log('POST response:', postResp.status, postData);

        if (!postResp.ok) {
        throw new Error(postData.detail || "Failed to save");
      }
      }

      alert("All rows imported successfully!");
      router.push("/books/purchase/freight");
    } catch (error:any) {
  alert(`Import failed: ${error?.message || String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">Import Freight Data</h1>

      {/* Download Sample */}
      <div className="mb-6">
        <button
          onClick={downloadSample}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={loading}
        >
          📥 Download Sample
        </button>
      </div>

      {/* Upload File */}
      <div className="mb-6">
        <label className="flex flex-col items-center px-4 py-6 bg-[#fff3dc] text-[#4d3802] rounded-lg shadow-lg tracking-wide uppercase border border-[#dc6c0c] cursor-pointer hover:bg-[#ffe1b3]">
          📤 Select Excel File
          <input type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Preview Data */}
      {data.length > 0 && (
        <div className="mb-6 overflow-auto max-h-96">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-yellow-100 text-yellow-800">
              <tr>
                {requiredHeaders.map((header) => (
                  <th className="border border-yellow-300 p-2" key={header}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr className={i % 2 === 0 ? "bg-yellow-50" : "bg-white"} key={i}>
                  {requiredHeaders.map((header) => (
                    <td className="border border-yellow-300 p-1" key={header}>
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Button */}
      {data.length > 0 && (
        <button
          onClick={importData}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Importing..." : "Import Data"}
        </button>
      )}
    </div>
  );
}
