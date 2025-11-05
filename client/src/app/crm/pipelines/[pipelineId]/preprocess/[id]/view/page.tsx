"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, FileText, Calendar, User, Building2, Phone, MapPin, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

type ExpenseDetail = {
    s_no: number;
    description: string;
    supplier_details: string;
    unit_price: number;
    total_price: number;
};

type WorkingTimelineItem = {
    s_no: number;
    description: string;
    deadline: string;
    approved: "Yes" | "Rework";
    upload_file?: string;
    notes?: string;
};

type ProjectTimelineItem = {
    s_no: number;
    description: string;
    deadline: string;
    upload_file?: string;
    notes?: string;
};

type PreprocessItem = {
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
    expense_details: ExpenseDetail[];
    expense_upload?: string;
    expense_notes?: string;
    approval_status: "Modification" | "Pending Approval" | "Approved" | "Rejected";
    approval_requested_date?: string;
    approval_requested_by?: string;
    last_reminder_date?: string;
    rejection_reason?: string;
    pipelineId?: string;
};

export default function ViewPreprocessPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const pipelineId = params?.pipelineId as string;
    const [item, setItem] = useState<PreprocessItem | null>(null);

    useEffect(() => {
        if (id) {
            const storedData = localStorage.getItem("preprocessData") || "[]";
            const data: PreprocessItem[] = JSON.parse(storedData);
            const foundItem = data.find((item) => item.id === id);

            if (foundItem) {
                setItem(foundItem);
            } else {
                alert("Item not found!");
                router.push(`/crm/pipelines/${pipelineId}/preprocess`);
            }
        }
    }, [id, pipelineId, router]);

    if (!item) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return (value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            "Modification": "bg-gray-100 text-gray-800",
            "Pending Approval": "bg-yellow-100 text-yellow-800",
            "Approved": "bg-green-100 text-green-800",
            "Rejected": "bg-red-100 text-red-800",
        };
        return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/crm/pipelines/${pipelineId}/preprocess`)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Preprocess Details</h1>
                            <p className="text-gray-600">{item.company_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/crm/pipelines/${pipelineId}/preprocess/${id}/edit`)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Edit
                    </button>
                </div>

                {/* Approval Status Banner */}
                <div className={`mb-6 rounded-lg p-4 border-l-4 ${
                    item.approval_status === "Approved" ? "bg-green-50 border-green-500" :
                    item.approval_status === "Pending Approval" ? "bg-yellow-50 border-yellow-500" :
                    item.approval_status === "Rejected" ? "bg-red-50 border-red-500" :
                    "bg-gray-50 border-gray-500"
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {item.approval_status === "Approved" ? <CheckCircle className="text-green-600" size={24} /> :
                             item.approval_status === "Pending Approval" ? <Clock className="text-yellow-600" size={24} /> :
                             item.approval_status === "Rejected" ? <AlertCircle className="text-red-600" size={24} /> :
                             <FileText className="text-gray-600" size={24} />}
                            <div>
                                <p className="font-semibold text-gray-900">Approval Status: {item.approval_status}</p>
                                {item.approval_requested_by && (
                                    <p className="text-sm text-gray-600">
                                        Requested by {item.approval_requested_by} on {format(new Date(item.approval_requested_date!), "MMM dd, yyyy")}
                                    </p>
                                )}
                                {item.rejection_reason && (
                                    <p className="text-sm text-red-700 mt-1">
                                        <strong>Rejection Reason:</strong> {item.rejection_reason}
                                    </p>
                                )}
                            </div>
                        </div>
                        <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadge(item.approval_status)}`}>
                            {item.approval_status}
                        </span>
                    </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="text-blue-600" />
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <label className="text-sm text-gray-600">Date</label>
                            <p className="font-semibold text-gray-900">{format(new Date(item.date), "MMM dd, yyyy")}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Company Name</label>
                            <p className="font-semibold text-gray-900">{item.company_name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Department</label>
                            <p className="font-semibold text-gray-900">{item.department}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Contact</label>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                                <Phone size={16} className="text-gray-500" />
                                {item.contact}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">State</label>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin size={16} className="text-gray-500" />
                                {item.state}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Deadline</label>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar size={16} className="text-gray-500" />
                                {format(new Date(item.deadline), "MMM dd, yyyy")}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Source</label>
                            <p className="font-semibold text-gray-900">{item.source}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Project Handled By</label>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                                <User size={16} className="text-gray-500" />
                                {item.project_handled_by}
                            </p>
                        </div>
                        {item.subdeal_department && (
                            <div>
                                <label className="text-sm text-gray-600">Subdeal Department</label>
                                <p className="font-semibold text-gray-900">{item.subdeal_department}</p>
                            </div>
                        )}
                    </div>
                    
                    {item.description && (
                        <div className="mt-4">
                            <label className="text-sm text-gray-600">Description</label>
                            <p className="font-semibold text-gray-900 mt-1">{item.description}</p>
                        </div>
                    )}
                    
                    {item.customer_notes && (
                        <div className="mt-4">
                            <label className="text-sm text-gray-600">Customer Notes</label>
                            <p className="font-semibold text-gray-900 mt-1 p-3 bg-gray-50 rounded">{item.customer_notes}</p>
                        </div>
                    )}
                </div>

                {/* Financials & Billing */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="text-green-600" />
                        Financials & Billing
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <label className="text-sm text-blue-700">Order Value – Quotation subtotal</label>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(item.order_value)}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <label className="text-sm text-green-700">Advance Payment</label>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(item.advance_payment.amount)}</p>
                            {item.advance_payment.date && (
                                <p className="text-xs text-green-700 mt-1">Date: {format(new Date(item.advance_payment.date), "MMM dd, yyyy")}</p>
                            )}
                            {item.advance_payment.bank_details && (
                                <p className="text-xs text-green-700">Bank: {item.advance_payment.bank_details}</p>
                            )}
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <label className="text-sm text-red-700">Total Expense</label>
                            <p className="text-2xl font-bold text-red-900">{formatCurrency(item.expense)}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <label className="text-sm text-purple-700">Profit</label>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(item.profit)}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <label className="text-sm text-orange-700">Balance Due</label>
                            <p className="text-2xl font-bold text-orange-900">{formatCurrency(item.balance_due)}</p>
                        </div>
                    </div>

                    {/* Expense Details */}
                    {item.expense_details && item.expense_details.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Expense Details</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="border p-2 text-left">S.No</th>
                                            <th className="border p-2 text-left">Description</th>
                                            <th className="border p-2 text-left">Supplier Details</th>
                                            <th className="border p-2 text-right">Unit Price</th>
                                            <th className="border p-2 text-right">Total Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.expense_details.map((expense, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="border p-2">{expense.s_no}</td>
                                                <td className="border p-2">{expense.description}</td>
                                                <td className="border p-2">{expense.supplier_details}</td>
                                                <td className="border p-2 text-right">{formatCurrency(expense.unit_price)}</td>
                                                <td className="border p-2 text-right font-semibold">{formatCurrency(expense.total_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {item.expense_notes && (
                                <div className="mt-3 p-3 bg-gray-50 rounded">
                                    <label className="text-sm text-gray-600">Expense Notes:</label>
                                    <p className="text-gray-900 mt-1">{item.expense_notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Working Timeline */}
                {item.working_timeline && item.working_timeline.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="text-blue-600" />
                            Working Timeline
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border p-2 text-left">S.No</th>
                                        <th className="border p-2 text-left">Description</th>
                                        <th className="border p-2 text-left">Deadline</th>
                                        <th className="border p-2 text-left">Approved</th>
                                        <th className="border p-2 text-left">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.working_timeline.map((timeline, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border p-2">{timeline.s_no}</td>
                                            <td className="border p-2">{timeline.description}</td>
                                            <td className="border p-2">{format(new Date(timeline.deadline), "MMM dd, yyyy")}</td>
                                            <td className="border p-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    timeline.approved === "Yes" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                                                }`}>
                                                    {timeline.approved}
                                                </span>
                                            </td>
                                            <td className="border p-2">{timeline.notes || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Project Timeline */}
                {item.project_timeline && item.project_timeline.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="text-purple-600" />
                            Project Timeline
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border p-2 text-left">S.No</th>
                                        <th className="border p-2 text-left">Description</th>
                                        <th className="border p-2 text-left">Deadline</th>
                                        <th className="border p-2 text-left">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.project_timeline.map((timeline, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border p-2">{timeline.s_no}</td>
                                            <td className="border p-2">{timeline.description}</td>
                                            <td className="border p-2">{format(new Date(timeline.deadline), "MMM dd, yyyy")}</td>
                                            <td className="border p-2">{timeline.notes || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                    <button
                        onClick={() => router.push(`/crm/pipelines/${pipelineId}/preprocess`)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                    >
                        Back to List
                    </button>
                    <button
                        onClick={() => router.push(`/crm/pipelines/${pipelineId}/preprocess/${id}/edit`)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Edit Details
                    </button>
                </div>
            </div>
        </div>
    );
}

