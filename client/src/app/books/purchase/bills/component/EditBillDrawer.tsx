// "use client";

// import { useEffect, useMemo, useState } from "react";
// import VendorModal from "./VendorModel"; // your vendor modal component
// import { fetchWithAuth } from "@/auth/tokenservice";
// import { Bill, Vendor, Item, FileBlob, BillItem } from "./types"; // adapt import paths
// import { useRouter } from "next/navigation";

// const btnGreen = "bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2";
// const input = "border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500";

// type Props = {
//   open: boolean;
//   onClose: () => void;
//   billId: string | null;
//   onUpdated: (bill: Bill) => void;
// };

// export default function EditBillDrawer({ open, onClose, billId, onUpdated }: Props) {
//   const router = useRouter();
//   const [bill, setBill] = useState<Bill | null>(null);
//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [items, setItems] = useState<Item[]>([]);
//   const [showVendorModal, setShowVendorModal] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Form states:
//   const [billNo, setBillNo] = useState("");
//   const [referenceNumber, setReferenceNumber] = useState("");
//   const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
//   const [dueDate, setDueDate] = useState("");
//   const [vendorId, setVendorId] = useState("");
//   const [status, setStatus] = useState<Bill["status"]>("PAID");
//   const [notes, setNotes] = useState("");
//   const [files, setFiles] = useState<FileBlob[]>([]);
//   const [billItems, setBillItems] = useState<BillItem[]>([
//     { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 },
//   ]);

//   // Load vendors and items once
//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       try {
//         const vRes = await fetchWithAuth("https://bom-front-production.up.railway.app/api/vendors");
//         if (vRes.ok) {
//           const vData = await vRes.json();
//           setVendors(vData.results || vData);
//         }
//         const iRes = await fetchWithAuth("https://bom-front-production.up.railway.app/api/items/");
//         if (iRes.ok) {
//           const iData = await iRes.json();
//           setItems(iData.results || iData);
//         }
//       } catch (e) {
//         console.error("Error loading vendors/items", e);
//       }
//     })();
//   }, [open]);

//   // Load bill data for editing when billId changes & drawer open
//   useEffect(() => {
//     if (!open || !billId) return;
//     setLoading(true);
//     setBill(null);
//     (async () => {
//       try {
//         const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/bills/${billId}`);
//         if (res.ok) {
//           const data = await res.json();
//           setBill(data);

//           // Initialize form fields
//           setBillNo(data.billNo || data.bill_number || "");
//           setReferenceNumber(data.referenceNumber || data.reference_number || "");
//           setDate(data.date || data.bill_date || new Date().toISOString().slice(0, 10));
//           setDueDate(data.dueDate || data.due_date || "");
//           setVendorId(data.vendorId || data.vendor?.id || "");
//           setStatus(data.status || "PAID");
//           setNotes(data.notes || "");
//           setFiles(data.meta?.files || []);
//           setBillItems(
//             (data.meta?.itemsExtended || data.items || []).map((item: any) => ({
//               id: item.id || crypto.randomUUID(),
//               name: item.name || item.item_name || "",
//               qty: item.qty ?? item.quantity ?? 1,
//               rate: item.rate ?? 0,
//               desc: item.desc || item.description || "",
//               taxPct: item.taxPct ?? item.tax_percentage ?? 0,
//             }))
//           );
//         } else {
//           alert("Failed to load bill for editing");
//         }
//       } catch (err) {
//         alert("Error loading bill");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [billId, open]);

//   const subtotal = useMemo(() => billItems.reduce((sum, i) => sum + (Number(i.qty) * Number(i.rate)), 0), [billItems]);
//   const taxTotal = useMemo(() => billItems.reduce((sum, i) => sum + Number(i.qty) * Number(i.rate) * (Number(i.taxPct) / 100), 0), [billItems]);
//   const total = subtotal + taxTotal;

//   function addRow() {
//     setBillItems((rows) => [...rows, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 }]);
//   }

//   function removeRow(id: string) {
//     setBillItems((rows) => (rows.length > 1 ? rows.filter(r => r.id !== id) : rows));
//   }

//   function updateRow(id: string, field: keyof BillItem, value: string | number) {
//     setBillItems(rows => rows.map(r => r.id === id ? { ...r, [field]: field === "name" || field === "desc" ? String(value) : Number(value) } : r));
//   }

