"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/auth/tokenservice";
import Breadcrumb from "@/app/breadcrumb";

type ContactPerson = {
  id: number;
  salutation: string;
  first_name: string;
  last_name: string;
  email: string;
  work_phone: string;
  mobile: string;
};

type Customer = {
  id: number;
  display_name: string;
  email: string;
  company_name: string;
  billing_city: string;
  billing_state: string;
  contact_persons: ContactPerson[];
};

type Deal = {
  id: number;
  deal_no: string;
  customer: Customer;
  start_date: string;
  end_date: string;
  created_at: string;
};

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);

  // Fetch deals for pagination
  async function fetchDeals(url: string) {
    try {
      setLoading(true);
      const res = await fetchWithAuth(url);
      const data = await res.json();
      setDeals(data.results || []);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (err) {
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDeals("https://web-production-6baf3.up.railway.app/api/deals/");
  }, []);

  const handleEdit = (dealId: number) => {
    router.push(`/books/deals/${dealId}/edit`);
  };

  const handleDelete = async (dealId: number) => {
  if (!confirm("Are you sure you want to delete this deal?")) return;

  try {
    const res = await fetchWithAuth(
      `https://web-production-6baf3.up.railway.app/api/deals/${dealId}/`,
      { method: "DELETE" }
    );

    if (res.ok) {
      toast.success("Deal deleted successfully");
      // Remove the deleted deal from state
      setDeals((prevDeals) => prevDeals.filter((deal) => deal.id !== dealId));
    } else {
      const data = await res.json();
      toast.error(data.detail || "Failed to delete deal");
    }
  } catch (err) {
    toast.error("Failed to delete deal");
  }
};


  return (
    <div className="min-h-screen p-6 bg-gray-50">
        <Breadcrumb />
      <h1 className="text-2xl font-semibold mb-6">All Deals</h1>
      

      {loading ? (
        <p>Loading deals...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Deal No</th>
                  <th className="px-4 py-2 border">Customer</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">Start Date</th>
                  <th className="px-4 py-2 border">End Date</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{deal.deal_no}</td>
                    <td className="px-4 py-2 border">{deal.customer.display_name}</td>
                    <td className="px-4 py-2 border">{deal.customer.email}</td>
                    <td className="px-4 py-2 border">{deal.start_date}</td>
                    <td className="px-4 py-2 border">{deal.end_date}</td>
                    <td className="px-4 py-2 border flex gap-2">
                      <button
                        onClick={() => handleEdit(deal.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(deal.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination buttons */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => prevPage && fetchDeals(prevPage)}
              disabled={!prevPage}
              className={`px-4 py-2 rounded ${
                prevPage
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => nextPage && fetchDeals(nextPage)}
              disabled={!nextPage}
              className={`px-4 py-2 rounded ${
                nextPage
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
