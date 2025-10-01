"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Use the same type definition as the main page
type NonGstPurchaseEntry = {
    id: string;
    vendor: string;
    dealNumber: string;
    item: string;
    description: string;
    itemSpecification: string;
    brand: string;
    quantity: number;
    unitPriceINR: number;
    total: number;
    invoiceDate: string;
    billUpload: string; // Expects Base64 data
    paymentRequest: "High" | "Low";
    paymentStatus: "Paid" | "Unpaid" | "Partially paid";
    paymentReferenceNo: string;
    paidBy: "SBI" | "ICICI" | "IOB" | "Petty Cash" | "N/A";
};

// PDF Viewer Component
const ViewPDF = ({ pdfData }: { pdfData: string }) => {
    if (!pdfData || !pdfData.startsWith("data:application/pdf")) {
        return <p className="text-gray-500">Bill document not available or format is incorrect.</p>;
    }
    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill Document Preview</h3>
            <object data={pdfData} type="application/pdf" width="100%" height="600px" className="border rounded-lg">
                <p>Unable to display PDF. You can <a href={pdfData} download="bill.pdf" className="text-blue-600 hover:underline">download it instead</a>.</p>
            </object>
        </div>
    );
};

export default function ViewPurchasePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const entryId = searchParams.get("id");

    const [entry, setEntry] = useState<NonGstPurchaseEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (entryId) {
            // Use the same key as the main page
            const storedData = localStorage.getItem("nonGstPurchaseData");
            if (storedData) {
                const data: NonGstPurchaseEntry[] = JSON.parse(storedData);
                const entryToView = data.find((e) => e.id === entryId);
                setEntry(entryToView || null);
            }
        }
        setLoading(false);
    }, [entryId]);

    const statusColors: Record<string, string> = {
        Paid: "bg-green-100 text-green-800",
        Unpaid: "bg-red-100 text-red-800",
        "Partially paid": "bg-yellow-100 text-yellow-800",
    };

    const requestColors: Record<string, string> = {
        High: "bg-red-100 text-red-800",
        Low: "bg-blue-100 text-blue-800",
    };

    if (loading) return <div className="p-6 text-center">Loading...</div>;

    if (!entry) return (
        <div className="min-h-screen p-6 bg-white flex flex-col items-center justify-center">
            <p className="text-center text-red-500 text-xl">Purchase entry not found.</p>
            <button onClick={() => router.push("/books/purchase/non-gst")} className="mt-6 px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">
                Back to List
            </button>
        </div>
    );

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-xl">
                <h1 className="mb-6 text-3xl font-bold text-green-800 border-b pb-4">Non-GST Purchase Record</h1>
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold text-green-700">Item Information</h2>
                        <div><span className="font-semibold text-gray-600">Vendor:</span> {entry.vendor}</div>
                        <div><span className="font-semibold text-gray-600">Deal Number:</span> {entry.dealNumber}</div>
                        <div><span className="font-semibold text-gray-600">Item:</span> {entry.item}</div>
                        <div><span className="font-semibold text-gray-600">Description:</span> {entry.description}</div>
                        <div><span className="font-semibold text-gray-600">Specification:</span> {entry.itemSpecification}</div>
                        <div><span className="font-semibold text-gray-600">Brand:</span> {entry.brand}</div>
                        <div><span className="font-semibold text-gray-600">Invoice Date:</span> {entry.invoiceDate}</div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold text-green-700">Financials & Payment</h2>
                        <div><span className="font-semibold text-gray-600">Quantity:</span> {entry.quantity.toLocaleString("en-IN")} PCS</div>
                        <div><span className="font-semibold text-gray-600">Unit Price (INR):</span> ₹{entry.unitPriceINR.toLocaleString("en-IN")}</div>
                        <div className="p-3 text-lg font-bold bg-green-50 rounded-md"><span className="font-semibold">Total (INR):</span> ₹{entry.total.toLocaleString("en-IN")}</div>
                        <div>
                            <span className="font-semibold text-gray-600">Payment Status:</span>
                            <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${statusColors[entry.paymentStatus]}`}>{entry.paymentStatus}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600">Payment Request:</span>
                            <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${requestColors[entry.paymentRequest]}`}>{entry.paymentRequest}</span>
                        </div>
                        <div><span className="font-semibold text-gray-600">Payment Ref No:</span> {entry.paymentReferenceNo || "-"}</div>
                        <div><span className="font-semibold text-gray-600">Paid By:</span> {entry.paidBy}</div>
                    </div>
                </div>
                {entry.billUpload && (
                    <div className="mt-8 border-t pt-6">
                        <ViewPDF pdfData={entry.billUpload} />
                    </div>
                )}
                <div className="flex justify-end pt-6 mt-8 border-t">
                    <button onClick={() => router.push("/books/purchase/non-gst")} className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}