//   async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = e.target.files;
//     if (!files) return;
//     const allowedFiles = Array.from(files).slice(0, 10 - files.length);
//     const readFiles: FileBlob[] = await Promise.all(
//       allowedFiles.map(file => new Promise<FileBlob>((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, dataUrl: String(reader.result) });
//         reader.onerror = reject;
//         reader.readAsDataURL(file);
//       }))
//     );
//     setFiles(f => [...f, ...readFiles].slice(0, 10));
//     e.currentTarget.value = "";
//   }

//   function removeFile(id: string) {
//     setFiles(f => f.filter(file => file.id !== id));
//   }

//   async function submit() {
//     if (!vendorId) {
//       alert("Please select a vendor");
//       return;
//     }
//     if (!billNo.trim()) {
//       alert("Bill # is required");
//       return;
//     }

//     const filteredItems = billItems
//       .map(i => ({
//         id: i.id,
//         name: i.name,
//         qty: Number(i.qty),
//         rate: Number(i.rate),
//         desc: i.desc,
//         taxPct: Number(i.taxPct),
//       }))
//       .filter(i => i.name.trim() && i.qty > 0);

//     const payload = {
//       bill_number: billNo.trim(),
//       reference_number: referenceNumber || "",
//       vendor_id: vendorId,
//       bill_date: date,
//       due_date: dueDate || "",
//       status,
//       notes,
//       items: filteredItems.map(i => ({
//         item_name: i.name,
//         description: i.desc || "",
//         quantity: i.qty,
//         rate: i.rate,
//         tax_percentage: i.taxPct,
//       })),
//       attachments: files.map(f => ({
//         name: f.name,
//         size: f.size,
//         type: f.type,
//         data_url: f.dataUrl,
//       })),
//       subtotal,
//       tax: taxTotal,
//       total,
//     };

//     try {
//       const token = localStorage.getItem("authToken") || "";

//       const url = bill ? `https://bom-front-production.up.railway.app/api/bills/${bill.id}/` : "https://bom-front-production.up.railway.app/api/bills/";
//       const method = bill ? 'PUT' : 'POST';

//       const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/bills/${bill.id}/`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         alert(`Error: ${JSON.stringify(err)}`);
//         return;
//       }

//       const savedBill = await res.json();
//       onUpdated(savedBill);
//       onClose();

//       // Reset if new bill
//       if (!bill) {
//         setBillNo("");
//         setReferenceNumber("");
//         setDate(new Date().toISOString().slice(0, 10));
//         setDueDate("");
//         setVendorId("");
//         setStatus("PAID");
//         setNotes("");
//         setBillItems([{ id: crypto.randomUUID(), name: "", qty: 1, rate: 0, desc: "", taxPct: 0 }]);
//         setFiles([]);
//       }
//     } catch (e) {
//       alert("Network error saving bill.");
//       console.error(e);
//     }
//   }

//   if (!open) return null;

//   return (
//     <>
//       <VendorModal
//         open={showVendorModal}
//         onClose={() => setShowVendorModal(false)}
//         onCreated={v => { setVendors(vendors => [...vendors, v]); setVendorId(v.id); }}
//       />

//       <div className="fixed inset-0 z-50">
//         <div className="absolute inset-0 bg-black/40" onClick={onClose} />
//         <div className="absolute right-0 top-0 w-full max-w-5xl h-full overflow-auto bg-white p-6 shadow-xl">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-2xl font-semibold text-emerald-700">{bill ? "Edit Bill" : "New Bill"}</h2>
//             <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200">Close</button>
//           </div>

//           {/* Form fields */}
//           <div className="grid gap-4 md:grid-cols-2">
//             {/* Vendor */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">Vendor</label>
//               <div className="flex gap-2">
//                 <select className={`${input} flex-grow`} value={vendorId} onChange={e => setVendorId(e.target.value)}>
//                   <option value="">Select vendor</option>
//                   {vendors.map(v => (
//                     <option key={v.id} value={v.id}>{v.first_name}</option>
//                   ))}
//                 </select>
//                 <button
//                   type="button"
//                   className="px-3 py-1 border border-emerald-300 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                   onClick={() => router.push('/books/purchase/vendors/new')}
//                 >
//                   + New Vendor
//                 </button>
//               </div>
//             </div>

//             {/* Bill No */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">Bill #</label>
//               <input type="text" className={input} value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="e.g. B-1001" />
//             </div>

//             {/* Reference Number */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">Reference #</label>
//               <input type="text" className={input} value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} />
//             </div>

//             {/* Status */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
//               <select className={input} value={status} onChange={e => setStatus(e.target.value as Bill["status"])}>
//                 <option value="PAID">PAID</option>
//                 <option value="UNPAID">UNPAID</option>
//                 <option value="PARTIAL">PARTIAL</option>
//                 <option value="DRAFT">DRAFT</option>
//               </select>
//             </div>

