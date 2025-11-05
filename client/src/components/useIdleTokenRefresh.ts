"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { refreshAccessToken } from "@/auth/tokenservice";

interface DecodedToken {
  exp: number;
}

export function useIdleTokenRefresh() {
  const [promptVisible, setPromptVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // 🔁 Periodically check refresh token expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return;

      try {
        const decoded = jwtDecode<DecodedToken>(refreshToken);
        const exp = decoded.exp * 1000; // Convert to ms
        const now = Date.now();
        const diff = exp - now;

        // Store time left
        setTimeLeft(diff);

        // If < 2 mins left (120000 ms), show popup
        if (diff < 120000 && diff > 0) {
          setPromptVisible(true);
        } else if (diff <= 0) {
          // Token expired — force logout
          localStorage.clear();
          window.location.href = "/login";
        }
      } catch {
        // Invalid token
        localStorage.clear();
        window.location.href = "/login";
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // 🕒 Detect user activity to hide popup automatically
  useEffect(() => {
    const handleActivity = () => {
      if (promptVisible) setPromptVisible(false);
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [promptVisible]);

  // ✅ User clicks “Stay logged in”
  const refreshSession = async () => {
    try {
      await refreshAccessToken();
      setPromptVisible(false);
    } catch {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  return { promptVisible, refreshSession, timeLeft };
}
