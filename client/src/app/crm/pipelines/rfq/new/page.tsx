"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation"; // Removed to fix compile error
import { v4 as uuidv4 } from "uuid";
import { RFQ } from "../page";

export default function NewRFQPage() {
  // const router = useRouter(); // Removed to fix compile error
  const [formData, setFormData] = useState<Omit<RFQ, "id" | "date">>({
    department: "",
    company_name: "",
    contact: "",
    state: "",
    deadline: "",
    description: "",
    billUpload: "", 
    source: "",
    priority: "Low",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
          setFormData(prev => ({ ...prev, billUpload: "" }));
          return;
      };

      if (file.type !== "application/pdf" || file.size > 5 * 1024 * 1024) {
          alert("Please upload a PDF file that is less than 5MB.");
          e.target.value = '';
          return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
          setFormData(prev => ({ ...prev, billUpload: reader.result as string }));
      };
      reader.onerror = (error) => {
          console.error("Error converting file:", error);
          alert("Could not process the file.");
      };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRFQ: RFQ = {
      ...formData,
      id: uuidv4(),
      date: new Date().toISOString(),
    };

    const storedData = localStorage.getItem("rfqData") || "[]";
    const data: RFQ[] = JSON.parse(storedData);
    data.push(newRFQ);
    localStorage.setItem("rfqData", JSON.stringify(data));

    // Use window.location for navigation
    window.location.href = "/crm/pipelines/rfq";
  };
  
  const handleCancel = () => {
    window.location.href = "/crm/pipelines/rfq";
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <h1 className="mb-6 text-2xl font-bold text-green-700">Add New RFQ</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 p-6 rounded shadow md:grid-cols-2 bg-green-50">
        
        <div>
          <label className="block font-medium text-green-800">Department <span className="text-red-500">*</span></label>
          <select name="department" value={formData.department} onChange={handleChange} required className="w-full p-2 border rounded">
              <option value="">Select Department</option>
              <option value="Fab">Fab</option>
              <option value="EMS">EMS</option>
              <option value="Component">Component</option>
          </select>
        </div>

        <div>
            <label className="block font-medium text-green-800">Source <span className="text-red-500">*</span></label>
            <select name="source" value={formData.source} onChange={handleChange} required className="w-full p-2 border rounded">
                <option value="">Select Source</option>
                <option value="Expo">Expo</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="JD">JD</option>
            </select>
        </div>

        <div>
            <label className="block font-medium text-green-800">Company Name <span className="text-red-500">*</span></label>
            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>

        <div>
            <label className="block font-medium text-green-800">Contact <span className="text-red-500">*</span></label>
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>

         <div>
            <label className="block font-medium text-green-800">State <span className="text-red-500">*</span></label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>

        <div>
            <label className="block font-medium text-green-800">Deadline <span className="text-red-500">*</span></label>
            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required className="w-full p-2 border rounded" />
        </div>

        <div className="md:col-span-2">
            <label className="block font-medium text-green-800">Description <span className="text-red-500">*</span></label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows={4} className="w-full p-2 border rounded"></textarea>
        </div>

        <div>
            <label className="block font-medium text-green-800">File Upload (PDF)</label>
            <input type="file" name="file" accept=".pdf" onChange={handleFileChange} className="w-full p-2 border rounded bg-white" />
        </div>

        <div>
          <label className="block font-medium text-green-800">Priority <span className="text-red-500">*</span></label>
          <select name="priority" value={formData.priority} onChange={handleChange} required className="w-full p-2 border rounded">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
          </select>
        </div>

        <div className="flex justify-end col-span-2 gap-4 mt-4">
          <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
          <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Save</button>
        </div>
      </form>
    </div>
  );
}

