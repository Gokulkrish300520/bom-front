"use client";
import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "@/auth/tokenservice";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// --- TYPE DEFINITIONS ---
type ReportDetails = {
  operating_income: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  operating_expense: number;
  operating_profit: number;
  non_operating_income: number;
  non_operating_expense: number;
  net_profit_loss: number;
  payments_received: number;
  invoice_breakdown?: any;
  bill_breakdown?: any;
};

type ProfitLossReport = {
  period: string;
  basis: string;
  start_date: string;
  end_date: string;
  report: ReportDetails;
  compare_with?: string;
  compare_report?: any;
};

// --- PAGE STARTS ---
export default function ProfitLossPage() {
  // Filter controls state (changes immediately with UI)
  const [dateRange, setDateRange] = useState<string>("This Month");
  const [reportBasis, setReportBasis] = useState<string>("Accrual");
  const [compareWith, setCompareWith] = useState<string>("None");
  const [showZeroBalance, setShowZeroBalance] = useState<boolean>(true);

  // Filter state actually used to fetch report (changes only on Run Report)
  const [runFilter, setRunFilter] = useState<{
    time: string;
    basis: string;
    compare: string;
  }>({
    time: "This Month",
    basis: "Accrual",
    compare: "None",
  });

  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Show/hide invoice & bill breakdowns together
  const [showBreakdowns, setShowBreakdowns] = useState(false);

  // Fetch report whenever runFilter changes (after Run Report clicked)
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError("");
      setReport(null);
      // Hide breakdown on each new fetch
      setShowBreakdowns(false);
      try {
        const token = localStorage.getItem("access_token");
        let params = new URLSearchParams({
          time: runFilter.time,
          basis: runFilter.basis,
        });
        if (runFilter.compare !== "None") params.append("compare_with", runFilter.compare);

        const res = await fetchWithAuth(
          `https://bom-front-production.up.railway.app/api/reports/profit-and-loss/?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          let errMsg = "Failed to fetch report";
          try {
            const errBody = await res.json();
            if (errBody && errBody.detail) errMsg = errBody.detail;
          } catch {}
          throw new Error(errMsg);
        }

        const data: ProfitLossReport = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [runFilter]);

  // Export as Excel including invoice and bill breakdown
  function exportToExcel(report: ProfitLossReport) {
    if (!report) return;

    const summaryData = reportItems.map(({ account, total }) => ({
      Account: account,
      Total: total,
    }));

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    if (report.report.invoice_breakdown && report.report.invoice_breakdown.length > 0) {
      const wsInvoice = XLSX.utils.json_to_sheet(report.report.invoice_breakdown);
      XLSX.utils.book_append_sheet(wb, wsInvoice, "Invoice Breakdown");
    }

    if (report.report.bill_breakdown && report.report.bill_breakdown.length > 0) {
      const wsBill = XLSX.utils.json_to_sheet(report.report.bill_breakdown);
      XLSX.utils.book_append_sheet(wb, wsBill, "Bill Breakdown");
    }

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "profit_and_loss_report.xlsx");
  }

  const handleRunReport = () => {
    setError("");
    setRunFilter({
      time: dateRange,
      basis: reportBasis,
      compare: compareWith,
    });
  };

  const handleReset = () => {
    setDateRange("This Month");
    setReportBasis("Accrual");
    setCompareWith("None");
    setShowZeroBalance(true);
    setRunFilter({
      time: "This Month",
      basis: "Accrual",
      compare: "None",
    });
  };

  const handleExport = () => {
    if (!report) {
      alert("No data to export");
      return;
    }
    // Use Excel export - includes breakdowns
    exportToExcel(report);
  };

  const handleShare = async () => {
  if (!report) {
    alert("No data to share");
    return;
  }

  const recipientEmail = window.prompt("Enter recipient email address to share the report:");
  if (!recipientEmail) {
    alert("Email address is required.");
    return;
  }

  try {
    const token = localStorage.getItem("access_token");

    const reportData = {
      Account: reportItems.map((item) => ({
        Account: item.account,
        Total: item.total,
      })),
      invoice_breakdown: report.report.invoice_breakdown ?? [],
      bill_breakdown: report.report.bill_breakdown ?? [],
      start_date: report.start_date,
      end_date: report.end_date,
      basis: report.basis,
    };

    const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/api/send-report-email/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient_email: recipientEmail,
        subject: "Profit and Loss Report",
        report_data: reportData,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to send email.");
    }

    alert("Report shared successfully via email.");
  } catch (error) {
    alert(`Error sharing report: ${error instanceof Error ? error.message : String(error)}`);
  }
};


  // Prepare summary table rows and export data
  const reportItems =
    report && report.report
      ? [
          { account: "Operating Income", total: report.report.operating_income ?? 0 },
          { account: "Cost of Goods Sold", total: report.report.cost_of_goods_sold ?? 0 },
          { account: "Gross Profit", total: report.report.gross_profit ?? 0 },
          { account: "Operating Expense", total: report.report.operating_expense ?? 0 },
          { account: "Operating Profit", total: report.report.operating_profit ?? 0 },
          { account: "Non Operating Income", total: report.report.non_operating_income ?? 0 },
          { account: "Non Operating Expense", total: report.report.non_operating_expense ?? 0 },
          { account: "Net Profit/Loss", total: report.report.net_profit_loss ?? 0 },
        ]
      : [];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Title */}
      <div className="mb-6">
        <span className="text-gray-600">Business Overview &gt; Profit and Loss</span>
        {report && (
          <span className="ml-2 text-gray-500">
            • From {report.start_date} To {report.end_date}
          </span>
        )}
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

      {/* Error / Loading / Report Table */}
      <div className="bg-white shadow rounded-lg overflow-auto">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : (
          <>
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
                      <td className="px-4 py-2 text-right">
                        {item.total != null
                          ? item.total.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })
                          : "0.00"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
