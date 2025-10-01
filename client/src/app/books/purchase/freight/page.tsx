"use client";

import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

type FreightEntry = {
  id: number;
  vendor: {
    display_name: string;
  };
  deal_no: string;
  total_price_usd?: string;
  total_price_inr: string;
  sf_number?: string;
  weight?: string;
  freight_type?: string;
  date: string;
};

export default function FreightPage() {
  const router = useRouter();

  const [data, setData] = useState<FreightEntry[]>([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchDeal, setSearchDeal] = useState("");

  // Fetch data with filters applied
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterFrom) params.append("start_date", filterFrom);
    if (filterTo) params.append("end_date", filterTo);
    if (searchVendor) params.append("vendor_name", searchVendor);
    if (searchDeal) params.append("deal_no", searchDeal);

    const url = `https://web-production-6baf3.up.railway.app/api/freights/?${params}`;

    fetchWithAuth(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch freights");
        return res.json();
      })
      .then((apiData) => {
        setData(apiData.results || []);
      })
      .catch((err) => {
        console.error(err);
        setData([]);
      });
  }, [filterFrom, filterTo, searchVendor, searchDeal]);

  const handleExport = () => {
    const exportData = data.map((entry) => ({
      vendor: entry.vendor.display_name,
      dealNumber: entry.deal_no,
      totalUSD: entry.total_price_usd ? parseFloat(entry.total_price_usd) : undefined,
      totalINR: parseFloat(entry.total_price_inr),
      sfNumber: entry.sf_number,
      weight: entry.weight,
      freight: entry.freight_type ? Number(entry.freight_type) : undefined,
      date: entry.date,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Freight");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf]), "freight.xlsx");
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/freights/${id}/`, {
        method: "DELETE",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete entry");
          setData((prev) => prev.filter((entry) => entry.id !== id));
        })
        .catch((err) => alert(err.message));
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-700">Freight Records</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Download Excel
          </button>
          <button
            onClick={() => router.push("/books/purchase/freight/import_module")}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Import Data
          </button>
          <button
            onClick={() => router.push("/books/purchase/freight/new")}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            + New
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <label className="flex flex-col">
          <span className="text-sm text-gray-700">From Date</span>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-gray-700">To Date</span>
          <input
            type="date"
            className="px-2 py-1 border rounded"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-gray-700">Vendor</span>
          <input
            type="text"
            placeholder="Search vendor"
            className="px-2 py-1 border rounded"
            value={searchVendor}
            onChange={(e) => setSearchVendor(e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm text-gray-700">Deal No</span>
          <input
            type="text"
            placeholder="Search deal no"
            className="px-2 py-1 border rounded"
            value={searchDeal}
            onChange={(e) => setSearchDeal(e.target.value)}
          />
        </label>
        <button
    onClick={() => {
      setFilterFrom("");
      setFilterTo("");
      setSearchVendor("");
      setSearchDeal("");
    }}
    className="px-2 py-1 bg-red-500 text-white text-small rounded hover:bg-red-600"
  >
    Clear Filters
  </button>
      </div>

      <div className="overflow-x-auto border rounded shadow">
        <table className="w-full border-collapse">
          <thead className="text-green-800 bg-green-100">
            <tr>
              {[
                "Vendor",
                "Deal No",
                "Total USD",
                "Total INR",
                "SF No",
                "Weight",
                "Freight",
                "Actions",
              ].map((header) => (
                <th key={header} className="p-2 text-left border">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row) => (
                <tr key={row.id} className="border-b hover:bg-green-50">
                  <td className="p-2 border">{row.vendor.display_name}</td>
                  <td className="p-2 border">{row.deal_no}</td>
                  <td className="p-2 border">{row.total_price_usd ?? "-"}</td>
                  <td className="p-2 border">{row.total_price_inr}</td>
                  <td className="p-2 border">{row.sf_number ?? "-"}</td>
                  <td className="p-2 border">{row.weight ?? "-"}</td>
                  <td className="p-2 border">{row.freight_type ?? "-"}</td>
                  <td className="flex gap-2 p-2 border">
                    <button
                      onClick={() =>
                        router.push(`/books/purchase/freight/${row.id}`)
                      }
                      className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/books/purchase/freight/${row.id}/edit`)
                      }
                      className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  No records found. Click "+ New" to add freight entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
