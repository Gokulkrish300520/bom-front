"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/auth/tokenservice";
import Breadcrumb from "@/app/breadcrumb";

type Deal = {
  id: number;
  deal_no: string;
  start_date: string;
  end_date: string;
};

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.id;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    async function fetchDeal() {
      setLoading(true);
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/deals/${dealId}/`
        );
        if (!res.ok) throw new Error("Failed to fetch deal");
        const data = await res.json();
        // Normalize dates to YYYY-MM-DD for inputs
        setDeal({
          ...data,
          start_date: data.start_date ? data.start_date.slice(0, 10) : "",
          end_date: data.end_date ? data.end_date.slice(0, 10) : "",
        });
      } catch (err) {
        toast.error("Failed to load deal");
      } finally {
        setLoading(false);
      }
    }
    if (dealId) fetchDeal();
  }, [dealId]);

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!deal) {
      e.general = "No deal loaded";
      setErrors(e);
      return false;
    }
    if (!deal.deal_no || deal.deal_no.trim() === "") e.deal_no = "Deal number is required";
    if (!deal.start_date) e.start_date = "Start date is required";
    if (!deal.end_date) e.end_date = "End date is required";
    if (deal.start_date && deal.end_date && deal.start_date > deal.end_date) {
      e.date = "Start date cannot be after end date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix validation errors");
      return;
    }
    if (!deal) return;
    setSaving(true);
    try {
      // Use PATCH for partial update (safer)
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/deals/${dealId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deal_no: deal.deal_no,
            start_date: deal.start_date,
            end_date: deal.end_date,
          }),
        }
      );
      if (res.ok) {
        toast.success("Deal updated successfully!");
        router.push("/books/deals");
      } else {
        const err = await res.json().catch(() => null);
        console.error(err);
        toast.error("Failed to update deal");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating deal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!deal) return <p className="p-6 text-red-600">Deal not found</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumb />
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Edit Deal</h1>
          <div className="text-sm text-gray-500">ID: {deal.id}</div>
        </div>

        <div className="space-y-4">
          {/* Deal Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Number</label>
            <input
              type="text"
              value={deal.deal_no}
              onChange={(e) => setDeal({ ...deal, deal_no: e.target.value })}
              className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.deal_no ? "border-red-400 ring-red-100" : "border-gray-200 ring-green-50"
              }`}
            />
            {errors.deal_no && <p className="text-xs text-red-600 mt-1">{errors.deal_no}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={deal.start_date}
                onChange={(e) => setDeal({ ...deal, start_date: e.target.value })}
                className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 ${
                  errors.start_date || errors.date ? "border-red-400 ring-red-100" : "border-gray-200 ring-green-50"
                }`}
              />
              {errors.start_date && <p className="text-xs text-red-600 mt-1">{errors.start_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={deal.end_date}
                onChange={(e) => setDeal({ ...deal, end_date: e.target.value })}
                className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 ${
                  errors.end_date || errors.date ? "border-red-400 ring-red-100" : "border-gray-200 ring-green-50"
                }`}
              />
              {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
            </div>
          </div>

          {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              onClick={() => router.push("/books/deals")}
              type="button"
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {errors.general && <p className="text-sm text-red-600 mt-2">{errors.general}</p>}
        </div>
      </div>
    </div>
  );
}
