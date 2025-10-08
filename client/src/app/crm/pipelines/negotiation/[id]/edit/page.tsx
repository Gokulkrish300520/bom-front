"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

// --- 1. Corrected Type Definitions ---

// Example team members list. This should ideally come from a shared source.
export const teamMembers = ["Sophia Chen", "Liam Goldberg", "Aarav Patel", "Isabella Rossi", "Noah Kim"];

// Represents a single negotiation task, created from a quotation or a subdeal.
export type Negotiation = {
  id: string;
  date: string;
  department: string;   // The specific department for this negotiation task
  company_name: string;
  contact: string;
  state: string;
  deadline: string;
  description: string;
  fileName?: string;
  source: string;
  priority: "High" | "Medium" | "Low";
  customer_notes: string; // Notes from the parent quotation
  subdeal_notes?: string;  // Notes from the specific subdeal, if applicable

  // Fields for the negotiation workflow
  team_member?: string; // The team member assigned to this task
  quotation_status: "Followup" | "Closed" | "Convert";
  followup_datetime?: string;
  closed_reason?: string;
  convert_info?: string;
  po_document?: string;
};

// Represents an item moved to the "Preprocess" pipeline after conversion.
type Preprocess = Omit<Negotiation, 'quotation_status' | 'closed_reason' | 'followup_datetime'> & {
    preprocess_status: "Pending";
};

// Represents an item moved to the "Closed" pipeline.
type ClosedItem = {
  id: string;
  company_name: string;
  department: string;
  rejection_stage: "RFQ" | "Feasibility" | "Quotation" | "Negotiation";
  rejection_reason: string;
  closed_date: string;
};


