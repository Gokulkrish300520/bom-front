"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2 } from "lucide-react";

// --- TYPE DEFINITIONS ---
export type StageHistory = {
    stage: string;
    date: string;
};

export type ExpenseDetail = {
    s_no: number;
    description: string;
    supplier_details: string;
    unit_price: number;
    total_price: number;
};

export type WorkingTimelineItem = {
    s_no: number;
    description: string;
    deadline: string;
    approved: "Yes" | "Rework";
    notes?: string;
};

export type ProjectTimelineItem = {
    s_no: number;
    description: string;
    deadline: string;
    notes?: string;
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
    working_timeline_upload?: string;
    project_timeline: ProjectTimelineItem[];
    project_timeline_upload?: string;
    expense_details: ExpenseDetail[];
    expense_upload?: string;
    expense_notes?: string;
    approval_status: "Modification" | "Pending Approval" | "Approved" | "Rejected";
    approval_requested_date?: string;
    approval_requested_by?: string;
    last_reminder_date?: string;
    rejection_reason?: string;
    stage_history?: StageHistory[];
};

export type PostProcessItem = Omit<PreprocessItem, 'approval_status'> & {
    post_process_status: "Pending";
    stage_history?: StageHistory[];
};

export default function EditPreprocessPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const pipelineId = params?.pipelineId as string;
    const [formData, setFormData] = useState<PreprocessItem | null>(null);
    const [dialogState, setDialogState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const [currentUser, setCurrentUser] = useState<string>("");

    // --- SHARED CONSTANTS (Moved inside component) ---
    const departments = ["Fab", "EMS", "Component", "R&D", "Sales"];
    const teamMembers = ["Alice", "Bob", "Charlie", "David", "Eve"];

    // Load current user (in real app, this would come from authentication)
    useEffect(() => {
        const user = localStorage.getItem("currentUser") || "Current User";
        setCurrentUser(user);
    }, []);

    // Effect to load data from localStorage
    useEffect(() => {
        if (id) {
            const storedData = localStorage.getItem("preprocessData") || "[]";
            const data: PreprocessItem[] = JSON.parse(storedData);
            const itemToEdit = data.find((item) => item.id === id);

            if (itemToEdit) {
                // Ensure advance_payment is an object, handling legacy data if it's a number
                if (typeof itemToEdit.advance_payment === 'number' || !itemToEdit.advance_payment) {
                    itemToEdit.advance_payment = { amount: (itemToEdit.advance_payment as unknown as number) || 0, bank_details: '', date: '' };
                }
                // Sanitize arrays to prevent runtime errors if data is malformed
                const sanitizedItem = {
                    ...itemToEdit,
                    working_timeline: Array.isArray(itemToEdit.working_timeline) ? itemToEdit.working_timeline : [],
                    project_timeline: Array.isArray(itemToEdit.project_timeline) ? itemToEdit.project_timeline : [],
                    expense_details: Array.isArray(itemToEdit.expense_details) ? itemToEdit.expense_details : [],
                    stage_history: Array.isArray(itemToEdit.stage_history) ? itemToEdit.stage_history : [],
                    approval_status: itemToEdit.approval_status || "Modification",
                };
                setFormData(sanitizedItem);
            }
        }
    }, [id]);

    // Effect for auto-calculating expense total, profit and balance due
    useEffect(() => {
        if (formData) {
            setFormData(prev => {
                if (!prev) return null;
                // Calculate total expense from expense_details
                const totalExpense = prev.expense_details.reduce((sum, item) => sum + (item.total_price || 0), 0);
                const profit = (prev.order_value || 0) - totalExpense;
                const balance_due = (prev.order_value || 0) - (prev.advance_payment?.amount || 0);
                // Only update if the values have changed to prevent infinite loops
                if (prev.expense !== totalExpense || prev.profit !== profit || prev.balance_due !== balance_due) {
                    return { ...prev, expense: totalExpense, profit, balance_due };
                }
                return prev;
            });
        }
    }, [formData?.order_value, formData?.expense_details, formData?.advance_payment?.amount, formData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => prev ? ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }) : null);
    };

    const handleAdvancePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => prev ? ({ ...prev, advance_payment: { ...prev.advance_payment, [name]: isNumber ? parseFloat(value) || 0 : value } }) : null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormData(prev => prev ? ({ ...prev, fileName: file?.name || "" }) : null);
    };

    const handleTimelineChange = (
        index: number,
        field: keyof WorkingTimelineItem | keyof ProjectTimelineItem,
        value: string | number,
        timelineType: 'working_timeline' | 'project_timeline'
    ) => {
        setFormData(prev => {
            if (!prev) return null;
            const updatedTimeline = prev[timelineType].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            );
            return { ...prev, [timelineType]: updatedTimeline };
        });
    };
    
    const addTimelineRow = (timelineType: 'working_timeline' | 'project_timeline') => {
        setFormData(prev => {
            if (!prev) return null;
            if (timelineType === 'working_timeline') {
                const newRow: WorkingTimelineItem = { s_no: prev.working_timeline.length + 1, description: '', deadline: '', approved: 'Rework', notes: '' };
                return { ...prev, working_timeline: [...prev.working_timeline, newRow] };
            } else {
                const newRow: ProjectTimelineItem = { s_no: prev.project_timeline.length + 1, description: '', deadline: '', notes: '' };
                return { ...prev, project_timeline: [...prev.project_timeline, newRow] };
            }
        });
    };

    const removeTimelineRow = (indexToRemove: number, timelineType: 'working_timeline' | 'project_timeline') => {
        setFormData(prev => {
            if (!prev) return null;
            const newTimeline = prev[timelineType]
                .filter((_, i) => i !== indexToRemove)
                .map((row, i) => ({ ...row, s_no: i + 1 }));
            return { ...prev, [timelineType]: newTimeline };
        });
    };

    const handleProjectTimelineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormData(prev => prev ? ({ ...prev, project_timeline_upload: file?.name || "" }) : null);
    };

    const handleExpenseDetailChange = (index: number, field: keyof ExpenseDetail, value: string | number) => {
        setFormData(prev => {
            if (!prev) return null;
            const updatedExpenseDetails = prev.expense_details.map((item, i) => {
                if (i === index) {
                    const updatedItem = { ...item, [field]: value };
                    // Auto-calculate total_price if unit_price changes
                    if (field === 'unit_price') {
                        updatedItem.total_price = updatedItem.unit_price || 0;
                    }
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, expense_details: updatedExpenseDetails };
        });
    };

    const addExpenseDetailRow = () => {
        setFormData(prev => {
            if (!prev) return null;
            const newRow: ExpenseDetail = {
                s_no: prev.expense_details.length + 1,
                description: '',
                supplier_details: '',
                unit_price: 0,
                total_price: 0
            };
            return { ...prev, expense_details: [...prev.expense_details, newRow] };
        });
    };

    const removeExpenseDetailRow = (indexToRemove: number) => {
        setFormData(prev => {
            if (!prev) return null;
            const newExpenseDetails = prev.expense_details
                .filter((_, i) => i !== indexToRemove)
                .map((row, i) => ({ ...row, s_no: i + 1 }));
            return { ...prev, expense_details: newExpenseDetails };
        });
    };

    const handleExpenseUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormData(prev => prev ? ({ ...prev, expense_upload: file?.name || "" }) : null);
    };

    const handleWorkingTimelineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFormData(prev => prev ? ({ ...prev, working_timeline_upload: file?.name || "" }) : null);
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
        if (!formData) return;
        const data: PreprocessItem[] = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        const updatedData = data.map(item => (item.id === id ? formData : item));
        localStorage.setItem("preprocessData", JSON.stringify(updatedData));
        router.push(`/crm/pipelines/${pipelineId}/preprocess`);
    };

    const handleSendForApproval = () => {
        if (!formData) return;
        
        // Validate Working Timeline
        const invalidWorkingTimeline = formData.working_timeline.some(
            item => !item.description || !item.deadline
        );
        
        // Validate Project Timeline
        const invalidProjectTimeline = formData.project_timeline.some(
            item => !item.description || !item.deadline
        );
        
        if (invalidWorkingTimeline || invalidProjectTimeline) {
            let errorMessage = "Please fill in all required fields before sending for approval:\n\n";
            
            if (invalidWorkingTimeline) {
                errorMessage += "• Working Timeline: All rows must have Description and Deadline filled.\n";
            }
            
            if (invalidProjectTimeline) {
                errorMessage += "• Project Timeline: All rows must have Description and Deadline filled.\n";
            }
            
            setDialogState({
                isOpen: true,
                title: "Validation Error",
                message: errorMessage,
                onConfirm: () => closeDialog()
            });
            return;
        }
        
        setDialogState({
            isOpen: true,
            title: "Send for Approval",
            message: "Are you sure you want to send this for admin approval? You won't be able to edit it until it's reviewed.",
            onConfirm: () => proceedWithSendForApproval()
        });
    };

    const proceedWithSendForApproval = () => {
        if (!formData) return;
        
        const updatedFormData = {
            ...formData,
            approval_status: "Pending Approval" as const,
            approval_requested_date: new Date().toISOString(),
            approval_requested_by: currentUser,
            stage_history: [
                ...(formData.stage_history || []),
                { stage: 'Sent for Approval', date: new Date().toISOString() }
            ]
        };
        
        const data: PreprocessItem[] = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        const updatedData = data.map(item => (item.id === id ? updatedFormData : item));
        localStorage.setItem("preprocessData", JSON.stringify(updatedData));
        
        // Store approval request for admin
        const approvalRequests = JSON.parse(localStorage.getItem("approvalRequests") || "[]");
        approvalRequests.push({
            id: formData.id,
            type: "preprocess",
            company_name: formData.company_name,
            department: formData.department,
            requested_by: currentUser,
            requested_date: new Date().toISOString(),
            pipelineId: pipelineId
        });
        localStorage.setItem("approvalRequests", JSON.stringify(approvalRequests));
        
        closeDialog();
        router.push(`/crm/pipelines/${pipelineId}/preprocess`);
    };

    const handleSendReminder = () => {
        if (!formData) return;
        
        const updatedFormData = {
            ...formData,
            last_reminder_date: new Date().toISOString(),
        };
        
        const data: PreprocessItem[] = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        const updatedData = data.map(item => (item.id === id ? updatedFormData : item));
        localStorage.setItem("preprocessData", JSON.stringify(updatedData));
        setFormData(updatedFormData);
        
        // Update approval request with reminder
        const approvalRequests = JSON.parse(localStorage.getItem("approvalRequests") || "[]");
        const updatedRequests = approvalRequests.map((req: any) => 
            req.id === formData.id ? { ...req, last_reminder: new Date().toISOString() } : req
        );
        localStorage.setItem("approvalRequests", JSON.stringify(updatedRequests));
        
        alert("Reminder sent to admin successfully!");
    };
    
    const proceedToApprove = () => {
        if (!formData) return;
        const { approval_status: _, ...rest } = formData; // Use `_` to denote an intentionally unused variable
        const newPostProcessItem: PostProcessItem = {
            ...rest,
            post_process_status: "Pending",
            stage_history: [
                ...(formData.stage_history || []),
                { stage: 'Moved to Post Process', date: new Date().toISOString() }
            ]
        };

        const postProcessData: PostProcessItem[] = JSON.parse(localStorage.getItem("postprocessData") || "[]");
        localStorage.setItem("postprocessData", JSON.stringify([...postProcessData, newPostProcessItem]));

        const preprocessData: PreprocessItem[] = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        const updatedPreprocess = preprocessData.filter(item => item.id !== id);
        localStorage.setItem("preprocessData", JSON.stringify(updatedPreprocess));
        router.push(`/crm/pipelines/${pipelineId}/preprocess`);
    };

    if (!formData) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6"><h1 className="text-3xl font-bold text-green-700">Edit Preprocess Item</h1></header>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm"><legend className="text-lg font-semibold text-gray-600">Original Details</legend><div className="grid grid-cols-1 gap-5 mt-4 md:grid-cols-4"><div><label className="text-sm font-medium text-gray-500">Company</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.company_name}</p></div><div><label className="text-sm font-medium text-gray-500">Contact</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.contact}</p></div><div><label className="text-sm font-medium text-gray-500">State</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.state}</p></div><div><label className="text-sm font-medium text-gray-500">Source</label><p className="p-2 mt-1 bg-gray-100 rounded">{formData.source}</p></div></div></fieldset>
                    
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm">
                        <legend className="text-lg font-semibold text-green-800">Financials & Billing</legend>
                        <div className="grid grid-cols-1 gap-6 mt-4">
                            {/* Order Value */}
                            <div>
                                <label className="block font-medium">Order Value – Quotation Subtotal</label>
                                <input type="number" name="order_value" value={formData.order_value} onChange={handleChange} className="w-full p-2 mt-1 border rounded" />
                            </div>

                            {/* Expense Details Table */}
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <h3 className="font-semibold text-gray-700 mb-3">Expense Details</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-100 text-left text-sm font-medium text-gray-600">
                                                <th className="p-2">S.No</th>
                                                <th className="p-2">Description</th>
                                                <th className="p-2">Supplier Details</th>
                                                <th className="p-2">Unit Price</th>
                                                <th className="p-2">Total Price</th>
                                                <th className="p-2">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.expense_details.map((row, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="p-2">
                                                        <input type="number" value={row.s_no} onChange={(e) => handleExpenseDetailChange(index, "s_no", parseInt(e.target.value) || 0)} className="w-16 p-2 border rounded"/>
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="text" value={row.description} onChange={(e) => handleExpenseDetailChange(index, "description", e.target.value)} className="w-full p-2 border rounded"/>
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="text" value={row.supplier_details} onChange={(e) => handleExpenseDetailChange(index, "supplier_details", e.target.value)} className="w-full p-2 border rounded"/>
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="number" value={row.unit_price} onChange={(e) => handleExpenseDetailChange(index, "unit_price", parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded"/>
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="number" value={row.total_price} onChange={(e) => handleExpenseDetailChange(index, "total_price", parseFloat(e.target.value) || 0)} className="w-full p-2 border rounded"/>
                                                    </td>
                                                    <td className="p-2">
                                                        <button type="button" onClick={() => removeExpenseDetailRow(index)} className="p-2 text-red-500 hover:text-red-700">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button type="button" onClick={addExpenseDetailRow} className="mt-3 px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">
                                    + Add Expense Row
                                </button>
                            </div>

                            {/* Upload Option and Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block font-medium">Upload Expense Document</label>
                                    <input type="file" onChange={handleExpenseUploadChange} className="w-full p-2 mt-1 text-sm border rounded bg-white" />
                                    {formData.expense_upload && <p className="text-xs text-gray-500 mt-1">Current file: {formData.expense_upload}</p>}
                                </div>
                                <div>
                                    <label className="block font-medium">Expense Notes</label>
                                    <textarea name="expense_notes" value={formData.expense_notes || ''} onChange={handleChange} rows={3} className="w-full p-2 mt-1 border rounded" placeholder="Additional notes about expenses..."></textarea>
                                </div>
                            </div>

                            {/* Total Expense (Auto-calculated) */}
                            <div>
                                <label className="block font-medium text-orange-600">Total Expense (Auto-calculated)</label>
                                <input type="text" value={(formData.expense || 0).toLocaleString('en-IN')} readOnly className="w-full p-2 mt-1 bg-orange-50 border-orange-200 rounded text-orange-800 font-semibold" />
                            </div>

                            {/* Advance Payment Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-gray-50">
                                <div>
                                    <label className="block font-medium">Advance Amount</label>
                                    <input type="number" name="amount" value={formData.advance_payment.amount} onChange={handleAdvancePaymentChange} className="w-full p-2 mt-1 border rounded" />
                                </div>
                                <div>
                                    <label className="block font-medium">Bank Details</label>
                                    <input type="text" name="bank_details" value={formData.advance_payment.bank_details} onChange={handleAdvancePaymentChange} className="w-full p-2 mt-1 border rounded" />
                                </div>
                                <div>
                                    <label className="block font-medium">Payment Date</label>
                                    <input type="date" name="date" value={formData.advance_payment.date} onChange={handleAdvancePaymentChange} className="w-full p-2 mt-1 border rounded" />
                                </div>
                            </div>

                            {/* Profit and Balance Due */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block font-medium text-blue-600">Profit (Auto-calculated)</label>
                                    <input type="text" value={(formData.profit || 0).toLocaleString('en-IN')} readOnly className="w-full p-2 mt-1 bg-blue-50 border-blue-200 rounded text-blue-800 font-semibold" />
                                </div>
                                <div>
                                    <label className="block font-medium text-red-600">Balance Due</label>
                                    <input type="text" value={(formData.balance_due || 0).toLocaleString('en-IN')} readOnly className="w-full p-2 mt-1 bg-red-50 border-red-200 rounded text-red-800 font-semibold" />
                                </div>
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm"><legend className="text-lg font-semibold text-green-800">Team, Handovers & Files</legend><div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2"><div><label className="block font-medium">Subdeal Department</label><input list="departments" name="subdeal_department" value={formData.subdeal_department || ''} onChange={handleChange} className="w-full p-2 mt-1 border rounded" /><datalist id="departments">{departments.map(d => <option key={d} value={d} />)}</datalist></div><div><label className="block font-medium">Project Handled By</label><input list="teamMembers" name="project_handled_by" value={formData.project_handled_by} onChange={handleChange} required className="w-full p-2 mt-1 border rounded" /><datalist id="teamMembers">{teamMembers.map(m => <option key={m} value={m} />)}</datalist></div><div className="md:col-span-2"><label className="block font-medium">Main Project File</label><input type="file" onChange={handleFileChange} className="w-full p-2 mt-1 text-sm border rounded bg-white" /><p className="text-xs text-gray-500 mt-1">Current file: {formData.fileName || 'None'}</p></div></div></fieldset>

                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm">
                        <legend className="text-lg font-semibold text-green-800">Working Timeline</legend>
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-sm font-medium text-gray-600">
                                        <th className="p-2">S.No</th>
                                        <th className="p-2">Description <span className="text-red-500">*</span></th>
                                        <th className="p-2">Deadline <span className="text-red-500">*</span></th>
                                        <th className="p-2">Approved</th>
                                        <th className="p-2">Notes</th>
                                        <th className="p-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.working_timeline.map((row, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    value={row.s_no} 
                                                    onChange={(e) => handleTimelineChange(index, "s_no", parseInt(e.target.value) || 0, "working_timeline")} 
                                                    className="w-16 p-2 border rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="text" 
                                                    value={row.description} 
                                                    onChange={(e) => handleTimelineChange(index, "description", e.target.value, "working_timeline")} 
                                                    required
                                                    className="w-full p-2 border rounded"
                                                    placeholder="Enter description"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="date" 
                                                    value={row.deadline} 
                                                    onChange={(e) => handleTimelineChange(index, "deadline", e.target.value, "working_timeline")} 
                                                    required
                                                    className="w-full p-2 border rounded"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <select 
                                                    value={row.approved} 
                                                    onChange={(e) => handleTimelineChange(index, "approved", e.target.value as WorkingTimelineItem['approved'], "working_timeline")} 
                                                    className="w-full p-2 border rounded bg-white"
                                                >
                                                    <option>Rework</option>
                                                    <option>Yes</option>
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <textarea 
                                                    value={row.notes || ''} 
                                                    onChange={(e) => handleTimelineChange(index, "notes", e.target.value, "working_timeline")} 
                                                    rows={2}
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="Add notes..."
                                                />
                                            </td>
                                            <td className="p-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeTimelineRow(index, "working_timeline")} 
                                                    className="p-2 text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex gap-4 items-start">
                            <button 
                                type="button" 
                                onClick={() => addTimelineRow('working_timeline')} 
                                className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                            >
                                + Add Working Row
                            </button>
                            <div className="flex-1">
                                <label className="block font-medium text-sm text-gray-700 mb-1">Upload File for Working Timeline</label>
                                <input 
                                    type="file" 
                                    onChange={handleWorkingTimelineFileChange} 
                                    className="w-full p-2 border rounded text-sm bg-white" 
                                />
                                {formData.working_timeline_upload && (
                                    <p className="text-xs text-gray-500 mt-1">Current file: {formData.working_timeline_upload}</p>
                                )}
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm">
                        <legend className="text-lg font-semibold text-green-800">Project Timeline</legend>
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-sm font-medium text-gray-600">
                                        <th className="p-2">S.No</th>
                                        <th className="p-2">Description <span className="text-red-500">*</span></th>
                                        <th className="p-2">Deadline <span className="text-red-500">*</span></th>
                                        <th className="p-2">Notes</th>
                                        <th className="p-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.project_timeline.map((row, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="p-2">
                                                <input 
                                                    type="number" 
                                                    value={row.s_no} 
                                                    onChange={(e) => handleTimelineChange(index, 's_no', parseInt(e.target.value) || 0, 'project_timeline')} 
                                                    className="w-16 p-2 border rounded" 
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="text" 
                                                    value={row.description} 
                                                    onChange={(e) => handleTimelineChange(index, 'description', e.target.value, 'project_timeline')} 
                                                    required
                                                    className="w-full p-2 border rounded"
                                                    placeholder="Enter description"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input 
                                                    type="date" 
                                                    value={row.deadline} 
                                                    onChange={(e) => handleTimelineChange(index, 'deadline', e.target.value, 'project_timeline')} 
                                                    required
                                                    className="w-full p-2 border rounded" 
                                                />
                                            </td>
                                            <td className="p-2">
                                                <textarea 
                                                    value={row.notes || ''} 
                                                    onChange={(e) => handleTimelineChange(index, 'notes', e.target.value, 'project_timeline')} 
                                                    rows={2}
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="Add notes..."
                                                />
                                            </td>
                                            <td className="p-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeTimelineRow(index, 'project_timeline')} 
                                                    className="p-2 text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex gap-4 items-start">
                            <button 
                                type="button" 
                                onClick={() => addTimelineRow('project_timeline')} 
                                className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                            >
                                + Add Project Row
                            </button>
                            <div className="flex-1">
                                <label className="block font-medium text-sm text-gray-700 mb-1">Upload File for Project Timeline</label>
                                <input 
                                    type="file" 
                                    onChange={handleProjectTimelineFileChange} 
                                    className="w-full p-2 border rounded text-sm bg-white" 
                                />
                                {formData.project_timeline_upload && (
                                    <p className="text-xs text-gray-500 mt-1">Current file: {formData.project_timeline_upload}</p>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="p-6 bg-white border rounded-lg shadow-sm">
                        <legend className="text-lg font-semibold text-green-800">Approval Status</legend>
                        <div className="mt-4 space-y-4">
                            {/* Current Status Display */}
                            <div>
                                <label className="block font-medium mb-2">Current Status</label>
                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-2 rounded-full font-semibold ${
                                        formData.approval_status === "Approved" ? "bg-green-100 text-green-800" :
                                        formData.approval_status === "Pending Approval" ? "bg-yellow-100 text-yellow-800" :
                                        formData.approval_status === "Rejected" ? "bg-red-100 text-red-800" :
                                        "bg-gray-100 text-gray-800"
                                    }`}>
                                        {formData.approval_status}
                                    </span>
                                </div>
                            </div>

                            {/* Approval Information */}
                            {formData.approval_requested_date && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-sm text-blue-800">
                                        <strong>Requested on:</strong> {new Date(formData.approval_requested_date).toLocaleString()}
                                    </p>
                                    {formData.approval_requested_by && (
                                        <p className="text-sm text-blue-800 mt-1">
                                            <strong>Requested by:</strong> {formData.approval_requested_by}
                                        </p>
                                    )}
                                    {formData.last_reminder_date && (
                                        <p className="text-sm text-blue-800 mt-1">
                                            <strong>Last reminder:</strong> {new Date(formData.last_reminder_date).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {formData.approval_status === "Rejected" && formData.rejection_reason && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                                    <p className="text-sm text-red-700">{formData.rejection_reason}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleSendForApproval}
                                    className="px-6 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                    Send for Approval
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleSendReminder}
                                    className="px-6 py-2 font-semibold text-white bg-orange-600 rounded hover:bg-orange-700 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                    </svg>
                                    Send Reminder
                                </button>

                                {formData.approval_status === "Approved" && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded flex-1">
                                        <p className="text-sm text-green-800">
                                            ✓ This item has been approved and will move to Post Process when you update.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                {formData.approval_status === "Modification" || formData.approval_status === "Rejected" 
                                    ? "Click 'Send for Approval' to submit this for admin review."
                                    : formData.approval_status === "Pending Approval"
                                    ? "Waiting for admin approval. You can send a reminder if needed."
                                    : "Approved items will be moved to Post Process upon update."}
                            </p>
                        </div>
                    </fieldset>

                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
                        <button type="button" onClick={() => router.push(`/crm/pipelines/${pipelineId}/preprocess`)} className="px-6 py-2 font-semibold border rounded bg-gray-100 hover:bg-gray-200">Cancel</button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700"
                            disabled={formData.approval_status === "Pending Approval"}
                        >
                            {formData.approval_status === "Pending Approval" ? "Awaiting Approval" : "Update Preprocess"}
                        </button>
                    </div>
                </form>
            </div>
            {dialogState.isOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"><div className="w-full max-w-md p-6 m-4 bg-white rounded-lg shadow-xl"><h2 className="text-xl font-bold text-gray-800">{dialogState.title}</h2><p className="mt-3 text-gray-600">{dialogState.message}</p><div className="flex justify-end mt-6 space-x-4"><button onClick={closeDialog} className="px-5 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button><button onClick={dialogState.onConfirm} className="px-5 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">Confirm</button></div></div></div>)}
        </div>
    );
}
