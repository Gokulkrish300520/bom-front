"use client";
import { useState } from "react";
import {
  ChevronDownIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function ProfitLossPage() {
  const [dateRange, setDateRange] = useState("This Month");
  const [reportBasis, setReportBasis] = useState("Accrual");
  const [compareWith, setCompareWith] = useState("None");
  const [showZeroBalance, setShowZeroBalance] = useState(true);

  const reportItems = [
    { account: "Operating Income", total: 0 },
    { account: "Cost of Goods Sold", total: 0 },
    { account: "Gross Profit", total: 0 },
    { account: "Operating Expense", total: 0 },
    { account: "Operating Profit", total: 0 },
    { account: "Non Operating Income", total: 0 },
    { account: "Non Operating Expense", total: 0 },
    { account: "Net Profit/Loss", total: 0 },
  ];

  const handleRunReport = () => {
    alert(`Running report for: ${dateRange}, Basis: ${reportBasis}, Compare With: ${compareWith}`);
  };

  const handleReset = () => {
    setDateRange("This Month");
    setReportBasis("Accrual");
    setCompareWith("None");
    setShowZeroBalance(true);
  };

  const handleExport = () => {
    alert("Exporting report...");
  };

  const handleShare = () => {
    alert("Sharing report...");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Breadcrumb / Title */}
      <div className="mb-6">
        <span className="text-gray-600">Business Overview &gt; Profit and Loss</span>
        <span className="ml-2 text-gray-500">• From 01/08/2025 To 31/08/2025</span>
        <h1 className="text-3xl font-bold mt-2">Profit and Loss</h1>
        <div className="text-gray-600">Basis: {reportBasis}</div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
          <select
            value={reportBasis}
            onChange={(e) => setReportBasis(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option>Accrual</option>
            <option>Cash</option>
          </select>
          <select
            value={compareWith}
            onChange={(e) => setCompareWith(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option>None</option>
            <option>Last Month</option>
            <option>Last Year</option>
          </select>
          <button
            onClick={() => setShowZeroBalance(!showZeroBalance)}
            className="border px-3 py-1 rounded flex items-center gap-1"
          >
            {showZeroBalance ? "Hide" : "Show"} Zero Balance
            <FunnelIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRunReport}
            className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
          >
            Run Report <ChevronDownIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="border px-3 py-1 rounded bg-green-100 flex items-center gap-1"
          >
            Export <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleShare}
            className="border px-3 py-1 rounded flex items-center gap-1"
          >
            Share <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="border px-3 py-1 rounded flex items-center gap-1 text-red-500"
          >
            Reset <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white shadow rounded-lg overflow-auto">
        <div className="flex justify-end gap-2 p-2 text-sm border-b border-gray-200">
          <select className="border px-2 py-1 rounded">
            <option>Accounts Without Zero Balance</option>
          </select>
          <select className="border px-2 py-1 rounded">
            <option>Compare With: {compareWith}</option>
          </select>
          <button className="border px-2 py-1 rounded">Customize Report Columns</button>
        </div>

        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2 border-b">ACCOUNT</th>
              <th className="text-right px-4 py-2 border-b">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {reportItems
              .filter((item) => showZeroBalance || item.total !== 0)
              .map((item) => (
                <tr key={item.account} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{item.account}</td>
                  <td className="px-4 py-2 text-right">{item.total.toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex justify-between items-center p-2 text-sm text-gray-600 border-t border-gray-200">
          <div>
            Amount is displayed in your base currency{" "}
            <span className="bg-green-100 px-1 rounded">INR</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleRunReport} className="border p-1 rounded hover:bg-gray-100">
              <FunnelIcon className="w-4 h-4" />
            </button>
            <button  onClick={handleShare} className="border p-1 rounded hover:bg-gray-100">
              <ArrowsRightLeftIcon className="w-4 h-4" />
            </button>
            <button onClick={handleExport} className="border p-1 rounded hover:bg-gray-100">
              <ArrowUpTrayIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="border p-1 rounded hover:bg-gray-100 text-red-500"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}