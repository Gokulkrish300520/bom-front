'use client';

import Card from '@/components/Card';
import { Book, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isTokenExpired, refreshAccessToken } from "@/utils/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validateTokens() {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        router.push("/login");
        return;
      }

      if (isTokenExpired(accessToken)) {
        const newAccess = await refreshAccessToken(refreshToken);
        if (!newAccess) {
          router.push("/login");
          return;
        }
      }

      setLoading(false);
    }

    validateTokens();
  }, [router]);

  if (loading)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#008060]"></div>
    </div>
  );


  return (
    <div className="min-h-screen px-6 py-12 bg-gradient-to-br from-[#e6f4f1] to-[#d0ebe3] font-poppins">
      
      {/* Add margin-top to move the cards down */}
      <div className="grid max-w-6xl grid-cols-1 gap-10 mx-auto sm:grid-cols-2 mt-[10vh]">
        <Card
          title="Books"
          subtitle="Books / Accounts / Inventory"
          route="/books"
          icon={<Book className="w-12 h-12" />}
        />
        <Card
          title="CRM"
          subtitle="Workflow Management"
          route="/crm"
          icon={<LayoutDashboard className="w-12 h-12" />}
        />
      </div>
    </div>
  );
}