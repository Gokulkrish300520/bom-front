"use client";

import { useRouter } from "next/navigation";
import LowStockTable from "./LowStockTable";

export default function BooksPage() {
  const router = useRouter();

  const goToFilterDeals = () => {
    router.push("/books/filter"); // Adjust this path to your actual deals filter page route
  };

  return (
    <div className="min-h-screen p-5 bg-gradient-to-br from-green-100 to-blue-100 flex flex-col items-center space-y-8">
      {/* Show Low Stock Items below */}
      <div className="w-full max-w-8xl">
        <LowStockTable />
      </div>
    </div>
  );
}
