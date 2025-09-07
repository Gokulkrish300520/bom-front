import { useEffect, useState, useRef, useCallback } from "react";
import { refreshAccessToken } from "@/auth/tokenservice";

export function useIdleTokenRefresh() {
  const [promptVisible, setPromptVisible] = useState(false);
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  const promptTimer = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (promptTimer.current) clearTimeout(promptTimer.current);
  };

  const resetTimers = useCallback(() => {
    setPromptVisible(false);
    clearTimers();

    // Schedule prompt 13 min from now (2 minutes before refresh token expiry of 15 min)
    promptTimer.current = setTimeout(() => {
      setPromptVisible(true);

      // If no response in 1 min, logout
      logoutTimer.current = setTimeout(() => {
        localStorage.clear();
        window.location.href = "/login";
      }, 60_000);
    }, 28 * 60 * 1000); // 27 min
  }, []);

  useEffect(() => {
    resetTimers();

    const events = ["mousemove", "keydown", "wheel", "touchstart"];
    for (const event of events) {
      window.addEventListener(event, resetTimers);
    }

    return () => {
      clearTimers();
      for (const event of events) {
        window.removeEventListener(event, resetTimers);
      }
    };
  }, [resetTimers]);

  const refreshSession = async () => {
    try {
      await refreshAccessToken();
      setPromptVisible(false);
      resetTimers();
    } catch (e) {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  return { promptVisible, refreshSession };
}