//             {/* Bill Date */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">Date</label>
//               <input type="date" className={input} value={date} onChange={e => setDate(e.target.value)} />
//             </div>

//             {/* Due Date */}
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">Due Date</label>
//               <input type="date" className={input} value={dueDate} onChange={e => setDueDate(e.target.value)} />
//             </div>
//           </div>

//           {/* Items */}
//           <div className="mt-6">
//             <div className="flex items-center justify-between mb-2">
//               <h3 className="font-semibold text-emerald-700">Items</h3>
//               <button type="button" className={btnGreen} onClick={addRow}>+ Add Item</button>
//             </div>
//             <div className="overflow-x-auto border rounded-xl">
//               <table className="min-w-[900px] w-full">
//                 <thead className="bg-emerald-50">
//                   <tr className="text-left text-sm font-semibold text-emerald-800">
//                     <th className="p-2">Item</th>
//                     <th className="p-2">Description</th>
//                     <th className="p-2">Qty</th>
//                     <th className="p-2">Rate</th>
//                     <th className="p-2">Tax %</th>
//                     <th className="p-2">Amount</th>
//                     <th className="p-2"></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {billItems.map(item => {
//                     const amount = (item.qty * item.rate) * (1 + (item.taxPct ?? 0) / 100);
//                     return (
//                       <tr key={item.id} className="border-t">
//                         <td className="p-2">
//                           <input
//                             list="item-list"
//                             placeholder="Item name"
//                             className={input}
//                             value={item.name}
//                             onChange={e => updateRow(item.id, "name", e.target.value)}
//                           />
//                           <datalist id="item-list">
//                             {items.map(i => (
//                               <option key={i.id} value={i.name} />
//                             ))}
//                           </datalist>
//                         </td>
//                         <td className="p-2">
//                           <input
//                             placeholder="Description"
//                             className={input}
//                             value={item.desc || ""}
//                             onChange={e => updateRow(item.id, "desc", e.target.value)}
//                           />
//                         </td>
//                         <td className="p-2">
//                           <input
//                             type="number"
//                             min={0}
//                             className={input}
//                             value={item.qty}
//                             onChange={e => updateRow(item.id, "qty", e.target.value)}
//                           />
//                         </td>
//                         <td className="p-2">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             className={input}
//                             value={item.rate}
//                             onChange={e => updateRow(item.id, "rate", e.target.value)}
//                           />
//                         </td>
//                         <td className="p-2">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             className={input}
//                             value={item.taxPct ?? 0}
//                             onChange={e => updateRow(item.id, "taxPct", e.target.value)}
//                           />
//                         </td>
//                         <td className="p-2">₹ {amount.toFixed(2)}</td>
//                         <td className="p-2">
//                           <button type="button" className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200" onClick={() => removeRow(item.id)}>×</button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Attachments */}
//           <div className="mt-6">
//             <h4 className="mb-2 text-emerald-700 font-semibold">Attachments</h4>
//             <div className="flex flex-wrap gap-3">
//               <label className="px-3 py-1 border border-emerald-300 rounded-xl cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
//                 Upload Files
//                 <input type="file" multiple accept="*/*" className="hidden" onChange={onPickFiles} />
//               </label>
//               {files.map(file => (
//                 <span key={file.id} className="px-2 py-1 rounded-xl bg-gray-100 text-sm truncate flex items-center gap-1">
//                   {file.name}
//                   <button onClick={() => removeFile(file.id)} className="text-gray-600 hover:text-red-600">×</button>
//                 </span>
//               ))}
//             </div>
//           </div>

//           {/* Notes and Totals */}
//           <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block mb-1 text-sm font-medium text-gray-700">Notes</label>
//               <textarea className={input} rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
//             </div>

//             <div className="bg-emerald-50 rounded-xl p-4 text-emerald-800">
//               <div className="flex justify-between py-1">
//                 <span>Subtotal</span>
//                 <span>₹ {subtotal.toFixed(2)}</span>
//               </div>
//               <div className="flex justify-between py-1">
//                 <span>Tax</span>
//                 <span>₹ {taxTotal.toFixed(2)}</span>
//               </div>
//               <div className="flex justify-between py-1 font-semibold border-t border-emerald-300 mt-2">
//                 <span>Total</span>
//                 <span>₹ {total.toFixed(2)}</span>
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="mt-6 flex justify-end gap-3">
//             <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200" onClick={onClose}>Cancel</button>
//             <button className={btnGreen} onClick={submit}>Save</button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }