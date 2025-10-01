"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type FreightEntry = {
  vendor: string;
  dealNumber: string;
  item: string;
  description: string;
  itemSpecification: string;
  hsnCode: string;
  brand: string;
  qty: number;
  unitPriceUSD?: number;
  totalUSD?: number;
  unitPriceINR: number;
  totalINR: number;
  sfNumber?: string;
  date: string;
  weight?: string;
  freight?: number;
};

export default function ViewFreightPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const indexParam = searchParams.get("index");

  const [entry, setEntry] = useState<FreightEntry | null>(null);

  useEffect(() => {
    if (indexParam !== null) {
      const storedData = localStorage.getItem("freightData");
      if (storedData) {
        const data: FreightEntry[] = JSON.parse(storedData);
        setEntry(data[Number(indexParam)]);
      }
    }
  }, [indexParam]);

  if (!entry) {
    return (
      <div className="min-h-screen p-6 bg-white">
        <p className="text-center text-red-500">Entry not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-green-700">
          Freight Details
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-2 font-semibold text-green-700">Vendor Info</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Vendor:</span> {entry.vendor}
              </div>
              <div>
                <span className="font-medium">Deal Number:</span> {entry.dealNumber}
              </div>
              <div>
                <span className="font-medium">Item:</span> {entry.item}
              </div>
              <div>
                <span className="font-medium">Description:</span> {entry.description}
              </div>
              <div>
                <span className="font-medium">Item Specification:</span> {entry.itemSpecification}
              </div>
              <div>
                <span className="font-medium">HSN Code:</span> {entry.hsnCode}
              </div>
              <div>
                <span className="font-medium">Brand:</span> {entry.brand}
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-green-700">Pricing Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Quantity:</span> {entry.qty}
              </div>
              <div>
                <span className="font-medium">Unit Price (USD):</span> {entry.unitPriceUSD ?? "-"}
              </div>
              <div>
                <span className="font-medium">Total USD:</span> {entry.totalUSD ?? "-"}
              </div>
              <div>
                <span className="font-medium">Unit Price (INR):</span> {entry.unitPriceINR}
              </div>
              <div>
                <span className="font-medium">Total INR:</span> {entry.totalINR}
              </div>
              <div>
                <span className="font-medium">SF Number:</span> {entry.sfNumber ?? "-"}
              </div>
              <div>
                <span className="font-medium">Date:</span> {entry.date}
              </div>
              <div>
                <span className="font-medium">Weight:</span> {entry.weight ?? "-"}
              </div>
              <div>
                <span className="font-medium">Freight:</span> {entry.freight ?? "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => router.push("/books/purchase/freight")}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}