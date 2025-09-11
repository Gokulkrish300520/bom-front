// "use client";

// import { useEffect, useState } from "react";
// import { Bill } from "./component/types";
// import BillTable from "./component/BillTable";
// import NewBillDrawer from "./component/NewBillDrawer";
// import { fetchWithAuth } from "@/auth/tokenservice";
// import ViewBillDrawer from "./component/ViewBillDrawer";
// import EditBillDrawer from "./component/EditBillDrawer";
// import { useRouter } from "next/navigation";

// export default function BillsPage() {
//   const router = useRouter();
//   const [bills, setBills] = useState<Bill[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [open, setOpen] = useState(false);
//   const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
//   const [viewOpen, setViewOpen] = useState(false);
//   const [editBill, setEditBill] = useState<Bill | null>(null);
//   const [editOpen, setEditOpen] = useState(false);

//   function openEditDrawer(bill: Bill) {
//     setEditBill(bill);
//     setEditOpen(true);
//   }

//   // Fetch bills from backend API when component mounts
//   useEffect(() => {
//     async function loadBills() {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await fetchWithAuth(
//           "https://bom-front-production.up.railway.app/api/bills/",
//           {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${localStorage.getItem("authToken")}`,
//             },
//           }
//         );
//         if (!response.ok) {
//           throw new Error(`Failed to fetch bills: ${response.statusText}`);
//         }
//         const data = await response.json();
//         setBills(data.results || data);
//       } catch (error) {
//         setError(error instanceof Error ? error.message : String(error));
//       }
//       setLoading(false);
//     }

//     loadBills();
//   }, []);

//   // Handler when new bill is created via drawer
//   function handleNewBillSaved(newBill: Bill) {
//     setBills((prev) => [newBill, ...prev.filter((b) => b.id !== newBill.id)]);
//     setOpen(false);
//   }

//   // Loading and error UI states
//   if (loading) return <div>Loading bills...</div>;
//   if (error) return <div className="text-red-600">Error loading bills: {error}</div>;

//   return (
//     <div className="p-4 space-y-4 md:p-6">
//       {/* Page Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold md:text-3xl text-emerald-700">All Bills</h1>
//         <button
//           className="px-4 py-2 text-white rounded-xl bg-emerald-600 hover:bg-emerald-700"
//           onClick={() => setOpen(true)}
//         >
//           + New
//         </button>
//       </div>

//       {/* Bills Table */}
//       <BillTable
//         bills={bills}
//         onRowClick={(bill) => {
//           setSelectedBillId(bill.id);
//           setViewOpen(true);
//         }}
//         onEditClick={(bill) => {
//           openEditDrawer(bill);
//         }}
//       />

//       {/* New Bill Drawer */}
//       <NewBillDrawer open={open} onClose={() => setOpen(false)} onSaved={handleNewBillSaved} />
//       <ViewBillDrawer open={viewOpen} billId={selectedBillId} onClose={() => setViewOpen(false)} />

//       {/* Pass only billId to EditBillDrawer to avoid props mismatch (update component later if you want whole bill) */}
//       {editOpen && editBill && (
//         <EditBillDrawer
//           open={editOpen}
//           billId={editBill.id}
//           onClose={() => setEditOpen(false)}
//           onUpdated={(updatedBill) => {
//             setBills((prev) => prev.map((b) => (b.id === updatedBill.id ? updatedBill : b)));
//             setEditOpen(false);
//           }}
//         />
//       )}
//     </div>
//   );
// }
