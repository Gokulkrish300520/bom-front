'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CRMPage() {
  const router = useRouter();
  
    useEffect(() => {
      async function validateTokens() {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
  
        if (!accessToken || !refreshToken) {
          // No tokens, redirect to login
          router.push("/login");
          return;
        }
  
        try {
          // Attempt silent refresh of access token
          const res = await fetch("https://web-production-6baf3.up.railway.app/api/auth/token/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          });
  
          if (!res.ok) {
            throw new Error("Failed to refresh token");
          }
  
          const data = await res.json();
          localStorage.setItem("accessToken", data.access);
        } catch (err) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          router.push("/login");
        }
      }
      validateTokens();
    }, [router]);

  return (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h1 className="text-2xl font-bold mb-6">CRM Page</h1>
    <button
      onClick={() => router.push("/crm/pipelines/dashboard")}
      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
    >
      Go to Dashboard
    </button>
  </div>
);
}