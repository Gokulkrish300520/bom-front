"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import type { PostProcessItem } from "../postprocess/page";

// --- 1. Corrected and Unified Type Definitions ---
// These types now match the detailed structure used in the Edit/View pages.
export type WorkingTimelineItem = {
  s_no: number;
  description: string;
  deadline: string;
  status: "Completed" | "Over Due";
  approved: "Yes" | "Rework";
};

export type ProjectTimelineItem = {
  s_no: number;
  description: string;
  deadline: string;
  status: "Completed" | "Over Due";
  final_fileName?: string;
};

export type PreprocessItem = {
  id: string;
  date: string;
  department: string;
  company_name: string;
  contact: string;
  state: string;
  deadline: string;
  description: string;
  fileName?: string;
  source: string;
  customer_notes: string;
  order_value: number;
  advance_payment: number;
  expense: number;
  profit: number;
  balance_due: number;
  subdeal_department?: string; // Corrected field name for clarity
  project_handled_by: string;
  working_timeline: WorkingTimelineItem[];
  project_timeline: ProjectTimelineItem[];
  expense_bill_format: string;
  approval_status: "Modification" | "Approved";
};

export default function PreprocessListPage() {
  const [items, setItems] = useState<PreprocessItem[]>([]);
  
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: 'none' as 'none' | 'delete',
    item: null as PreprocessItem | null,
    title: '',
    message: '',
  });

  useEffect(() => {
    const storedData = localStorage.getItem("preprocessData");
    if (storedData) {
      const parsedData: PreprocessItem[] = JSON.parse(storedData);
      // --- 2. More Robust Data Loading ---
      // This ensures that older data without the new fields won't crash the page.
      const sanitizedData = parsedData.map(item => ({
        ...item,
        working_timeline: Array.isArray(item.working_timeline) ? item.working_timeline : [],
        project_timeline: Array.isArray(item.project_timeline) ? item.project_timeline : [],
        approval_status: item.approval_status || "Modification",
      }));
      setItems(sanitizedData);
    }
  }, []);

  const updateLocalStorage = (updatedItems: PreprocessItem[]) => {
      localStorage.setItem("preprocessData", JSON.stringify(updatedItems));
  };
  
  const navigate = (path: string) => {
      window.location.href = path;
  };
  
  const closeDialog = () => setDialogState({ isOpen: false, mode: 'none', item: null, title: '', message: '' });

  const openDeleteDialog = (item: PreprocessItem) => {
    setDialogState({ isOpen: true, mode: 'delete', item, title: 'Confirm Deletion', message: `Are you sure you want to delete the item for "${item.company_name}"?` });
  };

  const handleConfirmDelete = () => {
    if (!dialogState.item) return;
    const updatedItems = items.filter((item) => item.id !== dialogState.item!.id);
    setItems(updatedItems);
    updateLocalStorage(updatedItems);
    closeDialog();
  };
  
  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  }

  return (
    <div className="min-h-screen p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-700">Preprocess</h1>
        <button
          onClick={() => navigate("/crm/pipelines/preprocess/new")}
          className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          + Add Preprocess
        </button>
      </div>

      <div className="overflow-x-auto border rounded shadow">
        <table className="w-full border-collapse">
          <thead className="text-green-800 bg-green-100">
            <tr>
              {["Date", "Company Name", "Department", "Order Value", "Balance Due", "Status", "Actions"].map((h) => (
                <th key={h} className="p-2 text-left border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-green-50">
                  <td className="p-2 border">{format(new Date(item.date), "dd/MM/yyyy")}</td>
                  <td className="p-2 border">{item.company_name}</td>
                  <td className="p-2 border">{item.department}</td>
                  <td className="p-2 border">{formatCurrency(item.order_value)}</td>
                  <td className="p-2 border font-semibold text-orange-600">{formatCurrency(item.balance_due)}</td>
                  <td className="p-2 border">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.approval_status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                          {item.approval_status}
                      </span>
                  </td>
                  <td className="p-2 border">
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => navigate(`/crm/pipelines/preprocess/${item.id}/view`)} className="px-3 py-1 text-xs text-white bg-blue-500 rounded-md hover:bg-blue-600">View</button>
   
                            <button onClick={() => navigate(`/crm/pipelines/preprocess/${item.id}/edit`)} className="px-3 py-1 text-xs text-white bg-yellow-500 rounded-md hover:bg-yellow-600">Edit</button>

                        <button onClick={() => openDeleteDialog(item)} className="px-3 py-1 text-xs text-white bg-red-500 rounded-md hover:bg-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">No preprocess items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {dialogState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="w-full max-w-md p-6 m-4 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-bold text-gray-800">{dialogState.title}</h2>
                <p className="mt-3 text-gray-600">{dialogState.message}</p>
                <div className="flex justify-end mt-6 space-x-4">
                    <button onClick={closeDialog} className="px-5 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    {dialogState.mode === 'delete' && <button onClick={handleConfirmDelete} className="px-5 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}