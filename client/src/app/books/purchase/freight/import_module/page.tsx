"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

const requiredHeaders = [
        "Choose Vendor",
        "Deal Number",
        "Currency",
        "Item",
        "Description",
        "Item Specification",
        "HSN Code",
        "Brand",
        "Qty/PCS",
        "Unit Price",
        "Date",
        "SF Number",
        "Weight",
        "Freight Type",
      ];

export default function FreightExcelImport() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target?.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const parsedData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const headers = Object.keys(parsedData[0]);
      const missing = requiredHeaders.filter((h) => !headers.includes(h));
      if (missing.length) {
        alert(`❌ Missing headers: ${missing.join(", ")}`);
        return;
      }

      setData(parsedData);
    };
    reader.readAsBinaryString(file);
  };
  

  const convertToISODate = (dateStr: string | number) => {
    if (!dateStr) return null;
    if (typeof dateStr === "number") {
      const excelDate = XLSX.SSF.parse_date_code(dateStr);
      return new Date(
        excelDate.y,
        excelDate.m - 1,
        excelDate.d
      ).toISOString().split("T")[0];
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
  };


  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([requiredHeaders]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, "Freight_Sample.xlsx");
  };

  const getNormalizedDate = (rawDate: any) => {
    if (rawDate instanceof Date) return rawDate.toISOString().split("T")[0];
    if (typeof rawDate === "string") return convertToISODate(rawDate);
    if (typeof rawDate === "number") return convertToISODate(rawDate);
    return null;
  };



const importData = async () => {
  if (data.length === 0) {
    alert("No data to import.");
    return;
  }
  setLoading(true);
  
  try {
      const grouped: Record<string, any[]> = {};
      for (const row of data) {
        const vendor = row["Choose Vendor"]?.trim();
        const deal = row["Deal Number"]?.trim();
        const key = `${vendor}_${deal}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      }

      for (const [key, rows] of Object.entries(grouped)) {
        const first = rows[0];

        // Vendor lookup
        const vendorResp = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/vendors?display_name=${encodeURIComponent(
            first["Choose Vendor"]
          )}`
        );
        const vendorData = await vendorResp.json();
        if (!vendorData.results?.length)
          throw new Error(`Vendor not found: ${first["Choose Vendor"]}`);
        const vendorId = vendorData.results[0].id;

        // Deal lookup
        const dealResp = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/deals?deal_no=${encodeURIComponent(
            first["Deal Number"]
          )}`
        );
        const dealData = await dealResp.json();
        if (!dealData.results?.length)
          throw new Error(`Deal not found: ${first["Deal Number"]}`);
        const dealId = dealData.results[0].id;

        const date = getNormalizedDate(first["Date"]);

        const items = rows.map((r) => ({
          item_name: String(r["Item"]).trim(),
          description: r["Description"],
          item_specification: r["Item Specification"],
          brand: r["Brand"],
          hsn_code: r["HSN Code"],
          quantity: Number(r["Qty/PCS"]) || 0,
          unit_price: Number(r["Unit Price"]) || 0,
        }));

        const payload = {
          vendor_id: vendorId,
          deal_id: dealId,
          currency: first["Currency"] || "USD",
          date,
          items,
          sf_number: first["SF Number"] || "",
          weight: first["Weight"] || "",
          freight_type: first["Freight Type"] || "",
        };

        console.log("📦 Sending payload:", payload);

        const res = await fetchWithAuth(
          "https://web-production-6baf3.up.railway.app/api/freights/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const resData = await res.json();
        if (!res.ok) {
          console.error("❌ Failed to import freight:", resData);
          throw new Error(resData.detail || "Failed to save freight");
        }

        console.log("✅ Freight imported:", resData);
      }

      alert("✅ All freights imported successfully!");
      router.push("/books/purchase/freight");
    } catch (error: any) {
      console.error("❌ Import failed:", error);
      alert(`Import failed: ${error.message || error}`);
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
      
      {data.length > 0 && (
          <div className="flex justify-between items-center mb-5 ">
            <p className="text-green-600 font-medium">
              ✅ {data.length} rows loaded from Excel
            </p>
            <button
              onClick={importData}
              disabled={loading}
              className={`px-6 py-2 rounded-md text-white font-semibold shadow-md ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Importing..." : "🚀 Import Data"}
            </button>
          </div>
        )}

      {/* Preview Data */}
      {data.length > 0 && (
        <div className="overflow-x-auto border rounded-lg shadow-sm max-h-[70vh] mb-5">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {Object.keys(data[0]).map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2 text-left font-semibold text-gray-700 border-b"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-gray-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {Object.values(row).map((value: any, i) => (
                    <td
                      key={i}
                      className="px-4 py-2 border-b text-gray-800 truncate max-w-[200px]"
                      title={String(value)}
                    >
                      {String(value)}
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
