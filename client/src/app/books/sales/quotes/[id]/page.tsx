"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import toast from "react-hot-toast";

type ContactPerson = {
  salutation?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
};

type Item = {
  id: number;
  name: string;
  hsn_code?: string;
  sales_description?: string;
};

type BankDetails = {
  name : string;
}
type Customer = {
  id: number;
  customer_type: string;
  salutation?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  display_name?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
  pan?: string;
  currency?: string;
  opening_balance?: string;
  payment_terms?: string;
  documents?: unknown[];
  billing_attention?: string;
  billing_country?: string;
  billing_street1?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_pin_code?: string;
  billing_phone?: string;
  billing_fax?: string;
  shipping_attention?: string;
  shipping_country?: string;
  shipping_street1?: string;
  shipping_street2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pin_code?: string;
  shipping_phone?: string;
  shipping_fax?: string;
  contact_persons?: ContactPerson[];
  custom_fields?: { [key: string]: string };
  tags?: string[];
  remarks?: string;
  created_at?: string;
};

type Quote = {
  id: number;
  customer: Customer;
  quote_number: string;
  reference_number: string;
  deal_no:string;
  quote_date: string;
  due_date: string;
  salesperson: string;
  project_name: string;
  subject: string;
  item_details: unknown[];
  customer_notes?: string;
  terms_and_conditions?: string;
  subtotal_amount: string;
  discount_amount: string;
  tax_percentage: string;
  discount_percentage: string;
  gst_amount: string;
  adjustment_amount: string;
  total_amount: string;
  status: string;
  created_at: string;
  bank_details: BankDetails;
};

type QuotesApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Quote[];
};

