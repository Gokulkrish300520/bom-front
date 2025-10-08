"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { Trash2 } from "lucide-react";

// --- UPDATED TYPE DEFINITIONS ---
export type StageHistory = {
  stage: string;
  date: string;
};

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
  advance_payment: { amount: number; bank_details: string; date: string; };
  expense: number;
  profit: number;
  balance_due: number;
  subdeal_department?: string;
  project_handled_by: string;
  working_timeline: WorkingTimelineItem[];
  project_timeline: ProjectTimelineItem[];
  expense_bill_format: string;
  approval_status: "Modification" | "Approved";
  stage_history?: StageHistory[];
};

export type PostProcessItem = Omit<PreprocessItem, 'approval_status'> & {
    post_process_status: "Pending";
    stage_history?: StageHistory[];
};

// SHARED CONSTANTS
export const departments = ["Fab", "EMS", "Component", "R&D", "Sales"];
export const teamMembers = ["Alice", "Bob", "Charlie", "David", "Eve"];
export const expenseOptions = ["Format 1", "Format 2", "Format 3", "Format 4", "Format 5"];


export default function EditPreprocessPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [formData, setFormData] = useState<PreprocessItem | null>(null);
    const [dialogState, setDialogState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    useEffect(() => {
        if (id) {
            const storedData = localStorage.getItem("preprocessData") || "[]";
            const data: PreprocessItem[] = JSON.parse(storedData);
            const itemToEdit = data.find((item) => item.id === id);
            if (itemToEdit) {
                if (typeof itemToEdit.advance_payment === 'number' || !itemToEdit.advance_payment) {
                    itemToEdit.advance_payment = { amount: (itemToEdit.advance_payment as unknown as number) || 0, bank_details: '', date: '' };
                }
                const sanitizedItem = {
                    ...itemToEdit,
                    working_timeline: Array.isArray(itemToEdit.working_timeline) ? itemToEdit.working_timeline : [],
                    project_timeline: Array.isArray(itemToEdit.project_timeline) ? itemToEdit.project_timeline : [],
                    stage_history: Array.isArray(itemToEdit.stage_history) ? itemToEdit.stage_history : [],
                };
                setFormData(sanitizedItem);
            }
        }
    }, [id]);

    useEffect(() => {
        if (!formData) return;
        const profit = (formData.order_value || 0) - (formData.expense || 0);
        const balance_due = (formData.order_value || 0) - (formData.advance_payment?.amount || 0);
        setFormData(prev => prev ? ({ ...prev, profit, balance_due }) : null);
    }, [formData?.order_value, formData?.expense, formData?.advance_payment?.amount]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!formData) return;
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData({ ...formData, [name]: isNumber ? parseFloat(value) || 0 : value });
    };

    const handleAdvancePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!formData) return;
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData({ ...formData, advance_payment: { ...formData.advance_payment, [name]: isNumber ? parseFloat(value) || 0 : value } });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!formData) return;
        const file = e.target.files?.[0];
        setFormData({ ...formData, fileName: file?.name || "" });
    };

    const handleTimelineChange = (index: number, field: keyof WorkingTimelineItem | keyof ProjectTimelineItem, value: any, timelineType: 'working_timeline' | 'project_timeline') => {
        if (!formData) return;
        const updatedTimeline = [...formData[timelineType]];
        (updatedTimeline[index] as any)[field] = value;
        setFormData({ ...formData, [timelineType]: updatedTimeline as any });
    };

    const addTimelineRow = (timelineType: 'working_timeline' | 'project_timeline') => {
        if (!formData) return;
        if (timelineType === 'working_timeline') {
            const newRow: WorkingTimelineItem = { s_no: formData.working_timeline.length + 1, description: '', deadline: '', status: 'Over Due', approved: 'Rework' };
            setFormData({ ...formData, working_timeline: [...formData.working_timeline, newRow] });
        } else {
            const newRow: ProjectTimelineItem = { s_no: formData.project_timeline.length + 1, description: '', deadline: '', status: 'Over Due', final_fileName: '' };
            setFormData({ ...formData, project_timeline: [...formData.project_timeline, newRow] });
        }
    };

    const removeTimelineRow = (index: number, timelineType: 'working_timeline' | 'project_timeline') => {
        if (!formData) return;
        const newTimeline = formData[timelineType].filter((_, i) => i !== index).map((row, i) => ({ ...row, s_no: i + 1 }));
        setFormData({ ...formData, [timelineType]: newTimeline as any });
    };

    const handleTimelineFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (!formData) return;
        const file = e.target.files?.[0];
        handleTimelineChange(index, 'final_fileName', file?.name || '', 'project_timeline');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;
        
        let confirmAction = () => proceedWithUpdate();
        let message = "Are you sure you want to save these changes?";

        if (formData.approval_status === "Approved") {
            message = "This will approve the item and move it to Post Process. This action cannot be undone. Proceed?";
            confirmAction = () => proceedToApprove();
        }
        
        setDialogState({ isOpen: true, title: "Confirm Update", message, onConfirm: confirmAction });
    };

    const closeDialog = () => setDialogState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const proceedWithUpdate = () => {
        const data = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        const updatedData = data.map((item: PreprocessItem) => (item.id === id ? formData : item));
        localStorage.setItem("preprocessData", JSON.stringify(updatedData));
        router.push("/crm/pipelines/preprocess");
    };
    
    const proceedToApprove = () => {
        if (!formData) return;
        const { approval_status, ...rest } = formData;
        const newPostProcessItem: PostProcessItem = { 
            ...rest, 
            post_process_status: "Pending",
            stage_history: [
                ...(formData.stage_history || []),
                { stage: 'Moved to Post Process', date: new Date().toISOString() }
            ]
        };

        const postProcessData = JSON.parse(localStorage.getItem("postprocessData") || "[]");
        localStorage.setItem("postprocessData", JSON.stringify([...postProcessData, newPostProcessItem]));

        const preprocessData = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        const updatedPreprocess = preprocessData.filter((item: PreprocessItem) => item.id !== id);
        localStorage.setItem("preprocessData", JSON.stringify(updatedPreprocess));
        router.push("/crm/pipelines/preprocess");
    };

    if (!formData) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6"><h1 className="text-3xl font-bold text-green-700">Edit Preprocess Item</h1></header>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm"><legend className="text-lg font-semibold text-gray-600">Original Details</legend><div className="grid grid-cols-1 gap-5 mt-4 md:grid-cols-4"><div><label className="text-sm font-medium text-gray-500">Company</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.company_name}</p></div><div><label className="text-sm font-medium text-gray-500">Contact</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.contact}</p></div><div><label className="text-sm font-medium text-gray-500">State</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.state}</p></div><div><label className="text-sm font-medium text-gray-500">Source</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.source}</p></div></div></fieldset>
                    
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm"><legend className="text-lg font-semibold text-green-800">Financials & Billing</legend><div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2 lg:grid-cols-3"><div><label className="block font-medium">Order Value</label><input type="number" name="order_value" value={formData.order_value} onChange={handleChange} className="w-full p-2 mt-1 border rounded" /></div><div><label className="block font-medium">Expense</label><input type="number" name="expense" value={formData.expense} onChange={handleChange} className="w-full p-2 mt-1 border rounded" /></div><div className="md:col-span-2 lg:col-span-1"><label className="block font-medium">Expense Bill Format</label><select name="expense_bill_format" value={formData.expense_bill_format} onChange={handleChange} className="w-full p-2 mt-1 bg-white border rounded"><option value="">Select a format</option>{expenseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div><div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-gray-50"><div><label className="block font-medium">Advance Amount</label><input type="number" name="amount" value={formData.advance_payment.amount} onChange={handleAdvancePaymentChange} className="w-full p-2 mt-1 border rounded" /></div><div><label className="block font-medium">Bank Details</label><input type="text" name="bank_details" value={formData.advance_payment.bank_details} onChange={handleAdvancePaymentChange} className="w-full p-2 mt-1 border rounded" /></div><div><label className="block font-medium">Payment Date</label><input type="date" name="date" value={formData.advance_payment.date} onChange={handleAdvancePaymentChange} className="w-full p-2 mt-1 border rounded" /></div></div><div className="lg:col-span-3 grid grid-cols-2 gap-6"><div><label className="block font-medium text-blue-600">Profit</label><input type="text" value={(formData.profit || 0).toLocaleString('en-IN')} readOnly className="w-full p-2 mt-1 bg-blue-50 border-blue-200 rounded text-blue-800 font-semibold" /></div><div><label className="block font-medium text-red-600">Balance Due</label><input type="text" value={(formData.balance_due || 0).toLocaleString('en-IN')} readOnly className="w-full p-2 mt-1 bg-red-50 border-red-200 rounded text-red-800 font-semibold" /></div></div></div></fieldset>
                    
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm"><legend className="text-lg font-semibold text-green-800">Team, Handovers & Files</legend><div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2"><div><label className="block font-medium">Subdeal Department</label><input list="departments" name="subdeal_department" value={formData.subdeal_department || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" /><datalist id="departments">{departments.map(d => <option key={d} value={d} />)}</datalist></div><div><label className="block font-medium">Project Handled By</label><input list="teamMembers" name="project_handled_by" value={formData.project_handled_by} onChange={handleChange} required className="w-full p-2 mt-1 border rounded" /><datalist id="teamMembers">{teamMembers.map(m => <option key={m} value={m} />)}</datalist></div><div className="md:col-span-2"><label className="block font-medium">Main Project File</label><input type="file" onChange={handleFileChange} className="w-full p-2 mt-1 text-sm border rounded bg-white" /><p className="text-xs text-gray-500 mt-1">Current file: {formData.fileName || 'None'}</p></div></div></fieldset>

                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm"><legend className="text-lg font-semibold text-green-800">Working Timeline</legend><div className="overflow-x-auto mt-4"><table className="w-full"><thead><tr className="bg-gray-50 text-left text-sm font-medium text-gray-600"><th>S.No</th><th className="px-2">Description</th><th className="px-2">Deadline</th><th className="px-2">Status</th><th className="px-2">Approved</th><th>Action</th></tr></thead><tbody>{formData.working_timeline.map((row, index) => (<tr key={index}><td><input type="number" value={row.s_no} onChange={(e) => handleTimelineChange(index, "s_no", parseInt(e.target.value) || 0, "working_timeline")} className="w-16 p-2 border rounded"/></td><td className="px-2"><input type="text" value={row.description} onChange={(e) => handleTimelineChange(index, "description", e.target.value, "working_timeline")} className="w-full p-2 border rounded"/></td><td className="px-2"><input type="date" value={row.deadline} onChange={(e) => handleTimelineChange(index, "deadline", e.target.value, "working_timeline")} className="w-full p-2 border rounded"/></td><td className="px-2"><select value={row.status} onChange={(e) => handleTimelineChange(index, "status", e.target.value, "working_timeline")} className="w-full p-2 border rounded bg-white"><option>Over Due</option><option>Completed</option></select></td><td className="px-2"><select value={row.approved} onChange={(e) => handleTimelineChange(index, "approved", e.target.value, "working_timeline")} className="w-full p-2 border rounded bg-white"><option>Rework</option><option>Yes</option></select></td><td><button type="button" onClick={() => removeTimelineRow(index, "working_timeline")} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div><button type="button" onClick={() => addTimelineRow('working_timeline')} className="mt-4 px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">+ Add Working Row</button></fieldset>
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm"><legend className="text-lg font-semibold text-green-800">Project Timeline</legend><div className="overflow-x-auto mt-4"><table className="w-full"><thead><tr className="bg-gray-50 text-left text-sm font-medium text-gray-600"><th>S.No</th><th className="px-2">Description</th><th className="px-2">Deadline</th><th className="px-2">Status</th><th className="px-2">Final File</th><th>Action</th></tr></thead><tbody>{formData.project_timeline.map((row, index) => (<tr key={index}><td><input type="number" value={row.s_no} onChange={(e) => handleTimelineChange(index, 's_no', parseInt(e.target.value) || 0, 'project_timeline')} className="w-16 p-2 border rounded" /></td><td className="px-2"><input type="text" value={row.description} onChange={(e) => handleTimelineChange(index, 'description', e.target.value, 'project_timeline')} className="w-full p-2 border rounded" /></td><td className="px-2"><input type="date" value={row.deadline} onChange={(e) => handleTimelineChange(index, 'deadline', e.target.value, 'project_timeline')} className="w-full p-2 border rounded" /></td><td className="px-2"><select value={row.status} onChange={(e) => handleTimelineChange(index, 'status', e.target.value, 'project_timeline')} className="w-full p-2 border rounded bg-white"><option>Over Due</option><option>Completed</option></select></td><td className="px-2"><input type="file" onChange={(e) => handleTimelineFileChange(e, index)} className="w-full p-1.5 border rounded text-xs" /></td><td><button type="button" onClick={() => removeTimelineRow(index, 'project_timeline')} className="p-2 text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div><button type="button" onClick={() => addTimelineRow('project_timeline')} className="mt-4 px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">+ Add Project Row</button></fieldset>

                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm"><legend className="text-lg font-semibold text-green-800">Approval Status</legend><div className="mt-4"><div><label className="block font-medium">Request for Approval</label><select name="approval_status" value={formData.approval_status} onChange={handleChange} className="w-full p-2 mt-1 bg-white border rounded"><option value="Modification">Modification</option><option value="Approved">Approved</option></select><p className="text-sm text-gray-500 mt-1">If set to 'Approved', this item will be moved to Post Process upon updating.</p></div></div></fieldset>

                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
                        <button type="button" onClick={() => router.push('/crm/pipelines/preprocess')} className="px-6 py-2 font-semibold border rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-6 py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700">Update Preprocess</button>
                    </div>
                </form>
            </div>
            {dialogState.isOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"><div className="w-full max-w-md p-6 m-4 bg-white rounded-lg shadow-xl"><h2 className="text-xl font-bold text-gray-800">{dialogState.title}</h2><p className="mt-3 text-gray-600">{dialogState.message}</p><div className="flex justify-end mt-6 space-x-4"><button onClick={closeDialog} className="px-5 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button><button onClick={dialogState.onConfirm} className="px-5 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Confirm</button></div></div></div>)}
        </div>
    );
}