"use client";

import { useEffect, useState } from "react";
import { Vendor } from "./types";
import { storage } from "./storage";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
};

type FileBlob = {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 for localStorage
};

const tabList = ["Other Details", "Address", "Bank Details", "Custom Fields", "Reporting Tags", "Remarks"] as const;
type TabKey = typeof tabList[number];

const input = "border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500";

export default function VendorModal({ open, onClose, onCreated }: Props) {
  const [tab, setTab] = useState<TabKey>("Other Details");

  // Primary/Other Details
  const [salutation, setSalutation] = useState("Salutation");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [workPhone, setWorkPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [pan, setPan] = useState("");
  const [isMsme, setIsMsme] = useState(false);
  const [currency, setCurrency] = useState("INR - Indian Rupee");
  const [openingBalance, setOpeningBalance] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [tds, setTds] = useState("");
  const [enablePortal, setEnablePortal] = useState(false);
  const [portalLanguage, setPortalLanguage] = useState("English");

  // Address
  const [address, setAddress] = useState("");

  // Bank details
  const [bankName, setBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  // Custom/Reporting/Remarks
  const [customFields, setCustomFields] = useState("");
  const [reportingTags, setReportingTags] = useState("");
  const [remarks, setRemarks] = useState("");

  // Files
  const [files, setFiles] = useState<FileBlob[]>([]);

  useEffect(() => {
    if (!open) {
      // reset when closing
      setTab("Other Details");
      setSalutation("Salutation"); setFirstName(""); setLastName(""); setCompany("");
      setDisplayName(""); setEmail(""); setWorkPhone(""); setMobile("");
      setPan(""); setIsMsme(false); setCurrency("INR - Indian Rupee");
      setOpeningBalance(""); setPaymentTerms("Due on Receipt"); setTds("");
      setEnablePortal(false); setPortalLanguage("English");
      setAddress(""); setBankName(""); setAccNumber(""); setIfsc("");
      setCustomFields(""); setReportingTags(""); setRemarks("");
      setFiles([]);
    }
  }, [open]);

  if (!open) return null;

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files;
    if (!f) return;
    const toRead = Array.from(f).slice(0, Math.max(0, 10 - files.length));
    const read = await Promise.all(
      toRead.map(
        (file) =>
          new Promise<FileBlob>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () =>
              res({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, dataUrl: String(reader.result) });
            reader.onerror = rej;
            reader.readAsDataURL(file);
          })
      )
    );
    setFiles((prev) => [...prev, ...read]);
    e.currentTarget.value = "";
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const save = () => {
    if (!displayName.trim()) {
      alert("Display Name is required");
      setTab("Other Details");
      return;
    }

    // The Vendor type in types.ts is minimal. We store rich data under `meta`.
    const v = {
      id: crypto.randomUUID(),
      name: displayName.trim(),
      email: email.trim() || undefined,
      phone: (mobile || workPhone || "").trim() || undefined,
      address: address.trim() || undefined,
      // everything else as meta (kept fully in localStorage)
      meta: {
        salutation, firstName, lastName, company,
        workPhone, mobile, pan, isMsme, currency,
        openingBalance, paymentTerms, tds, enablePortal,
        portalLanguage, bankName, accNumber, ifsc,
        customFields, reportingTags, remarks,
        files, // store attachments
      },
    } as unknown as Vendor;

    storage.upsertVendor(v as Vendor);      // persists
    onCreated(v as Vendor);                 // bubble up
    onClose();
  };

  return (
    <div className="fixed z-50 flex items-start justify-center inset-1">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* card */}
      <div className="relative bg-white w-[98%] max-w-5xl mt-6 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold md:text-2xl text-emerald-700">New Vendor</h3>
          <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded-xl hover:bg-gray-200">✕</button>
        </div>

        {/* Other Details header section */}
        <div className="mt-4 grid md:grid-cols-[180px_1fr_1fr] gap-3">
          <select className={input} value={salutation} onChange={(e) => setSalutation(e.target.value)}>
            <option>Salutation</option>
            <option>Mr.</option>
            <option>Ms.</option>
            <option>Mrs.</option>
            <option>Dr.</option>
          </select>
          <input className={input} placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input className={input} placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        <div className="grid gap-3 mt-3 md:grid-cols-2">
          <input className={input} placeholder="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} />
          <input className={input} placeholder="Display Name *" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div className="grid gap-3 mt-3 md:grid-cols-2">
          <input className={input} placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="Work Phone" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} />
            <input className={input} placeholder="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 border-b">
          <div className="flex gap-4 overflow-x-auto">
            {tabList.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 -mb-px border-b-2 ${tab === t ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-emerald-700"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {tab === "Other Details" && (
            <div className="grid gap-4 md:grid-cols-2">
              <input className={input} placeholder="PAN" value={pan} onChange={(e) => setPan(e.target.value)} />
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={isMsme} onChange={(e) => setIsMsme(e.target.checked)} />
                This vendor is MSME registered
              </label>
              <select className={input} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>INR - Indian Rupee</option>
                <option>USD - US Dollar</option>
                <option>EUR - Euro</option>
              </select>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <input readOnly className={`${input} bg-gray-50`} value="INR" />
                <input className={input} placeholder="Opening Balance" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
              </div>
              <select className={input} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                <option>Due on Receipt</option>
                <option>Net 7</option>
                <option>Net 15</option>
                <option>Net 30</option>
              </select>
              <select className={input} value={tds} onChange={(e) => setTds(e.target.value)}>
                <option value="">Select a Tax (TDS)</option>
                <option>1%</option>
                <option>5%</option>
                <option>10%</option>
              </select>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={enablePortal} onChange={(e) => setEnablePortal(e.target.checked)} />
                Allow portal access for this vendor
              </label>
              <select className={input} value={portalLanguage} onChange={(e) => setPortalLanguage(e.target.value)}>
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
              </select>
              {/* Files */}
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm text-gray-700">Documents (max 10 files, 10MB each)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-3 py-2 border cursor-pointer rounded-xl border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                    Upload File
                    <input type="file" className="hidden" multiple onChange={onPickFiles} />
                  </label>
                  {files.map((f) => (
                    <span key={f.id} className="flex items-center gap-2 px-2 py-1 text-sm bg-gray-100 rounded-xl">
                      {f.name}
                      <button onClick={() => removeFile(f.id)} className="text-gray-500 hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Address" && (
            <textarea className={`${input} w-full`} rows={5} placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)} />
          )}

          {tab === "Bank Details" && (
            <div className="grid gap-3 md:grid-cols-3">
              <input className={input} placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <input className={input} placeholder="Account Number" value={accNumber} onChange={(e) => setAccNumber(e.target.value)} />
              <input className={input} placeholder="IFSC" value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
            </div>
          )}

          {tab === "Custom Fields" && (
            <textarea className={`${input} w-full`} rows={4} placeholder="Custom fields (JSON or text)" value={customFields} onChange={(e) => setCustomFields(e.target.value)} />
          )}

          {tab === "Reporting Tags" && (
            <textarea className={`${input} w-full`} rows={4} placeholder="Reporting tags" value={reportingTags} onChange={(e) => setReportingTags(e.target.value)} />
          )}

          {tab === "Remarks" && (
            <textarea className={`${input} w-full`} rows={4} placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
          <button onClick={save} className="px-4 py-2 text-white rounded-xl bg-emerald-600 hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>
  );
}