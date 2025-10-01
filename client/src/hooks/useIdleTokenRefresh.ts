"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { refreshAccessToken } from "@/auth/tokenservice";

const ACCESS_TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes
const PROMPT_BEFORE_EXPIRY = 2 * 60 * 1000; // 2 minutes before expiry
const IDLE_TIME_THRESHOLD = ACCESS_TOKEN_EXPIRY - PROMPT_BEFORE_EXPIRY;
const LAST_ACTIVITY_KEY = "lastActivityTime";

export function useIdleTokenRefresh() {
  const [promptVisible, setPromptVisible] = useState(false);
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  const promptTimer = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
    if (promptTimer.current) {
      clearTimeout(promptTimer.current);
      promptTimer.current = null;
    }
  };

  const updateLastActivityTime = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const resetTimers = useCallback(() => {
    setPromptVisible(false);
    clearTimers();
    updateLastActivityTime();

    promptTimer.current = setTimeout(() => {
      setPromptVisible(true);
      logoutTimer.current = setTimeout(() => {
        logout();
      }, PROMPT_BEFORE_EXPIRY);
    }, IDLE_TIME_THRESHOLD);
  }, []);

  useEffect(() => {
    const now = Date.now();
    const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
    const lastActivityTime = lastActivityStr ? parseInt(lastActivityStr, 10) : now;
    const elapsed = now - lastActivityTime;

    if (elapsed >= ACCESS_TOKEN_EXPIRY) {
      logout();
      return;
    } else if (elapsed >= IDLE_TIME_THRESHOLD) {
      setPromptVisible(true);
      logoutTimer.current = setTimeout(() => {
        logout();
      }, ACCESS_TOKEN_EXPIRY - elapsed);
    } else {
      const promptIn = IDLE_TIME_THRESHOLD - elapsed;
      promptTimer.current = setTimeout(() => {
        setPromptVisible(true);
        logoutTimer.current = setTimeout(() => {
          logout();
        }, PROMPT_BEFORE_EXPIRY);
      }, promptIn);
    }

    const events = ["mousemove", "keydown", "wheel", "touchstart"];
    const handleUserActivity = () => {
      if (!promptVisible) {
        updateLastActivityTime();
        resetTimers();
      }
    };

    for (const event of events) {
      window.addEventListener(event, handleUserActivity);
    }
    return () => {
      clearTimers();
      for (const event of events) {
        window.removeEventListener(event, handleUserActivity);
      }
    };
  }, [promptVisible, resetTimers]);

  const refreshSession = async () => {
    try {
      await refreshAccessToken();
      setPromptVisible(false);
      updateLastActivityTime();
      resetTimers();
    } catch (e) {
      logout();
    }
  };

  return { promptVisible, refreshSession };
}
