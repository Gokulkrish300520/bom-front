// app/companies/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { HiOutlineBell } from "react-icons/hi";

export default function CompaniesPage() {
  const router = useRouter();
  const [companies] = useState([
    { name: "SYNERGY TELECOM (P)", phone: "0000000000", website: "-", owner: "priya" },
    { name: "Gsanctk Solutions Private", phone: "1111111111", website: "-", owner: "arjun" },
  ]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white shadow">
        {/* Left side dropdown */}
        <select className="px-3 py-1 text-sm border rounded-md">
          <option>Recently Created Companies</option>
          <option>All Companies</option>
        </select>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center px-2 py-1 border rounded-md">
            <FiSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search (ctrl + k)"
              className="px-2 py-1 text-sm outline-none"
            />
          </div>

          {/* Notifications */}
          <HiOutlineBell className="text-xl text-gray-600 cursor-pointer" />

          {/* + Company Button */}
          <button
            onClick={() => router.push("/crm/company/create")}
            className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            + Company
          </button>

          {/* Profile */}
          <div className="flex items-center justify-center w-8 h-8 font-bold text-gray-700 bg-gray-300 rounded-full">
            U
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 overflow-x-auto">
        <table className="w-full bg-white rounded-md shadow-sm">
          <thead className="text-sm text-gray-700 bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Company Name</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Website</th>
              <th className="px-4 py-2 text-left">Company Owner</th>
              <th className="px-4 py-2 text-left text-green-600 cursor-pointer">
                + Create Field
              </th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-800">
            {companies.map((c, idx) => (
              <tr
                key={idx}
                className="border-t cursor-pointer hover:bg-gray-50"
              >
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">{c.website}</td>
                <td className="px-4 py-2">{c.owner}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
