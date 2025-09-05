"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaEnvelope, FaPhone, FaUser } from "react-icons/fa";

type ContactPerson = {
  salutation?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
};


type CustomerDetails = {
  id: number;
  display_name: string;
  email: string;
  customer_type: string;
  company_name: string;
  currency: string;
  payment_terms: string;
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
  tags?: string[];
  custom_fields?: { [key: string]: string };
  remarks?: string;
  portal_status?: string;
  portal_language?: string;
  tax_preference?: string;
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetchWithAuth(
          `https://bpm-production.up.railway.app/api/customers/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch customer data");
        const data = await res.json();
        setCustomer(data);
      } catch (err) {
        setError("Failed to load customer data");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  if (loading) return <p>Loading customer details...</p>;
  if (error || !customer)
    return <p className="text-red-600">{error || "Customer not found"}</p>;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-green-800">
            {customer.display_name}
          </h2>
        </div>
        <button
          className="text-green-700 border border-green-200 rounded px-4 py-1 hover:bg-green-50"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>
      {/* Contact Info (icon row) */}
      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-2 text-green-700">
          <FaUser /> {customer.display_name}
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <FaEnvelope /> {customer.email}
        </div>
      </div>
      {/* "Address" section */}
      <div className="mt-6">
        <h3 className="font-semibold text-green-700 mb-1">ADDRESS</h3>
        <div className="flex flex-col md:flex-row gap-8 text-sm">
          <div>
            <div className="font-medium text-green-800 mb-1">Billing Address</div>
            <div className="text-gray-800 whitespace-pre-line min-h-[44px]">
              {customer.billing_street1 || ""}
              {customer.billing_street2 ? `\n${customer.billing_street2}` : ""}
              {customer.billing_city ? `\n${customer.billing_city}` : ""}
              {customer.billing_state ? `, ${customer.billing_state}` : ""}
              {customer.billing_pin_code ? `, ${customer.billing_pin_code}` : ""}
              {customer.billing_phone ? `\nPhone: ${customer.billing_phone}` : ""}
              {customer.billing_fax ? `\nFax: ${customer.billing_fax}` : ""}
            </div>
            {!customer.billing_street1 &&
              <span className="text-gray-500">No Billing Address - Add new address</span>
            }
          </div>
          <div>
            <div className="font-medium text-green-800 mb-1">Shipping Address</div>
            <div className="text-gray-800 whitespace-pre-line min-h-[44px]">
              {customer.shipping_street1 || ""}
              {customer.shipping_street2 ? `\n${customer.shipping_street2}` : ""}
              {customer.shipping_city ? `\n${customer.shipping_city}` : ""}
              {customer.shipping_state ? `, ${customer.shipping_state}` : ""}
              {customer.shipping_pin_code ? `, ${customer.shipping_pin_code}` : ""}
              {customer.shipping_phone ? `\nPhone: ${customer.shipping_phone}` : ""}
              {customer.shipping_fax ? `\nFax: ${customer.shipping_fax}` : ""}
            </div>
            {!customer.shipping_street1 && (
              <span className="text-gray-500">No Shipping Address - Add new address</span>
            )}
          </div>
        </div>
      </div>

      {/* Other Details section */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">OTHER DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-700">Customer Type:</span>{" "}
            <span className="text-gray-900">{customer.customer_type === "business" ? "Business" : "Individual"}</span>
          </div>
          <div>
            <span className="text-gray-700">Default Currency:</span>{" "}
            <span className="text-gray-900">{customer.currency || "INR"}</span>
          </div>
          <div>
            <span className="text-gray-700">Payment Terms:</span>{" "}
            <span className="text-gray-900">{customer.payment_terms}</span>
          </div>
          {/* Add more fields as needed per your backend data */}
          {customer.portal_status && (
            <div>
              <span className="text-gray-700">Portal Status:</span>{" "}
              <span className="text-gray-900">{customer.portal_status}</span>
            </div>
          )}
          {customer.portal_language && (
            <div>
              <span className="text-gray-700">Portal Language:</span>{" "}
              <span className="text-gray-900">{customer.portal_language}</span>
            </div>
          )}
          {customer.tax_preference && (
            <div>
              <span className="text-gray-700">Tax Preference:</span>{" "}
              <span className="text-gray-900">{customer.tax_preference}</span>
            </div>
          )}
        </div>
      </div>

      {/* Contact Persons */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">CONTACT PERSONS</h3>
        {customer.contact_persons && customer.contact_persons.length > 0 ? (
          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="text-green-800 bg-green-50">
                <th className="py-1 font-medium">Name</th>
                <th className="py-1 font-medium">Email</th>
                <th className="py-1 font-medium">Work Phone</th>
                <th className="py-1 font-medium">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {customer.contact_persons.map((cp, idx) => (
                <tr key={idx} className="border-b">
                  <td>{[cp.salutation, cp.first_name, cp.last_name].filter(Boolean).join(" ")}</td>
                  <td>{cp.email}</td>
                  <td>{cp.work_phone}</td>
                  <td>{cp.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="text-gray-500">No contact persons found.</span>
        )}
      </div>

      {customer.custom_fields && Object.keys(customer.custom_fields).length > 0 && (
  <div className="mt-8">
    <h3 className="font-semibold text-lg mb-2">Custom Fields</h3>
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="border-b p-2 text-left">Key</th>
          <th className="border-b p-2 text-left">Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(customer.custom_fields).map(([key, value], idx) => (
          <tr key={idx}>
            <td className="border-b p-2">{key}</td>
            <td className="border-b p-2">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}



      {/* Tags or associate tag */}
      {customer.tags && customer.tags.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">ASSOCIATE TAGS</h3>
          <div className="flex flex-wrap gap-2">
            {customer.tags.map((tag, idx) => (
              <span
                key={idx}
                className="border px-2 py-1 rounded-full text-xs bg-green-50 text-green-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      {customer.remarks && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">REMARKS</h3>
          <div className="text-gray-800">{customer.remarks}</div>
        </div>
      )}
    </div>
  );
}
