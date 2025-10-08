"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, Clock, CheckCircle, AlertTriangle, IndianRupee, FileWarning } from 'lucide-react';
import { useRouter } from "next/navigation";

// Define the data types we expect to load
type RFQ = { id: string; company_name: string; deadline: string; };
type PreprocessItem = { id: string; company_name: string; deadline: string; project_handled_by: string };
type PostProcessItem = { id: string; company_name: string; deadline: string; project_handled_by: string };
type CompletedProject = { id: string; company_name: string; deadline: string; completion_date: string };
type PaymentPendingItem = { id: string; company_name: string; balance_due: number; };
type GstPurchaseItem = { id: string; vendor: string; total: number; paymentRequest: string; paymentStatus: string};

// Helper component for dashboard cards (fully implemented)
const DashboardCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode, color: string }) => (
    <div className={`p-6 rounded-lg shadow-lg bg-gradient-to-br from-${color}-500 to-${color}-600 text-white`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-lg font-semibold">{title}</p>
                <p className="text-3xl font-bold">{value}</p>
            </div>
            <div className="text-4xl opacity-50">{icon}</div>
        </div>
    </div>
);

// Helper component for overdue items (fully implemented)
const OverdueItem = ({ item, type }: { item: any, type: string }) => (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <div>
            <p className="font-semibold text-gray-800">{item.company_name}</p>
            <p className="text-sm text-gray-500">{type} - Deadline: {new Date(item.deadline).toLocaleDateString()}</p>
        </div>
        <div className="text-red-500 font-bold">OVERDUE</div>
    </div>
);

export default function DashboardPage() {
    const router = useRouter();
    const [userName, setUserName] = useState("User"); // Placeholder
    const [stats, setStats] = useState({
        ongoing: 0,
        pendingRfqs: 0,
        onTime: 0,
        delayed: 0,
        overdueItems: [] as any[],
        highPriorityPayments: [] as GstPurchaseItem[],
        customerPendingTotal: 0,
        supplierPendingTotal: 0,
    });

    useEffect(() => {
        const rfqs = JSON.parse(localStorage.getItem("rfqData") || "[]");
        const preprocess = JSON.parse(localStorage.getItem("preprocessData") || "[]");
        const postprocess = JSON.parse(localStorage.getItem("postprocessData") || "[]");
        const completed = JSON.parse(localStorage.getItem("completedProjectsData") || "[]");
        const paymentPending = JSON.parse(localStorage.getItem("paymentPendingData") || "[]");
        const gstPurchases = JSON.parse(localStorage.getItem("gstPurchaseData") || "[]");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const onTime = completed.filter((p: CompletedProject) => new Date(p.completion_date) <= new Date(p.deadline)).length;
        const delayed = completed.length - onTime;
        const ongoing = preprocess.length + postprocess.length;

        const overdueItems = [
            ...rfqs.filter((item: RFQ) => new Date(item.deadline) < today).map((item: RFQ) => ({ ...item, type: 'RFQ' })),
            ...preprocess.filter((item: PreprocessItem) => new Date(item.deadline) < today).map((item: PreprocessItem) => ({ ...item, type: 'Preprocess' })),
            ...postprocess.filter((item: PostProcessItem) => new Date(item.deadline) < today).map((item: PostProcessItem) => ({ ...item, type: 'Post Process' }))
        ];

        const highPriorityPayments = gstPurchases.filter((item: GstPurchaseItem) => item.paymentRequest === "High");
        const customerPendingTotal = paymentPending.reduce((sum: number, item: PaymentPendingItem) => sum + item.balance_due, 0);
        const supplierPendingTotal = gstPurchases
            .filter((item: GstPurchaseItem) => item.paymentStatus === 'Unpaid' || item.paymentStatus === 'Partially paid')
            .reduce((sum: number, item: GstPurchaseItem) => sum + item.total, 0);

        setStats({ ongoing, pendingRfqs: rfqs.length, onTime, delayed, overdueItems, highPriorityPayments, customerPendingTotal, supplierPendingTotal });

    }, []);

    const pieChartData = [
        { name: 'Ongoing', value: stats.ongoing },
        { name: 'On-Time', value: stats.onTime },
        { name: 'Delayed', value: stats.delayed },
    ];
    const COLORS = ['#0088FE', '#00ffd0ff', '#FF8042'];

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hi, {userName}</h1>
            <p className="text-gray-500 mb-8">Here's your dashboard for today.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardCard title="Ongoing Works" value={stats.ongoing} icon={<Briefcase />} color="blue" />
                <DashboardCard title="Pending RFQs" value={stats.pendingRfqs} icon={<Clock />} color="yellow" />
                <DashboardCard title="Overdue Tasks" value={stats.overdueItems.length} icon={<AlertTriangle />} color="red" />
                <DashboardCard title="Completed On-Time" value={stats.onTime} icon={<CheckCircle />} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Works Overview</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${entry.name}: ${entry.value}`}>
                                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    <h2 className="text-xl font-bold text-gray-700">Payments Overview</h2>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-full text-red-600"><IndianRupee /></div>
                        <div>
                            <p className="text-gray-500">Customer Pending Payments</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.customerPendingTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600"><IndianRupee /></div>
                        <div>
                            <p className="text-gray-500">Supplier Pending Payments</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.supplierPendingTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"><AlertTriangle className="text-red-500"/> Overdue Items</h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {stats.overdueItems.length > 0 ? (
                            stats.overdueItems.map(item => <OverdueItem key={item.id} item={item} type={item.type} />)
                        ) : <p className="text-gray-500">No overdue items. Great job!</p>}
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"><FileWarning className="text-orange-500"/> High Priority Payments</h2>
                     <div className="space-y-3 max-h-60 overflow-y-auto">
                        {stats.highPriorityPayments.length > 0 ? (
                            stats.highPriorityPayments.map(item => (
                                <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-semibold text-gray-800">{item.vendor}</p>
                                    <p className="text-sm text-gray-500">Amount: {item.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                                </div>
                            ))
                        ) : <p className="text-gray-500">No high priority payments.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}