export default function EditNegotiationPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [formData, setFormData] = useState<Negotiation | null>(null);
    const [dialogState, setDialogState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    useEffect(() => {
        if (id) {
            const storedData = localStorage.getItem("negotiationData") || "[]";
            const data: Negotiation[] = JSON.parse(storedData);
            const itemToEdit = data.find((item) => item.id === id);
            if (itemToEdit) setFormData(itemToEdit);
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!formData) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleFileChange = (fieldName: 'fileName' | 'po_document') => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!formData) return;
        const file = e.target.files?.[0];
        setFormData({ ...formData, [fieldName]: file?.name || "" });
    };

    // --- 2. Corrected Logic for Handling Status Changes ---

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        let confirmationMessage = "Are you sure you want to save these changes?";
        let confirmAction = () => proceedWithUpdate();

        switch (formData.quotation_status) {
            case "Closed":
                if (!formData.closed_reason?.trim()) {
                    alert("A reason is required to close the deal.");
                    return;
                }
                confirmationMessage = `This will move the deal to the Closed pipeline. Proceed?`;
                confirmAction = () => proceedToClose();
                break;
            case "Convert":
                confirmationMessage = `This will convert the deal and move it to the Preprocess pipeline. Proceed?`;
                confirmAction = () => proceedToConvert();
                break;
        }
        
        setDialogState({ isOpen: true, title: "Confirm Action", message: confirmationMessage, onConfirm: confirmAction });
    };
    
    const closeDialog = () => setDialogState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const proceedWithUpdate = () => {
        const data = JSON.parse(localStorage.getItem("negotiationData") || "[]");
        const updatedData = data.map((item: Negotiation) => (item.id === id ? formData : item));
        localStorage.setItem("negotiationData", JSON.stringify(updatedData));
        router.push("/crm/pipelines/negotiation");
    };

    const proceedToClose = () => {
        if (!formData || !formData.closed_reason) return;
        const newClosedItem: ClosedItem = {
            id: formData.id,
            company_name: formData.company_name,
            department: formData.department,
            rejection_stage: "Negotiation",
            rejection_reason: formData.closed_reason,
            closed_date: new Date().toISOString(),
        };
        const closedData = JSON.parse(localStorage.getItem("closedData") || "[]");
        localStorage.setItem("closedData", JSON.stringify([...closedData, newClosedItem]));
        
        const negotiationData = JSON.parse(localStorage.getItem("negotiationData") || "[]");
        const updatedNegotiation = negotiationData.filter((item: Negotiation) => item.id !== id);
        localStorage.setItem("negotiationData", JSON.stringify(updatedNegotiation));
        router.push("/crm/pipelines/negotiation");
    };

    const proceedToConvert = () => {
        if (!formData) return;
        const { quotation_status, closed_reason, followup_datetime, ...rest } = formData;
        const newPreprocessItem: Preprocess = { ...rest, preprocess_status: "Pending" };
        const preprocessData = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        localStorage.setItem("preprocessData", JSON.stringify([...preprocessData, newPreprocessItem]));

        const negotiationData = JSON.parse(localStorage.getItem("negotiationData") || "[]");
        const updatedNegotiation = negotiationData.filter((item: Negotiation) => item.id !== id);
        localStorage.setItem("negotiationData", JSON.stringify(updatedNegotiation));
        router.push("/crm/pipelines/negotiation");
    };

    if (!formData) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-green-700">Edit Negotiation</h1>
                    <p className="text-gray-500 mt-1">Updating deal for: <span className="font-semibold text-gray-700">{formData.company_name}</span></p>
                </header>

                {/* --- 3. Redesigned Form UI --- */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm">
                        <legend className="text-lg font-semibold text-gray-600">Original Details (Read-only)</legend>
                        <div className="grid grid-cols-1 gap-5 mt-4 md:grid-cols-2">
                            <div><label className="text-sm font-medium text-gray-500">Company</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.company_name}</p></div>
                            <div><label className="text-sm font-medium text-gray-500">Department</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.department}</p></div>
                            <div><label className="text-sm font-medium text-gray-500">Contact</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.contact}</p></div>
                            <div><label className="text-sm font-medium text-gray-500">Deadline</label><p className="p-2 mt-1 bg-gray-100 rounded">{format(new Date(formData.deadline), "dd MMMM, yyyy")}</p></div>
                             {formData.subdeal_notes && <div className="md:col-span-2"><label className="text-sm font-medium text-gray-500">Subdeal Notes</label><p className="p-2 mt-1 bg-gray-100 rounded whitespace-pre-wrap">{formData.subdeal_notes}</p></div>}
                        </div>
                    </fieldset>

                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm">
                        <legend className="text-lg font-semibold text-green-800">Negotiation Details</legend>
                        <div className="grid grid-cols-1 gap-6 mt-4">
                            <div>
                                <label htmlFor="team_member" className="block font-medium text-green-800">Assigned Team Member <span className="text-red-500">*</span></label>
                                <input list="teamMembers" id="team_member" name="team_member" value={formData.team_member || ''} onChange={handleChange} required className="w-full p-2 mt-1 border rounded" placeholder="Type to search for a team member"/>
                                <datalist id="teamMembers">
                                    {teamMembers.map(m => <option key={m} value={m} />)}
                                </datalist>
                            </div>
                        </div>
                    </fieldset>

                     <fieldset className="p-6 bg-white border rounded-lg shadow-sm">
                        <legend className="text-lg font-semibold text-green-800">Update Status</legend>
                        <div className="grid grid-cols-1 gap-6 mt-4">
                             <div>
                                <label htmlFor="quotation_status" className="block font-medium text-green-800">Negotiation Status <span className="text-red-500">*</span></label>
                                <select id="quotation_status" name="quotation_status" value={formData.quotation_status} onChange={handleChange} required className="w-full p-2 mt-1 border rounded bg-white">
                                    <option value="Followup">Followup</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Convert">Convert</option>
                                </select>
                            </div>
                            {/* Conditional Fields Based on Status */}
                            {formData.quotation_status === "Followup" && (
                                <div>
                                    <label htmlFor="followup_datetime" className="block font-medium text-green-800">Follow-up Date & Time</label>
                                    <input type="datetime-local" id="followup_datetime" name="followup_datetime" value={formData.followup_datetime || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded"/>
                                </div>
                            )}
                            {formData.quotation_status === "Closed" && (
                                <div>
                                    <label htmlFor="closed_reason" className="block font-medium text-green-800">Reason for Closing <span className="text-red-500">*</span></label>
                                    <textarea id="closed_reason" name="closed_reason" value={formData.closed_reason || ''} onChange={handleChange} required rows={3} className="w-full p-2 mt-1 border rounded"></textarea>
                                </div>
                            )}
                            {formData.quotation_status === "Convert" && (
                                <>
                                    <div>
                                        <label htmlFor="convert_info" className="block font-medium text-green-800">Mail Confirmation / PO Details</label>
                                        <textarea id="convert_info" name="convert_info" value={formData.convert_info || ''} onChange={handleChange} rows={3} className="w-full p-2 mt-1 border rounded"></textarea>
                                    </div>
                                    <div>
                                        <label className="block font-medium text-green-800">Upload PO/Confirmation Document</label>
                                        <input type="file" onChange={handleFileChange('po_document')} className="w-full p-2 mt-1 text-sm border rounded bg-white" />
                                        {formData.po_document && <p className="text-xs text-gray-500 mt-1">Current PO file: {formData.po_document}</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </fieldset>

                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
                        <button type="button" onClick={() => router.push('/crm/pipelines/negotiation')} className="px-6 py-2 font-semibold border rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700">Update</button>
                    </div>
                </form>
            </div>

            {dialogState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="w-full max-w-md p-6 m-4 bg-white rounded-lg shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800">{dialogState.title}</h2>
                        <p className="mt-3 text-gray-600">{dialogState.message}</p>
                        <div className="flex justify-end mt-6 space-x-4">
                            <button onClick={closeDialog} className="px-5 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={dialogState.onConfirm} className="px-5 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}