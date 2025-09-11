"use client";

import { useRouter } from "next/navigation";
import { Bill } from "./types";

type BillTableProps = {
  bills: Bill[];
  onRowClick?: (bill: Bill) => void;
  onEditClick?: (bill: Bill) => void;
};

const statusColor: Record<string, string> = {
  PAID: "text-emerald-600",
  UNPAID: "text-red-600",
  PARTIAL: "text-amber-600",
  DRAFT: "text-gray-500",
};

export default function BillTable({ bills, onRowClick, onEditClick }: BillTableProps) {
  const router = useRouter();

  const hasAttachments = (bill: Bill) =>
    Boolean(bill.meta?.files?.length);

  return (
    <div className="overflow-x-auto border rounded-2xl bg-white">
      <table className="min-w-full">
        <thead className="bg-emerald-50 text-emerald-800">
          <tr className="text-left">
            <th className="p-3">Date</th>
            <th className="p-3">Bill #</th>
            <th className="p-3">Reference</th>
            <th className="p-3">Vendor</th>
            <th className="p-3">Status</th>
            <th className="p-3">Due Date</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Balance Due</th>
            <th className="p-3">Att.</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => {
            // Safe accessors (support camelCase and snake_case)
            const billDate = b.billDate ?? b.bill_date ?? b.date ?? "-";
            const billNumber = b.billNumber ?? b.bill_number ?? b.billNo ?? "-";
            const reference = b.referenceNumber ?? b.reference_number ?? "-";
            const vendorName =
              // vendor may be object snapshot or string id
              (typeof b.vendor === "object" && b.vendor) ? (b.vendor.name ?? (b.vendor.first_name ? `${b.vendor.first_name} ${b.vendor.last_name ?? ""}`.trim() : undefined)) :
              b.vendorSnapshot?.name ??
              (typeof b.vendor === "string" ? b.vendor : undefined) ??
              "-";
            const statusKey = (b.status ?? "DRAFT").toString().toUpperCase();
            const dueDate = b.dueDate ?? b.due_date ?? "-";
            const total = b.totalAmount ?? b.total_amount ?? b.total ?? b.amount ?? 0;
            const balance = b.balanceDue ?? b.balance_due ?? 0;

            return (
              <tr key={b.id} className="hover:bg-emerald-50">
                <td
                  className="p-3 cursor-pointer"
                  onClick={() => onRowClick?.(b)}
                >
                  {billDate}
                </td>
                <td
                  onClick={() => onRowClick?.(b)}
                  className="p-3 text-emerald-700 font-medium cursor-pointer"
                >
                  {billNumber}
                </td>
                <td className="p-3">{reference}</td>
                <td className="p-3">{vendorName}</td>
                <td className={`p-3 font-medium ${statusColor[statusKey] ?? "text-gray-700"}`}>{statusKey}</td>
                <td className="p-3">{dueDate}</td>
                <td className="p-3">₹ {Number(total).toFixed(2)}</td>
                <td className="p-3">₹ {Number(balance).toFixed(2)}</td>
                <td className="p-3">{hasAttachments(b) ? "📎" : "-"}</td>
                <td className="p-3">
                  <button
                    className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick?.(b);
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
          {bills.length === 0 && (
            <tr>
              <td colSpan={10} className="p-6 text-center text-gray-500">
                No bills yet. Click “New” to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
