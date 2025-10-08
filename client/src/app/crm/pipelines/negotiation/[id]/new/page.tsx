"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Negotiation, NegotiationEvent } from "../../../page";

export default function NewNegotiationEventPage() {
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [formData, setFormData] = useState({
    remarks: "",
    next_followup_date: "",
  });

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    setNegotiationId(id);

    if (id) {
      const data = JSON.parse(localStorage.getItem("negotiationData") || "[]");
      const negotiationItem = data.find((item: Negotiation) => item.id === id);
      if (negotiationItem) {
        setCompanyName(negotiationItem.company_name);
      }
    }
  }, []);

  const navigate = (path: string) => {
    window.location.href = path;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiationId) {
      alert("Error: Could not find the negotiation to update.");
      return;
    }

    const newEvent: NegotiationEvent = {
      id: uuidv4(),
      date: new Date().toISOString(),
      remarks: formData.remarks,
      next_followup_date: formData.next_followup_date,
    };

    const storedData = localStorage.getItem("negotiationData") || "[]";
    let data: Negotiation[] = JSON.parse(storedData);

    const updatedData = data.map(item => {
      if (item.id === negotiationId) {
        // Add the new event to this negotiation's history
        return { ...item, events: [...item.events, newEvent] };
      }
      return item;
    });

    localStorage.setItem("negotiationData", JSON.stringify(updatedData));
    alert("Follow-up added successfully!");
    navigate("/crm/pipelines/negotiation");
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="mb-2 text-2xl font-bold text-green-700">Add Negotiation Follow-up</h1>
      <p className="mb-6 text-gray-600">For: <span className="font-semibold">{companyName}</span></p>
      
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6 p-8 rounded-lg shadow bg-green-50">
        <div>
          <label className="block font-medium text-green-800">Next Follow-up Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            name="next_followup_date"
            value={formData.next_followup_date}
            onChange={handleChange}
            required
            className="w-full p-2 mt-1 border rounded"
          />
        </div>
        <div>
          <label className="block font-medium text-green-800">Remarks <span className="text-red-500">*</span></label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            required
            rows={5}
            className="w-full p-2 mt-1 border rounded"
            placeholder="Enter details of the negotiation call, meeting, etc."
          />
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => navigate('/crm/pipelines/negotiation')} className="px-6 py-2 border rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
          <button type="submit" className="px-6 py-2 text-white bg-green-600 rounded hover:bg-green-700">Save Follow-up</button>
        </div>
      </form>
    </div>
  );
}
