"use client";

import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import toast from "react-hot-toast";
import Breadcrumb from "@/app/breadcrumb";

// 🧾 Define item type
type FreightItem = {
  sf_number?: string;
  weight?: string;
  freight_type?: string;
};

// 📦 Define freight entry type
type FreightEntry = {
  id: number;
  vendor: {
    display_name: string;
  };
  deal_no: string;
  total_amount?: string;
  sf_number?: string;
  currency?: string;
  weight?: string;
  freight_type?: string;
  date: string;
  created_at?: string;
  items?: FreightItem[];
};

export default function FreightPage() {
  const router = useRouter();

  const [data, setData] = useState<FreightEntry[]>([]);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchVendor, setSearchVendor] = useState("");
  const [searchDeal, setSearchDeal] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const currencySymbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };

  // 🔍 Fetch data
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

  // 📤 Export to Excel
  const handleExport = () => {
    const exportData = data.map((entry) => ({
      vendor: entry.vendor.display_name,
      dealNumber: entry.deal_no,
      total: entry.total_amount ? parseFloat(entry.total_amount) : 0,
      sfNumber: entry.sf_number,
      weight: entry.weight,
      freight: entry.freight_type,
      date: entry.date,
      createdAt: entry.created_at
        ? new Date(entry.created_at).toLocaleString("en-IN")
        : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Freight");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(new Blob([buf]), "freight.xlsx");
  };

  // ❌ Delete handler
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/freights/${id}/`,
        {
          method: "DELETE",
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete entry");
          setData((prev) => prev.filter((entry) => entry.id !== id));
          toast.success("Entry deleted successfully!");
        })
        .catch((err) => toast.error(err.message));
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Breadcrumb />
          <h1 className="text-2xl font-bold text-green-700">Freight Records</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Download Excel
          </button>
          <button
            onClick={() =>
              router.push("/books/purchase/freight/import_module")
            }
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
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
          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded shadow">
        <table className="w-full border-collapse">
          <thead className="text-green-800 bg-green-100">
            <tr>
              {[
                "Freight Date",
                "Vendor",
                "Deal No",
                "Total",
                "Created At",
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
                <React.Fragment key={row.id}>
                  <tr
                    className="border-b hover:bg-green-50 cursor-pointer"
                    onClick={() =>
                      setExpanded(expanded === row.id ? null : row.id)
                    }
                  >
                    <td className="p-2 border">{row.date}</td>
                    <td className="p-2 border">{row.vendor.display_name}</td>
                    <td className="p-2 border">{row.deal_no}</td>
                    <td className="p-2 border">
                      {row.total_amount
                        ? `${
                            currencySymbols[row.currency ?? ""] ??
                            row.currency ??
                            ""
                          } ${parseFloat(row.total_amount).toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="p-2 border">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "-"}
                    </td>
                    <td className="flex gap-2 p-2 border">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/books/purchase/freight/${row.id}`);
                        }}
                        className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/books/purchase/freight/${row.id}/edit`);
                        }}
                        className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(row.id);
                        }}
                        className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* Expandable Items Row */}
                  {expanded === row.id && (
                    <tr>
                      <td colSpan={9} className="bg-gray-50 p-3">
                        {row.items?.length ? (
                          <table className="w-full text-sm border mt-2">
                            <thead className="bg-gray-100 text-gray-700">
                              <tr>
                                <th className="p-2 border">SF Number</th>
                                <th className="p-2 border">Weight</th>
                                <th className="p-2 border">Freight Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.items.map((item, idx) => (
                                <tr key={`${row.id}-${idx}`}>
                                  <td className="p-2 border">
                                    {item.sf_number ?? "-"}
                                  </td>
                                  <td className="p-2 border">
                                    {item.weight ?? "-"}
                                  </td>
                                  <td className="p-2 border">
                                    {item.freight_type ?? "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No items found for this freight.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
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
