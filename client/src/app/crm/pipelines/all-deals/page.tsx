"use client";
import { useEffect, useState } from "react";

export default function AllDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    const savedDeals = JSON.parse(localStorage.getItem("deals") || "[]");
    setDeals(savedDeals);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="mb-6 text-2xl font-bold text-green-900">All Deals</h1>

      {deals.length === 0 ? (
        <p className="text-green-700">No deals created yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="text-green-900 bg-green-200">
              <tr>
                <th className="p-3 font-semibold text-left">Deal Name</th>
                <th className="p-3 font-semibold text-left">Company</th>
                <th className="p-3 font-semibold text-left">Contact</th>
                <th className="p-3 font-semibold text-left">Stage</th>
                <th className="p-3 font-semibold text-left">Amount</th>
                <th className="p-3 font-semibold text-left">Closing Date</th>
                <th className="p-3 font-semibold text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, idx) => (
                <tr
                  key={idx}
                  className="mb-2 transition bg-white rounded-lg shadow-sm hover:bg-green-50"
                >
                  <td className="p-3">{deal.dealName}</td>
                  <td className="p-3">{deal.companyName}</td>
                  <td className="p-3">{deal.contactName}</td>
                  <td className="p-3">{deal.stage}</td>
                  <td className="p-3 font-medium text-green-800">₹{deal.amount}</td>
                  <td className="p-3">{deal.closingDate}</td>
                  <td className="p-3">{deal.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}