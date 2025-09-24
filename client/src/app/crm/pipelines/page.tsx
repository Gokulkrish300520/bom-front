"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "@headlessui/react";

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<any[]>([]);

  // Load stages and deals from localStorage
  useEffect(() => {
    const savedStages = JSON.parse(localStorage.getItem("pipelineStages") || "[]");
    const savedDeals = JSON.parse(localStorage.getItem("deals") || "[]");

    let initialStages =
      savedStages.length > 0
        ? savedStages
        : [
            { title: "Qualification", total: "₹0.00", deals: [] },
            { title: "Needs Analysis", total: "₹0.00", deals: [] },
            { title: "Proposal/Price Quote", total: "₹0.00", deals: [] },
            { title: "Negotiation/Review", total: "₹0.00", deals: [] },
            { title: "Closed Won", total: "₹0.00", deals: [] },
            { title: "Closed Lost", total: "₹0.00", deals: [] },
          ];

    // Attach saved deals into their stage
    savedDeals.forEach((deal: any) => {
      const stage = initialStages.find((s: any) => s.title === deal.stage);
      if (stage) {
        stage.deals.push({
          title: deal.dealName,
          contact: deal.contactName,
          amount: `₹${deal.amount}`,
          date: deal.closingDate || new Date().toLocaleDateString(),
        });
      }
    });

    // Recalculate totals
    initialStages = initialStages.map((s: any) => ({
      ...s,
      total: `₹${s.deals
        .reduce(
          (sum: number, d: any) => sum + parseFloat(d.amount.replace(/[₹,]/g, "") || "0"),
          0
        )
        .toLocaleString()}`,
    }));

    setStages(initialStages);
  }, []);

  // Save stages to localStorage
  useEffect(() => {
    if (stages.length > 0) localStorage.setItem("pipelineStages", JSON.stringify(stages));
  }, [stages]);

  const addStage = () => {
    const name = prompt("Enter stage name:");
    if (name) setStages([...stages, { title: name, total: "₹0.00", deals: [] }]);
  };

  const deleteStage = (index: number) => {
    if (confirm(`Delete stage "${stages[index].title}"?`)) {
      const newStages = [...stages];
      newStages.splice(index, 1);
      setStages(newStages);
    }
  };

  const moveStageRight = (index: number) => {
    if (index < stages.length - 1) {
      const newStages = [...stages];
      const [removed] = newStages.splice(index, 1);
      newStages.splice(index + 1, 0, removed);
      setStages(newStages);
    }
  };

  // Navigate to deal creation page with optional stage
  const navigateToCreateDeal = (stageTitle?: string) => {
    const query = stageTitle ? `?stage=${encodeURIComponent(stageTitle)}` : "";
    router.push(`/crm/pipelines/create-deals${query}`);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f9fafb]">
      {/* Top Navbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <h1 className="text-lg font-semibold">Sales Pipeline</h1>
        <div className="flex gap-2">
          <button
            onClick={addStage}
            className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
          >
            + New Stage
          </button>
          {/* ✅ New Create Deal button at top */}
          <button
            onClick={() => navigateToCreateDeal()}
            className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
          >
            + Create Deal
          </button>
          <button
            onClick={() => router.push("/crm/pipelines/all-deals")}
            className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
          >
            View All Deals
          </button>
        </div>
      </div>

      {/* ⚠️ Changed this section ⚠️ */}
      {/* Pipeline Board */}
      <div className="flex flex-1 flex-col p-4 overflow-y-auto">
        {stages.map((stage, idx) => (
          <div
            key={idx}
            className="flex w-full mb-4 bg-gray-100 rounded-lg shadow-sm"
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between p-3 bg-gray-200 border-r rounded-l-lg w-64 flex-shrink-0">
              <div>
                <h3 className="text-sm font-semibold">{stage.title}</h3>
                <p className="text-xs text-gray-600">{stage.total}</p>
              </div>

              {/* Stage Dropdown (Removed +New Deal) */}
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button>
                  <span className="cursor-pointer">⋮</span>
                </Menu.Button>

                <Menu.Items className="absolute right-0 z-50 w-40 mt-2 bg-white border rounded-md shadow-lg">
                  <div className="py-1 text-sm text-gray-700">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => moveStageRight(idx)}
                          className={`block w-full text-left px-4 py-2 ${
                            active && "bg-gray-100"
                          }`}
                        >
                          Move Down
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => deleteStage(idx)}
                          className={`block w-full text-left px-4 py-2 text-red-600 ${
                            active && "bg-gray-100"
                          }`}
                        >
                          Delete Stage
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            </div>

            {/* Deals */}
            <div className="flex flex-1 p-3 space-x-2 overflow-x-auto">
              {stage.deals.length > 0 ? (
                stage.deals.map((deal: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 transition bg-white rounded shadow hover:shadow-md flex-shrink-0 w-64"
                  >
                    <h4 className="text-sm font-medium">{deal.title}</h4>
                    <p className="text-xs text-gray-600">{deal.contact}</p>
                    <p className="text-xs text-gray-800">{deal.amount}</p>
                    <p className="text-xs text-gray-500">{deal.date}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">This stage is empty</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}