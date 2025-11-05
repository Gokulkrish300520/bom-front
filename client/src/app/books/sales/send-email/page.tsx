"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/auth/tokenservice";

type Customer = {
  id: number;
  display_name: string;
  email: string;
  billing_city: string;
  billing_state: string;
};

export default function SendEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [subject, setSubject] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");

  useEffect(() => {
    const storedPDF = sessionStorage.getItem("quotePDF");
    const storedSubject = sessionStorage.getItem("quoteSubject");
    if (storedPDF) setPdfBase64(storedPDF);
    if (storedSubject) setSubject(storedSubject);
  }, []);

  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const storedCustomerName = sessionStorage.getItem("quoteCustomerName");
    if (!storedCustomerName) return;

    async function fetchCustomers() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/customers/");
        const data = await res.json();
        const allCustomers: Customer[] = data.results || [];
        const matched = allCustomers.filter(c => c.display_name === storedCustomerName);
        setFilteredCustomers(matched);

        if (matched.length === 1) setSelectedCustomer(matched[0]);
      } catch {
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  const handleSendMail = async () => {
    if (!selectedCustomer || !selectedCustomer.email || !pdfBase64) {
      toast.error("Please select a recipient and ensure PDF is loaded");
      return;
    }

    toast.loading("Sending email...");
    const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/send-mail/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_email: selectedCustomer.email,
        subject,
        pdf_base64: pdfBase64,
        filename: "quotation.pdf",
      }),
    });

    toast.dismiss();
    if (res.ok) {
      toast.success("Email sent successfully!");
      sessionStorage.removeItem("quotePDF");
      sessionStorage.removeItem("quoteSubject");
      sessionStorage.removeItem("quoteCustomerName");

      router.push('/books/sales/quotes');
    } else {
      const err = await res.json();
      toast.error("Failed to send email: " + JSON.stringify(err));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg border border-green-200">
        <h1 className="text-2xl font-semibold text-green-800 mb-4">Send Quotation Email</h1>

        {loading ? (
          <p>Loading customers...</p>
        ) : (
          <div className="space-y-3">
            <label className="block font-medium">Select Customer</label>
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const cust = filteredCustomers.find(c => c.id === Number(e.target.value)) || null;
                setSelectedCustomer(cust);
              }}
              className="w-full border border-green-300 rounded px-3 py-2"
            >
              {filteredCustomers.length > 1 && <option value="">Choose recipient</option>}
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name} – {c.billing_city}, {c.billing_state}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <>
                <label className="block font-medium mt-3">Customer Email</label>
                <input
                  type="email"
                  value={selectedCustomer.email}
                  onChange={(e) =>
                    setSelectedCustomer({ ...selectedCustomer, email: e.target.value })
                  }
                  className="w-full border border-green-300 rounded px-3 py-2"
                />
              </>
            )}

            <label className="block font-medium mt-3">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-green-300 rounded px-3 py-2"
            />

            <button
              disabled={!selectedCustomer?.email || !pdfBase64}
              onClick={handleSendMail}
              className="mt-5 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Send Email
            </button>

            <button
              onClick={() => router.back()}
              className="w-full mt-3 border border-green-400 text-green-700 py-2 rounded hover:bg-green-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