export default function QuoteDetailPage() {
  const { id } = useParams(); // id here could be the quote id, adjust if needed
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [itemsMap, setItemsMap] = useState<Record<number, Item>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/quotes/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch quote data");
        const data: Quote = await res.json();
        setQuote(data);

        const itemIds = Array.from(new Set(data.item_details.map((d: any) => d.item_id)));

        const itemPromises = itemIds.map(async (itemId) => {
          const resItem = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/items/${itemId}/`);
          if (!resItem.ok) throw new Error(`Failed to fetch item ${itemId}`);
          return await resItem.json();
        });

        const items = await Promise.all(itemPromises);

        // Mapping item_id => item object for easy lookup in rendering
        const itemsObj: Record<number, Item> = {};
        items.forEach((item) => {
          itemsObj[item.id] = item;
        });
        setItemsMap(itemsObj);
        
      } catch (err) {
        setError("Failed to load quote data");
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [id]);

  function getGSTNumber(customFields: {[key: string]: string} | undefined): string | null {
  if (!customFields) return null;
  const keys = Object.keys(customFields).map(k => k.toLowerCase().replace(/\s+/g, ""));
  const gstKey = keys.find(k => k.includes("gst"));
  if (!gstKey) return null;
  return customFields[Object.keys(customFields)[keys.indexOf(gstKey)]] || null;
}


  if (loading) return <div className="text-center p-6 text-green-700 font-semibold">
          Loading Quote Details...
        </div>
  if (error || !quote)
    return <p className="text-red-600">{error || "Quote not found"}</p>;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-green-800">
          Quote: {quote.quote_number}
        </h2>
        <button
          className="text-green-700 border border-green-200 rounded px-4 py-1 hover:bg-green-50"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>
      <h2 className="text-xl font-semibold text-green-800">
          Deal No: {quote.deal_no}
        </h2>

      {/* Associated Customer Info */}
      <div className="mt-4 mb-6">
        <h3 className="font-semibold text-green-700 mb-2">Customer Info</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-green-700">
            <FaUser /> {quote.customer.display_name}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <FaEnvelope /> {quote.customer.email}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <FaPhone /> {quote.customer.work_phone}
          </div>
        </div>
        <div className="text-sm mt-4">
          Company: {quote.customer.company_name} <br />
        </div>
        <div className="text-sm mt-4">
          Type: {quote.customer.customer_type === "business" ? "Business" : "Individual"}
        </div>
        <div className="text-sm mt-4">
        GST Number: {getGSTNumber(quote.customer.custom_fields) ?? "N/A"}
      </div>
      </div>


      {/* Quote Details */}
      <div className="mt-6">
        <h3 className="font-semibold text-green-700 mb-2">Quote Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-700">Bank Details:</span>{" "}
            <span className="text-gray-900">{quote.bank_details.name}</span>
          </div>
          <div>
            <span className="text-gray-700">Quote Date:</span>{" "}
            <span className="text-gray-900">{quote.quote_date}</span>
          </div>
          <div>
            <span className="text-gray-700">Expiry Date:</span>{" "}
            <span className="text-gray-900">{quote.due_date}</span>
          </div>
          <div>
            <span className="text-gray-700">Salesperson:</span>{" "}
            <span className="text-gray-900">{quote.salesperson}</span>
          </div>
          <div>
            <span className="text-gray-700">Project Name:</span>{" "}
            <span className="text-gray-900">{quote.project_name}</span>
          </div>
          <div>
            <span className="text-gray-700">Subject:</span>{" "}
            <span className="text-gray-900">{quote.subject}</span>
          </div>
          <div>
            <span className="text-gray-700">Status:</span>{" "}
            <span className="text-gray-900">{quote.status}</span>
          </div>
        </div>
      </div>

      {/* Financial Section */}
      <div className="mt-10 border rounded-xl shadow-sm bg-green-50/30 p-6">
        <h3 className="font-semibold text-green-800 mb-4 text-lg border-b border-green-200 pb-2">
          Amount Summary
        </h3>

        <div className="flex flex-col gap-3 text-sm text-gray-800">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium">₹{parseFloat(quote.subtotal_amount).toFixed(2)}</span>
          </div>

          {parseFloat(quote.discount_percentage) > 0 && (
            <div className="flex justify-between">
              <span>Discount ({quote.discount_percentage}%)</span>
              <span className="text-red-600">- ₹{parseFloat(quote.discount_amount).toFixed(2)}</span>
            </div>
          )}

          {parseFloat(quote.tax_percentage) > 0 && (
            <div className="flex justify-between">
              <span>GST ({quote.tax_percentage}%)</span>
              <span className="text-blue-600">+ ₹{parseFloat(quote.gst_amount).toFixed(2)}</span>
            </div>
          )}

          {parseFloat(quote.adjustment_amount) !== 0 && (
            <div className="flex justify-between">
              <span>Adjustment</span>
              <span className={parseFloat(quote.adjustment_amount) < 0 ? "text-red-600" : "text-green-600"}>
                {parseFloat(quote.adjustment_amount) < 0 ? "-" : "+"} ₹{Math.abs(parseFloat(quote.adjustment_amount)).toFixed(2)}
              </span>
            </div>
          )}

          <div className="border-t border-green-200 my-2"></div>

          <div className="flex justify-between text-base font-semibold text-green-800">
            <span>Total Amount</span>
            <span className="text-green-900 font-bold text-lg">
              ₹{parseFloat(quote.total_amount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>


      {/* Notes and Terms */}
      {quote.customer_notes && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Customer Notes</h3>
          <div className="text-gray-800">{quote.customer_notes}</div>
        </div>
      )}

      {quote.terms_and_conditions && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Terms & Conditions</h3>
          <div className="text-gray-800">{quote.terms_and_conditions}</div>
        </div>
      )}

      {/* Tags */}
      {quote.customer.tags && quote.customer.tags.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {quote.customer.tags.map((tag, idx) => (
              <span key={idx} className="border px-2 py-1 rounded-full text-xs bg-green-50 text-green-800">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      {quote.customer.remarks && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Customer Remarks</h3>
          <div className="text-gray-800">{quote.customer.remarks}</div>
        </div>
      )}

      {/* Item Details */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">Item Details</h3>
        {quote.item_details && quote.item_details.length > 0 ? (
          <table className="w-full table-fixed text-sm mb-3">
            <thead>
              <tr className="text-green-800 bg-green-50">
                <th className="py-1 font-medium">Item Name</th>
                <th className="py-1 font-medium">HSN NO</th>
                <th className="py-1 font-medium">Description</th>
                <th className="py-1 font-medium">Quantity</th>
                <th className="py-1 font-medium">Rate</th>
                <th className="py-1 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Assuming item_details structured with name, description, quantity, rate, amount */}
              {quote.item_details.map((detail: any, idx: number) => {
              const item = itemsMap[detail.item_id];
              return (
              <tr key={idx} className="border-b">
              <td className="text-center align-middle">{item?.name || "..."}</td>
              <td className="text-center align-middle">{item?.hsn_code || "N/A"}</td>
              <td className="text-center align-middle">{item?.sales_description || "N/A"}</td>
              <td className="text-center align-middle">{detail.quantity}</td>
              <td className="text-center align-middle">{detail.rate}</td>
              <td className="text-center align-middle">₹{parseFloat(detail.amount).toFixed(2)}</td>
              </tr>
              );
              })}
            </tbody>
          </table>
        ) : (
          <span className="text-gray-500">No item details found.</span>
        )}
      </div>
    </div>
  );
}
