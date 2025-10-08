"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { PostProcessItem, WorkingTimelineItem, ProjectTimelineItem, teamMembers, departments, expenseOptions } from "../page";
import { Trash2 } from "lucide-react";

type FormData = Omit<PostProcessItem, 'id' | 'date'>;

export default function NewPostProcessPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        department: "",
        company_name: "",
        contact: "",
        state: "",
        deadline: "",
        description: "",
        fileName: "",
        source: "",
        customer_notes: "",
        order_value: 0,
        advance_payment: 0,
        expense: 0,
        profit: 0,
        balance_due: 0,
        subdeal: "",
        project_handled_by: "",
        working_timeline: [],
        project_timeline: [],
        expense_bill_format: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
    };

    const handleTimelineChange = (index: number, field: keyof WorkingTimelineItem | keyof ProjectTimelineItem, value: any, timelineType: 'working_timeline' | 'project_timeline') => {
        const updatedTimeline = [...formData[timelineType]];
        (updatedTimeline[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, [timelineType]: updatedTimeline as any }));
    };

    const addTimelineRow = (timelineType: 'working_timeline' | 'project_timeline') => {
        if (timelineType === 'working_timeline') {
            const newRow: WorkingTimelineItem = { s_no: formData.working_timeline.length + 1, description: '', deadline: '', status: 'Over Due', approved: 'Rework' };
            setFormData(prev => ({ ...prev, working_timeline: [...prev.working_timeline, newRow] }));
        } else {
            const newRow: ProjectTimelineItem = { s_no: formData.project_timeline.length + 1, description: '', deadline: '', status: 'Over Due', final_fileName: '' };
            setFormData(prev => ({ ...prev, project_timeline: [...prev.project_timeline, newRow] }));
        }
    };

    const removeTimelineRow = (index: number, timelineType: 'working_timeline' | 'project_timeline') => {
        setFormData(prev => ({ ...prev, [timelineType]: prev[timelineType].filter((_, i) => i !== index) }));
    };

    const handleTimelineFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        handleTimelineChange(index, 'final_fileName', file?.name || '', 'project_timeline');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const profit = formData.order_value - formData.expense;
        const balance_due = formData.order_value - formData.advance_payment;

        const newItem: PostProcessItem = {
            ...formData,
            id: uuidv4(),
            date: new Date().toISOString(),
            profit,
            balance_due,
        };

        const storedData = localStorage.getItem("postprocessData") || "[]";
        const data: PostProcessItem[] = JSON.parse(storedData);
        data.push(newItem);
        localStorage.setItem("postprocessData", JSON.stringify(data));

        router.push("/crm/pipelines/postprocess");
    };

    return (
        <div className="min-h-screen p-8 bg-white">
            <h1 className="mb-6 text-2xl font-bold text-green-700">Add New Post Process</h1>
            <form onSubmit={handleSubmit} className="space-y-8 p-6 rounded shadow bg-green-50">
                
                {/* --- Project Info Section --- */}
                <div>
                    <h2 className="text-lg font-semibold text-green-800 border-b pb-2 mb-4">Project Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div>
                            <label className="block font-medium text-green-800">Company Name <span className="text-red-500">*</span></label>
                            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block font-medium text-green-800">Department <span className="text-red-500">*</span></label>
                            <input list="departments" name="department" value={formData.department} onChange={handleChange} required className="w-full p-2 border rounded" />
                            <datalist id="departments">{departments.map(d => <option key={d} value={d} />)}</datalist>
                        </div>
                        <div>
                            <label className="block font-medium text-green-800">Project Handled By <span className="text-red-500">*</span></label>
                            <input list="teamMembers" name="project_handled_by" value={formData.project_handled_by} onChange={handleChange} required className="w-full p-2 border rounded" />
                            <datalist id="teamMembers">{teamMembers.map(m => <option key={m} value={m} />)}</datalist>
                        </div>
                         <div>
                            <label className="block font-medium text-green-800">Deadline <span className="text-red-500">*</span></label>
                            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required className="w-full p-2 border rounded" />
                        </div>
                    </div>
                </div>

                {/* --- Working Timeline Section --- */}
                <div>
                    <h2 className="text-lg font-semibold text-green-800 border-b pb-2 mb-4">Working Timeline</h2>
                    {formData.working_timeline.map((row, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2 p-2 border rounded bg-white overflow-x-auto">
                            <input type="number" placeholder="S.No" value={row.s_no} onChange={(e) => handleTimelineChange(index, "s_no", parseInt(e.target.value) || 0, "working_timeline")} className="p-2 border rounded w-20"/>
                            <input type="text" placeholder="Description" value={row.description} onChange={(e) => handleTimelineChange(index, "description", e.target.value, "working_timeline")} className="p-2 border rounded flex-1 min-w-[200px]"/>
                            <input type="date" value={row.deadline} onChange={(e) => handleTimelineChange(index, "deadline", e.target.value, "working_timeline")} className="p-2 border rounded w-40"/>
                            <select value={row.status} onChange={(e) => handleTimelineChange(index, "status", e.target.value, "working_timeline")} className="p-2 border rounded w-32">
                                <option>Over Due</option><option>Completed</option>
                            </select>
                            <select value={row.approved} onChange={(e) => handleTimelineChange(index, "approved", e.target.value, "working_timeline")} className="p-2 border rounded w-28">
                                <option>Rework</option><option>Yes</option>
                            </select>
                            <button type="button" onClick={() => removeTimelineRow(index, "working_timeline")} className="p-2 text-white bg-red-500 rounded hover:bg-red-600 flex items-center justify-center"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addTimelineRow('working_timeline')} className="mt-2 px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">Add Working Row</button>
                </div>

                {/* --- Project Timeline Section --- */}
                <div>
                    <h2 className="text-lg font-semibold text-green-800 border-b pb-2 mb-4">Project Timeline</h2>
                    {formData.project_timeline.map((row, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2 p-2 border rounded bg-white overflow-x-auto">
                           <input type="number" placeholder="S.No" value={row.s_no} onChange={(e) => handleTimelineChange(index, 's_no', parseInt(e.target.value) || 0, 'project_timeline')} className="p-2 border rounded w-20" />
                           <input type="text" placeholder="Description" value={row.description} onChange={(e) => handleTimelineChange(index, 'description', e.target.value, 'project_timeline')} className="p-2 border rounded flex-1 min-w-[200px]" />
                           <input type="date" value={row.deadline} onChange={(e) => handleTimelineChange(index, 'deadline', e.target.value, 'project_timeline')} className="p-2 border rounded w-40" />
                           <select value={row.status} onChange={(e) => handleTimelineChange(index, 'status', e.target.value, 'project_timeline')} className="p-2 border rounded w-32">
                               <option>Over Due</option><option>Completed</option>
                           </select>
                           <input type="file" onChange={(e) => handleTimelineFileChange(e, index)} className="p-1.5 border rounded text-xs flex-1" />
                           <button type="button" onClick={() => removeTimelineRow(index, 'project_timeline')} className="p-2 text-white bg-red-500 rounded hover:bg-red-600 flex items-center justify-center"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addTimelineRow('project_timeline')} className="mt-2 px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">Add Project Row</button>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button type="button" onClick={() => router.push('/crm/pipelines/postprocess')} className="px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">Save</button>
                </div>
            </form>
        </div>
    );
}