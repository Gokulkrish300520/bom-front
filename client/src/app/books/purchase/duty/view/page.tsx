"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DutyViewPage() {
  const router = useRouter();
  const [dutyData, setDutyData] = useState<any>(null);

  useEffect(() => {
    // Get last saved duty entry from localStorage
    const storedData = localStorage.getItem("dutyData");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setDutyData(parsed[parsed.length - 1]); // show last added record
    }
  }, []);

  if (!dutyData) {
    return <p className="p-8 text-gray-600">No duty data found.</p>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl p-8 mx-auto bg-white shadow rounded-2xl">
        <h1 className="mb-6 text-2xl font-bold text-green-700">Duty Details</h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Vendor Info */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-green-600">
              Vendor Info
            </h2>
            <p><span className="font-bold">Vendor:</span> {dutyData.vendor}</p>
            <p><span className="font-bold">Deal Number:</span> {dutyData.dealNumber}</p>
            <p><span className="font-bold">Item:</span> {dutyData.item}</p>
            <p><span className="font-bold">Description:</span> {dutyData.description}</p>
            <p><span className="font-bold">Item Specification:</span> {dutyData.itemSpecification}</p>
            <p><span className="font-bold">HSN Code:</span> {dutyData.hsnCode}</p>
            <p><span className="font-bold">Brand:</span> {dutyData.brand}</p>
            <p><span className="font-bold">Airway Bill Number:</span> {dutyData.airwayBillNumber}</p>
          </div>

          {/* Pricing & Duty Details */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-green-600">
              Duty & Pricing Details
            </h2>
            <p><span className="font-bold">Quantity:</span> {dutyData.qty}</p>
            <p><span className="font-bold">Unit Price (USD):</span> {dutyData.unitPriceUSD}</p>
            <p><span className="font-bold">Total USD:</span> {dutyData.totalUSD}</p>
            <p><span className="font-bold">Unit Price (INR):</span> {dutyData.unitPriceINR}</p>
            <p><span className="font-bold">Amount INR:</span> {dutyData.amountINR}</p>
            <p><span className="font-bold">Assessable Value:</span> {dutyData.assessableValue}</p>
            <p><span className="font-bold">IGST:</span> {dutyData.igst}</p>
            <p><span className="font-bold">Social Welfare:</span> {dutyData.socialWelfare}</p>
            <p><span className="font-bold">Chess:</span> {dutyData.chess}</p>
            <p><span className="font-bold">Duty:</span> {dutyData.duty}</p>
            <p><span className="font-bold">Add. Duty:</span> {dutyData.addDuty}</p>
            <p><span className="font-bold">Total:</span> {dutyData.total}</p>
            <p><span className="font-bold">Date:</span> {dutyData.date}</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => router.push("/books/purchase/duty")}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}