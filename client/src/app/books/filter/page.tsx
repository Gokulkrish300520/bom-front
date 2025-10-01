"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";
import Link from "next/link";


interface Deal {
  id: number;
  deal_no: string;
  customer: {
    company_name?: string;
    display_name?: string;
  };
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export default function DealsTable() {
  const [dealFilters, setDealFilters] = useState({
    dealNo: "",
    companyName: "",
    startDate: "",
    endDate: "",
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);

  useEffect(() => {
    fetchWithAuth("https://web-production-6baf3.up.railway.app/api/deals/")
      .then((res) => res.json())
      .then((data) => setDeals(data.results || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    let results = deals;

    if (dealFilters.dealNo) {
      results = results.filter((deal) =>
        deal.deal_no.toLowerCase().includes(dealFilters.dealNo.toLowerCase())
      );
    }
    if (dealFilters.companyName) {
      results = results.filter((deal) =>
        (deal.customer.company_name ?? deal.customer.display_name ?? "")
          .toLowerCase()
          .includes(dealFilters.companyName.toLowerCase())
      );
    }
    if (dealFilters.startDate) {
      results = results.filter(
        (deal) => deal.start_date && deal.start_date >= dealFilters.startDate
      );
    }
    if (dealFilters.endDate) {
      results = results.filter(
        (deal) => deal.end_date && deal.end_date <= dealFilters.endDate
      );
    }

    setFilteredDeals(results);
  }, [dealFilters, deals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setDealFilters((prev) => ({ ...prev, [id]: value }));
  };

  const clearFilters = () => {
    setDealFilters({
      dealNo: "",
      companyName: "",
      startDate: "",
      endDate: "",
    });
  };

  return (
    
    <div className="p-8 bg-white rounded-lg shadow-lg">
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
  <ol className="list-none p-0 inline-flex">
    <li className="flex items-center">
      <Link href="/books" className=" text-xl text-blue-600 hover:text-blue-800">
        Books
      </Link>
      <svg
        className="fill-current w-7 h-4 mx-3 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path d="M9.292 6.707L13.584 11l-4.292 4.293 1.414 1.414L16.414 12l-5.708-5.707z" />
      </svg>
    </li>
    <li className="text-xl flex items-center text-gray-500" aria-current="page">
      Filter Page
    </li>
  </ol>
</nav>

      <h2 className="text-3xl font-extrabold mb-6 text-brand-primary border-b-4 border-brand-accent pb-2 text-center">
        Deals
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          id="dealNo"
          value={dealFilters.dealNo}
          onChange={handleInputChange}
          placeholder="Deal No"
          className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <input
          id="companyName"
          value={dealFilters.companyName}
          onChange={handleInputChange}
          placeholder="Company Name"
          className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <input
          id="startDate"
          type="date"
          value={dealFilters.startDate}
          onChange={handleInputChange}
          className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <input
          id="endDate"
          type="date"
          value={dealFilters.endDate}
          onChange={handleInputChange}
          className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={clearFilters}
          className="px-5 py-2 bg-gray-200 rounded shadow hover:bg-gray-300 transition"
        >
          Clear Filters
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse border border-gray-300 rounded">
          <thead className="bg-gradient-to-r from-green-100 to-green-300 text-gray-700 uppercase font-semibold text-sm select-none">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left">Deal No</th>
              <th className="border border-gray-300 px-4 py-3 text-left">Company Name</th>
              <th className="border border-gray-300 px-4 py-3 text-left">Start Date</th>
              <th className="border border-gray-300 px-4 py-3 text-left">End Date</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <tr
                  key={deal.id}
                  className="border-b border-gray-200 hover:bg-blue-100 transition cursor-pointer"
                >
                  <td className="border border-gray-300 px-4 py-3">{deal.deal_no}</td>
                  <td className="border border-gray-300 px-4 py-3 ">
                    {deal.customer.company_name ?? deal.customer.display_name}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">{deal.start_date ?? "-"}</td>
                  <td className="border border-gray-300 px-4 py-3">{deal.end_date ?? "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  No deals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
