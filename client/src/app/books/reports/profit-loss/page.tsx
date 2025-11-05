"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { fetchWithAuth } from "@/auth/tokenservice";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// TypeScript interfaces
interface Customer {
  id: number;
  display_name: string;
}

interface Deal {
  id: number;
  deal_no: string;
  customer?: Customer;
}

interface ReportData {
  revenue: string;
  expenses: string;
  profit_or_loss: string;
  details: Record<string, string>;
}

export default function ProfitLossPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch customers and deals
  useEffect(() => {
  async function fetchData() {
    try {
      // Fetch customers
      const custRes = await fetchWithAuth(
        "https://web-production-6baf3.up.railway.app/api/customers/"
      );
      const custData = await custRes.json();
      setCustomers(custData?.results ?? []);

      // Fetch all deals recursively
      let allDeals: Deal[] = [];
      let nextUrl: string | null = "https://web-production-6baf3.up.railway.app/api/deals/";

      while (nextUrl) {
        const dealsRes = await fetchWithAuth(nextUrl);
        const dealsData = await dealsRes.json();
        allDeals = [...allDeals, ...(dealsData.results ?? [])];
        nextUrl = dealsData.next; // go to next page if exists
      }

      setDeals(allDeals);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch customers or deals.");
    }
  }
  fetchData();
}, []);


  // Fetch Profit & Loss report
  const handleFetchReport = async () => {
    if (!selectedDeal) return alert("Please select a deal!");
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/reports/profit-and-loss/?deal_id=${selectedDeal}&customer_id=${selectedCustomer}`
      );
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch report.");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = reportData
    ? {
        labels: Object.keys(reportData.details),
        datasets: [
          {
            label: "Amount (₹)",
            data: Object.values(reportData.details).map((v) => parseFloat(v)),
            backgroundColor: "rgba(59, 130, 246, 0.7)",
          },
        ],
      }
    : null;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Profit & Loss Dashboard
      </h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="p-3 border rounded shadow w-full md:w-1/3"
        >
          <option value="">Select Customer (optional)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name}
            </option>
          ))}
        </select>

        <select
          value={selectedDeal}
          onChange={(e) => setSelectedDeal(e.target.value)}
          className="p-3 border rounded shadow w-full md:w-1/3"
        >
          <option value="">Select Deal</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.deal_no} - {d.customer?.display_name || "No Customer"}
            </option>
          ))}
        </select>

        <button
          onClick={handleFetchReport}
          className="px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
        >
          {loading ? "Loading..." : "Get Report"}
        </button>
      </div>

      {/* Report Summary */}
      {reportData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white shadow rounded">
              <p className="text-gray-500">Revenue</p>
              <p className="text-2xl font-bold">
                ₹ {parseFloat(reportData.revenue).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white shadow rounded">
              <p className="text-gray-500">Expenses</p>
              <p className="text-2xl font-bold">
                ₹ {parseFloat(reportData.expenses).toLocaleString()}
              </p>
            </div>
            <div
              className={`p-4 shadow rounded ${
                parseFloat(reportData.profit_or_loss) >= 0
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <p className="text-gray-500">Profit / Loss</p>
              <p className="text-2xl font-bold">
                ₹ {parseFloat(reportData.profit_or_loss).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-semibold mb-4">Detailed Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(reportData.details).map(([key, value]) => (
                <div
                  key={key}
                  className="p-4 bg-gray-50 rounded shadow hover:shadow-lg transition"
                >
                  <p className="text-gray-500 capitalize">{key}</p>
                  <p className="text-lg font-semibold">
                    ₹ {parseFloat(value).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          {chartData && (
            <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-semibold mb-4">Breakdown Chart</h2>
            <div className="h-64 md:h-96">
              <Bar data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
