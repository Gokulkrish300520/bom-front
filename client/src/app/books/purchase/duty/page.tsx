"use client";

import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

type DutyEntry = {
  vendor: string;
  dealNumber: string;
  totalUSD?: number;
  total?: number; // mapped to Total INR column
  hsnCode?: string;
  airwayBillNumber?: string;
  date: string;
};

export default function DutyPage() {
  const router = useRouter();
  const [data, setData] = useState<DutyEntry[]>([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchDeal, setSearchDeal] = useState("");

  useEffect(() => {
    const storedData = localStorage.getItem("dutyData");
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Duty");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf]), "duty.xlsx");
  };

  const handleDelete = (idx: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      const newData = [...data];
      newData.splice(idx, 1);
      localStorage.setItem("dutyData", JSON.stringify(newData));
      setData(newData);
    }
  };

  const filteredData = data.filter((d) => {
    let match = true;

    if (filterFrom && filterTo) {
      match = match && d.date >= filterFrom && d.date <= filterTo;
    } else if (filterFrom) {
      match = match && d.date >= filterFrom;
    } else if (filterTo) {
      match = match && d.date <= filterTo;
    }

    if (searchVendor) {
      match =
        match &&
        d.vendor.toLowerCase().includes(searchVendor.toLowerCase());
    }

    if (searchDeal) {
      match =
        match &&
        d.dealNumber.toLowerCase().includes(searchDeal.toLowerCase());
    }

    return match;
  });

  return (
    <div className="min-h-screen p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-700">Duty Records</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Download Excel
          </button>
          <button
            onClick={() => router.push("/books/purchase/duty/import_module")}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Import Data
          </button>
          <button
            onClick={() => router.push("/books/purchase/duty/new")}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            + New
          </button>
        </div>
      </div>

      {/* Filters */}
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded shadow">
        <table className="w-full border-collapse">
          <thead className="text-green-800 bg-green-100">
            <tr>
              {[
                "Vendor",
                "Deal No",
                "HSN No",
                "Airway Bill No",
                "Total USD",
                "Total INR",
                "Date",
                "Actions",
              ].map((header) => (
                <th key={header} className="p-2 text-left border">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-green-50">
                  <td className="p-2 border">{row.vendor}</td>
                  <td className="p-2 border">{row.dealNumber}</td>
                  <td className="p-2 border">{row.hsnCode ?? "-"}</td>
                  <td className="p-2 border">{row.airwayBillNumber ?? "-"}</td>
                  <td className="p-2 border">{row.totalUSD ?? "-"}</td>
                  <td className="p-2 border">{row.total ?? "-"}</td>
                  <td className="p-2 border">{row.date}</td>
                  <td className="flex gap-2 p-2 border">
                    <button
                      onClick={() =>
                        router.push(`/books/purchase/duty/view?index=${idx}`)
                      }
                      className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/books/purchase/duty/edit?index=${idx}`)
                      }
                      className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
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
                  No records found. Click "+ New" to add duty entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}