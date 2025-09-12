"use client";
import PipelineColumn from "../components/PipelineColumn";
import PipelineSubNav from "../components/PipelineSubNav"; 
import { useRouter } from "next/navigation";

export default function CRMPage() {
  const router = useRouter();

  const stages = [
    {
      title: "Qualification",
      total: "₹5,671.00",
      count: 1,
      deals: [
        {
          title: "Zylker Yearly Subs...",
          owner: "Ted Watson",
          amount: "₹5,671.00",
          date: "Aug 19",
        },
      ],
    },
    { title: "Needs Analysis", total: "₹0.00", count: 0, deals: [] },
    { title: "Proposal/Price Quote", total: "₹0.00", count: 0, deals: [] },
    {
      title: "Negotiation/Review",
      total: "₹0.00",
      count: 2,
      deals: [
        {
          title: "Zylker Yearly Subs...",
          owner: "Ted Watson",
          amount: "₹5,671.00",
          date: "Aug 19",
        },
        {
          title: "Zylker Yearly Subs...",
          owner: "Ted Watson",
          amount: "₹5,671.00",
          date: "Aug 19",
        },
      ],
    },
    { title: "Closed Won", total: "₹0.00", count: 0, deals: [] },
    { title: "Closed Lost", total: "₹0.00", count: 0, deals: [] },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top bar with subnav + add deal button */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <PipelineSubNav />
        <button
          onClick={() => router.push("/crm/create-deal")} // 👈 navigate to create deal page
          className="flex items-center gap-2 px-4 py-2 font-medium text-white transition bg-green-600 rounded-md hover:bg-green-700"
        >
          <span className="text-lg">＋</span> Deal
        </button>
      </div>

      {/* Pipeline Columns */}
      <div className="flex-1 p-2 overflow-x-auto">
        <div className="flex flex-row h-full gap-4">
          {stages.map((stage, idx) => (
            <PipelineColumn
              key={idx}
              title={stage.title}
              total={stage.total}
              count={stage.count}
              deals={stage.deals}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
