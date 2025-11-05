"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"; // Correctly import useRouter
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

// --- TYPE DEFINITIONS ---
export type StageHistory = {
    stage: string;
    date: string;
};

export type NegotiationEvent = {
    id: string;
    date: string;
    remarks: string;
    next_followup_date: string;
};

export type Negotiation = {
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
    priority: "High" | "Medium" | "Low";
    quotation_status: "Followup" | "Closed" | "Convert";
    events: NegotiationEvent[];
    team_member?: string;
    followup_datetime?: string;
    closed_reason?: string;
    convert_info?: string;
    po_document?: string;
    stage_history?: StageHistory[];
};

export type PreprocessItem = Omit<Negotiation, 'quotation_status' | 'closed_reason' | 'followup_datetime'> & {
    approval_status: "Pending";
};

export type ClosedItem = {
    id: string;
    company_name: string;
    department: string;
    rejection_stage: "RFQ" | "Feasibility" | "Quotation" | "Negotiation";
    rejection_reason: string;
    closed_date: string;
    stage_history?: StageHistory[];
};

export default function NegotiationListPage() {
    const router = useRouter(); // Initialize router
    const params = useParams();
    const pipelineId = params?.pipelineId as string;
    const [items, setItems] = useState<Negotiation[]>([]);
    
    // Corrected: Add 'none' to the dialog mode type
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        mode: 'none' as 'delete' | 'convert' | 'close' | 'success' | 'none',
        item: null as Negotiation | null,
        title: '',
        message: '',
    });
    const [reason, setReason] = useState("");

    useEffect(() => {
        const storedData = localStorage.getItem("negotiationData");
        if (storedData) {
            const parsedData: Negotiation[] = JSON.parse(storedData).map((item: Partial<Negotiation>) => ({
                ...item,
                id: item.id || uuidv4(),
                events: Array.isArray(item.events) ? item.events : [],
                stage_history: Array.isArray(item.stage_history) ? item.stage_history : [],
            } as Negotiation));
            setItems(parsedData);
        }
    }, []);

    const updateLocalStorage = (updatedItems: Negotiation[]) => {
        localStorage.setItem("negotiationData", JSON.stringify(updatedItems));
    };
    
    const closeDialog = () => {
        setDialogState({ isOpen: false, mode: 'none', item: null, title: '', message: '' });
        setReason("");
    };

    const openDeleteDialog = (item: Negotiation) => {
        setDialogState({ isOpen: true, mode: 'delete', item, title: 'Confirm Deletion', message: `Are you sure you want to delete the negotiation for "${item.company_name}"?` });
    };
    
    const openConvertDialog = (item: Negotiation) => {
        setDialogState({ isOpen: true, mode: 'convert', item, title: 'Confirm Conversion', message: `This will convert the deal for "${item.company_name}" and move it to Preprocess. Proceed?` });
    };

    const openCloseDialog = (item: Negotiation) => {
        setDialogState({ isOpen: true, mode: 'close', item, title: 'Close Negotiation', message: `Provide a reason for closing the deal with "${item.company_name}".` });
    };

    const handleConfirmDelete = () => {
        if (!dialogState.item) return;
        const updatedItems = items.filter((item) => item.id !== dialogState.item!.id);
        setItems(updatedItems);
        updateLocalStorage(updatedItems);
        closeDialog();
    };

    const handleConfirmConvert = () => {
        const itemToMove = dialogState.item;
        if (!itemToMove) return;

        const { quotation_status: _, closed_reason: __, followup_datetime: ___, ...rest } = itemToMove;
        
        const newItem: PreprocessItem = {
            ...rest,
            id: uuidv4(),
            date: new Date().toISOString(),
            approval_status: "Pending",
            stage_history: [
                ...(itemToMove.stage_history || []),
                { stage: 'Moved to Preprocess', date: new Date().toISOString() }
            ],
        };

        const data: PreprocessItem[] = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        data.push(newItem);
        localStorage.setItem("preprocessData", JSON.stringify(data));

        const updatedItems = items.filter(i => i.id !== itemToMove.id);
        setItems(updatedItems);
        updateLocalStorage(updatedItems);
        setDialogState({ isOpen: true, mode: 'success', item: null, title: 'Success', message: `Moved '${itemToMove.company_name}' to Preprocess.` });
    };

    const handleConfirmClose = () => {
        const itemToMove = dialogState.item;
        if (!itemToMove) return;
        if (!reason.trim()) {
            alert("A reason is required to close the deal.");
            return;
        }

        const newItem: ClosedItem = {
            id: itemToMove.id,
            company_name: itemToMove.company_name,
            department: itemToMove.department,
            rejection_stage: "Negotiation",
            rejection_reason: reason,
            closed_date: new Date().toISOString(),
            stage_history: [
                ...(itemToMove.stage_history || []),
                { stage: 'Closed from Negotiation', date: new Date().toISOString() }
            ],
        };

        const data: ClosedItem[] = JSON.parse(localStorage.getItem("closedData") || "[]");
        data.push(newItem);
        localStorage.setItem("closedData", JSON.stringify(data));

        const updatedItems = items.filter(i => i.id !== itemToMove.id);
        setItems(updatedItems);
        updateLocalStorage(updatedItems);
        setDialogState({ isOpen: true, mode: 'success', item: null, title: 'Success', message: `'${itemToMove.company_name}' has been moved to Closed.` });
    };

    const getNextFollowup = (events: NegotiationEvent[]) => {
        if (!events || events.length === 0) return null;
        const latestEvent = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        return latestEvent.next_followup_date;
    };

    return (
        <div className="min-h-screen p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-green-700">Negotiation / Review</h1>
                <div className="flex gap-3">
          <button className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
            Purchase
          </button>
          <button className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
            Sales
          </button>
          </div>
            </div>

            <div className="overflow-x-auto border rounded shadow">
                <table className="w-full border-collapse">
                    <thead className="text-green-800 bg-green-100">
                        <tr>
                            {["Date", "Company Name", "Department", "Team Member", "Next Follow-up", "Actions"].map((h) => (
                                <th key={h} className="p-2 text-left border">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => {
                            const nextFollowupDate = getNextFollowup(item.events);
                            return (
                                <tr key={item.id} className="border-b hover:bg-green-50">
                                    <td className="p-2 border">{format(new Date(item.date), "dd/MM/yyyy")}</td>
                                    <td className="p-2 border">{item.company_name}</td>
                                    <td className="p-2 border">{item.department}</td>
                                    <td className="p-2 border">{item.team_member || "N/A"}</td>
                                    <td className="p-2 border font-medium">
                                        {nextFollowupDate ? format(new Date(nextFollowupDate), "dd/MM/yyyy") : "N/A"}
                                    </td>
                                    <td className="p-2 border">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button onClick={() => openConvertDialog(item)} className="px-3 py-1 text-xs font-semibold text-white bg-green-700 rounded-md hover:bg-green-800">Next</button>
                                            <button onClick={() => openCloseDialog(item)} className="px-3 py-1 text-xs font-semibold text-white bg-orange-500 rounded-md hover:bg-orange-600">Close</button>
                                            {/* Corrected: Use router.push for navigation */}
                                            <button onClick={() => router.push(`/crm/pipelines/${pipelineId}/negotiation/${item.id}/view`)} className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600">view</button>
                                            <button onClick={() => router.push(`/crm/pipelines/${pipelineId}/negotiation/${item.id}/edit`)} className="px-3 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600">Edit</button>
                                            <button onClick={() => openDeleteDialog(item)} className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-md hover:bg-red-600">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {dialogState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="w-full max-w-md p-6 m-4 bg-white rounded-lg shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800">{dialogState.title}</h2>
                        <p className="mt-3 text-gray-600">{dialogState.message}</p>
                        {dialogState.mode === 'close' && (
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for closing..." className="w-full p-2 mt-4 border rounded" rows={3}/>
                        )}
                        <div className="flex justify-end mt-6 space-x-4">
                            {dialogState.mode === 'success' ? (
                                <button onClick={closeDialog} className="px-5 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">OK</button>
                            ) : (
                                <>
                                    <button onClick={closeDialog} className="px-5 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                                    {dialogState.mode === 'delete' && <button onClick={handleConfirmDelete} className="px-5 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>}
                                    {dialogState.mode === 'convert' && <button onClick={handleConfirmConvert} className="px-5 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Confirm</button>}
                                    {dialogState.mode === 'close' && <button onClick={handleConfirmClose} className="px-5 py-2 font-semibold text-white bg-orange-600 rounded-md hover:bg-orange-700">Close Deal</button>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

