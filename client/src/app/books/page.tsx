"use client";

import { useEffect, useState } from "react";

// Mock data to simulate backend response
const MOCK_DEALS = [
  {
    id: 1,
    deal_no: "D001",
    company_name: "Apex Solutions",
    status: "Open",
    date: "2023-10-25",
    documents: {
      quotes: ["QT-001", "QT-002"],
      invoices: ["INV-001"],
      bills: [],
    },
  },
  {
    id: 2,
    deal_no: "D002",
    company_name: "Innovate Corp",
    status: "In Progress",
    date: "2023-10-24",
    documents: {
      quotes: ["QT-003"],
      invoices: [],
      bills: ["BL-001"],
    },
  },
  {
    id: 3,
    deal_no: "D003",
    company_name: "Apex Solutions",
    status: "Closed",
    date: "2023-10-20",
    documents: {
      quotes: ["QT-004"],
      invoices: ["INV-002", "INV-003"],
      bills: [],
    },
  },
  {
    id: 4,
    deal_no: "D004",
    company_name: "Global Ventures",
    status: "Open",
    date: "2023-10-25",
    documents: {
      quotes: ["QT-005", "QT-006"],
      invoices: [],
      bills: ["BL-002"],
    },
  },
];

export default function BooksPage() {
  const [dealNo, setDealNo] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [filteredDeals, setFilteredDeals] = useState(MOCK_DEALS);

  useEffect(() => {
    let results = MOCK_DEALS;

    // Filter by Deal No
    if (dealNo) {
      results = results.filter((deal) =>
        deal.deal_no.toLowerCase().includes(dealNo.toLowerCase())
      );
    }

    // Filter by Company Name
    if (companyName) {
      results = results.filter((deal) =>
        deal.company_name.toLowerCase().includes(companyName.toLowerCase())
      );
    }

    // Filter by Status
    if (status) {
      results = results.filter((deal) => deal.status === status);
    }

    // Filter by Date
    if (date) {
      results = results.filter((deal) => deal.date === date);
    }

    setFilteredDeals(results);
  }, [dealNo, companyName, status, date]);

  const handleClearFilters = () => {
    setDealNo("");
    setCompanyName("");
    setStatus("");
    setDate("");
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-green-50 rounded-lg shadow-sm p-6">
      <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">Deals</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <label htmlFor="deal-no" className="text-sm font-medium text-gray-700 mb-1">
              Deal No
            </label>
            <input
              id="deal-no"
              type="text"
              value={dealNo}
              onChange={(e) => setDealNo(e.target.value)}
              placeholder="Enter Deal No"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="company-name" className="text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter Company Name"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="date" className="text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg shadow-sm hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-md overflow-hidden">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left font-semibold">Deal No</th>
                <th className="py-3 px-4 text-left font-semibold">Company Name</th>
                <th className="py-3 px-4 text-left font-semibold">Status</th>
                <th className="py-3 px-4 text-left font-semibold">Date</th>
                <th className="py-3 px-4 text-left font-semibold">Documents</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">{deal.deal_no}</td>
                    <td className="py-3 px-4">{deal.company_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          deal.status === "Open"
                            ? "bg-blue-100 text-blue-800"
                            : deal.status === "In Progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{deal.date}</td>
                    <td className="py-3 px-4">
                      {deal.documents.quotes.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-gray-600">Quotes:</span>
                          <span className="text-gray-500">{deal.documents.quotes.join(", ")}</span>
                        </div>
                      )}
                      {deal.documents.invoices.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-gray-600">Invoices:</span>
                          <span className="text-gray-500">{deal.documents.invoices.join(", ")}</span>
                        </div>
                      )}
                      {deal.documents.bills.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-gray-600">Bills:</span>
                          <span className="text-gray-500">{deal.documents.bills.join(", ")}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No deals match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
