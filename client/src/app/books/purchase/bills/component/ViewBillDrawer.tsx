// "use client";

// import { useEffect, useState } from "react";
// import { Bill } from "./types";
// import { fetchWithAuth } from "@/auth/tokenservice";

// type Props = {
//   open: boolean;
//   billId: string | null;
//   onClose: () => void;
// };

// export default function ViewBillDrawer({ open, billId, onClose }: Props) {
//   const [bill, setBill] = useState<Bill | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!open || !billId) return;
//     setLoading(true);
//     setBill(null);

//     async function loadBill() {
//       try {
//         const res = await fetchWithAuth(
//           `https://bom-front-production.up.railway.app/api/bills/${billId}/`
//         );
//         if (res.ok) {
//           const data = await res.json();
//           setBill(data);
//         }
//       } finally {
//         setLoading(false);
//       }
//     }
//     loadBill();
//   }, [open, billId]);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-40">
//       <div className="absolute inset-0 bg-black/30" onClick={onClose} />
//       <div className="absolute top-0 right-0 w-full h-full max-w-5xl p-6 overflow-y-auto bg-white shadow-2xl">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-2xl font-semibold text-emerald-700">Bill Details (View Only)</h2>
//           <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200">
//             Close
//           </button>
//         </div>

//         {loading ? (
//           <div>Loading...</div>
//         ) : bill ? (
//           <div className="space-y-6">
//             {/* Bill Main Info */}
//             <div className="grid gap-4 md:grid-cols-2">
//               <div>
//                 <div className="text-sm text-gray-600">Vendor</div>
//                 <div className="font-medium">
//                   {typeof bill.vendor === "object"
//                     ? (bill.vendor.name ?? `${bill.vendor.first_name ?? ""} ${bill.vendor.last_name ?? ""}`.trim())
//                     : bill.vendorSnapshot?.name ?? bill.vendor ?? "-"}
//                 </div>
//               </div>
//               <div>
//                 <div className="text-sm text-gray-600">Bill #</div>
//                 <div className="font-medium">{bill.billNo ?? bill.billNumber ?? bill.bill_number ?? "-"}</div>
//               </div>
//               <div>
//                 <div className="text-sm text-gray-600">Status</div>
//                 <div className="font-medium">{bill.status ?? "-"}</div>
//               </div>
//               <div>
//                 <div className="text-sm text-gray-600">Date</div>
//                 <div className="font-medium">{bill.billDate ?? bill.bill_date ?? bill.date ?? "-"}</div>
//               </div>
//               <div>
//                 <div className="text-sm text-gray-600">Due Date</div>
//                 <div className="font-medium">{bill.dueDate ?? bill.due_date ?? "-"}</div>
//               </div>
//               <div>
//                 <div className="text-sm text-gray-600">Reference #</div>
//                 <div className="font-medium">{bill.referenceNumber ?? bill.reference_number ?? "-"}</div>
//               </div>
//             </div>

//             {/* Bill Items View */}
//             <div>
//               <div className="font-semibold text-emerald-700 mb-2">Items</div>
//               <table className="w-full border rounded-xl overflow-x-auto">
//                 <thead className="bg-emerald-50">
//                   <tr className="text-sm text-left text-emerald-800">
//                     <th className="p-3">Item</th>
//                     <th className="p-3">Description</th>
//                     <th className="p-3">Qty</th>
//                     <th className="p-3">Rate</th>
//                     <th className="p-3">Tax %</th>
//                     <th className="p-3">Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {(bill.meta?.itemsExtended ?? bill.items ?? []).map((item: any, i: number) => {
//                     const qty = Number(item.qty ?? item.quantity ?? 0);
//                     const rate = Number(item.rate ?? item.unit_price ?? 0);
//                     const tax = Number(item.taxPct ?? item.tax_percentage ?? 0);
//                     const amount = qty * rate * (1 + tax / 100);
//                     return (
//                       <tr key={item.id ?? i} className="border-t">
//                         <td className="p-2">{item.name ?? item.item_name ?? "-"}</td>
//                         <td className="p-2">{item.desc ?? item.description ?? "-"}</td>
//                         <td className="p-2">{qty}</td>
//                         <td className="p-2">{rate.toFixed(2)}</td>
//                         <td className="p-2">{tax}</td>
//                         <td className="p-2">₹ {amount.toFixed(2)}</td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             {/* Totals and Notes */}
//             <div className="grid gap-6 md:grid-cols-2">
//               <div>
//                 <div className="mb-2 text-sm text-gray-600">Notes</div>
//                 <div className="p-3 bg-gray-50 border rounded">{bill.notes ?? <span className="text-gray-400 italic">No notes</span>}</div>
//               </div>
//               <div className="p-4 bg-emerald-50 rounded-xl">
//                 <div className="flex justify-between py-1">
//                   <span>Subtotal</span>
//                   <span>₹ {(typeof bill.amount === "number" ? bill.amount : (typeof bill.subtotal === "number" ? bill.subtotal : 0)).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between py-1">
//                   <span>Tax</span>
//                   <span>₹ {(typeof bill.tax === "number" ? bill.tax : 0).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between py-2 mt-2 font-semibold border-t text-emerald-800">
//                   <span>Total</span>
//                   <span>₹ {(typeof bill.total === "number" ? bill.total : (typeof bill.totalAmount === "number" ? bill.totalAmount : (typeof bill.total_amount === "number" ? bill.total_amount : 0))).toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between py-1 border-t">
//                   <span>Balance Due</span>
//                   <span>₹ {(typeof bill.balanceDue === "number" ? bill.balanceDue : (typeof bill.balance_due === "number" ? bill.balance_due : 0)).toFixed(2)}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Attachments View */}
//             <div>
//               <div className="mb-1 font-semibold text-emerald-700">Attachments</div>
//               {bill.meta?.files?.length ? (
//                 <ul className="flex flex-wrap gap-2">
//                   {bill.meta.files.map((f: any, i: number) => (
//                     <li key={f.id ?? i} className="bg-gray-100 rounded px-3 py-1 text-sm truncate">
//                       {f.name}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                 <div className="italic text-gray-500">No attachments</div>
//               )}
//             </div>
//           </div>
//         ) : (
//           <div>No bill details found.</div>
//         )}
//       </div>
//     </div>
//   );
// }
