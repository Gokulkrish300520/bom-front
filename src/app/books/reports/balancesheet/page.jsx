"use client";

import { useState } from "react";
import {
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState("Today");
  const [reportBasis, setReportBasis] = useState("Accrual");
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const reportItems = [
    {
      account: "Assets",
      total: 0,
      children: [
        {
          account: "Current Assets",
          total: 0,
          children: [
            { account: "Cash", total: 0 },
            { account: "Bank", total: 0 },
            { account: "Accounts Receivable", total: 0 },
            { account: "Other current assets", total: 0 },
            { account: "Total Current Assets", total: 0 },
          ],
        },
        { account: "Other Assets", total: 0 },
        { account: "Fixed Assets", total: 0 },
        { account: "Total Assets", total: 0 },
      ],
    },
    {
      account: "Liabilities & Equities",
      total: 0,
      children: [
        {
          account: "Liabilities",
          total: 0,
          children: [
            { account: "Current Liabilities", total: 0 },
            { account: "Long Term Liabilities", total: 0 },
            { account: "Other Liabilities", total: 0 },
            { account: "Total Liabilities", total: 0 },
          ],
        },
        { account: "Equities", total: 0 },
        { account: "Total Liabilities & Equities", total: 0 },
      ],
    },
  ];

  const handleReset = () => {
    setAsOfDate("Today");
    setReportBasis("Accrual");
    alert("Filters reset!");
  };

  const handleApplyFilter = () => {
  alert(
    `Applying filter:\nDate Range: ${asOfDate}\nReport Basis: ${reportBasis}`
  );
};

const handleExport = () => {
  const flattenItems = (items, parent = "") =>
    items.flatMap((item) => [
      [
        parent ? parent + " > " + item.account : item.account,
        item.total.toFixed(2),
      ],
      ...(item.children ? flattenItems(item.children, item.account) : []),
    ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [["ACCOUNT", "TOTAL"], ...flattenItems(reportItems)]
      .map((e) => e.join(","))
      .join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.href = encodedUri;
  link.download = "balance_sheet.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  const renderRows = (items, level = 0) =>
    items.flatMap((item) => {
      const rows = [
        <tr key={item.account} className="hover:bg-gray-50">
          <td
            className="px-4 py-2 font-semibold"
            style={{ paddingLeft: `${level * 20+12}px` }}
          >
            {item.account}
          </td>
          <td className="px-4 py-2 text-right">
            {item.total !== undefined ? item.total.toFixed(2) : ""}
          </td>
        </tr>,
      ];
      if (item.children) {
        rows.push(...renderRows(item.children, level + 1));
      }
      return rows;
    });

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Breadcrumb & Page Title */}
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
        <div>
          <span className="text-gray-600">Business Overview &gt; Balance Sheet</span>
          <span className="ml-2 text-gray-500">• As of 24/08/2025</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex gap-2 items-center">
          <span className="font-semibold text-gray-700">Filters</span>
          <select
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Month</option>
          </select>
          <select
            value={reportBasis}
            onChange={(e) => setReportBasis(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option>Accrual</option>
            <option>Cash</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <FunnelIcon onClick={handleApplyFilter} className="w-5 h-5 text-gray-600" />
          <button
            className="border p-2 rounded hover:bg-gray-100"
            onClick={() => alert("Report refreshed")}
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
          </button>
          <button
            className="border p-2 rounded hover:bg-gray-100"
            onClick={handleExport}
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          <button
            className="border p-2 rounded hover:bg-gray-100 text-red-500"
            onClick={handleReset}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <button
            className="border px-2 py-1 rounded"
            onClick={() => setShowCustomizeModal(true)}
          >
            Customize Columns
          </button>
        </div>
      </div>

      {/* Main Report Table */}
      <main className="p-4 flex-1 overflow-auto">
        <div className="text-center mb-4">
          <div className="text-lg font-semibold">Test</div>
          <div className="text-2xl font-bold">Balance Sheet</div>
          <div className="text-gray-600">Basis: {reportBasis}</div>
          <div className="text-gray-500">As of 24/08/2025</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 relative">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 border-b">ACCOUNT</th>
                <th className="text-right px-4 py-2 border-b">TOTAL</th>
              </tr>
            </thead>
            <tbody>{renderRows(reportItems)}</tbody>
          </table>

          <div className="mt-2 text-sm text-gray-600 flex justify-between items-center">
            <div>
              Amount is displayed in your base currency{" "}
              <span className="bg-green-100 px-1 rounded">INR</span>
            </div>
          </div>
        </div>
      </main>

      {/* Customize Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-lg font-bold mb-2">Customize Columns</h2>
            <p>Here you can select which columns to show/hide.</p>
            <button
              className="mt-4 px-3 py-1 border rounded bg-blue-600 text-white"
              onClick={() => setShowCustomizeModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}