import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_SELECTED_TOOTH = "dentry_odonto_selected_tooth_v1";
const STORAGE_HISTORY = "dentry_odonto_history_v1";

export interface OdontogramSessionEntry {
  id: string;
  startedAt: number;
  endedAt: number;
  elapsedMs: number;
  tooth: string | null;
}

export interface OdontogramStats {
  sessions: number;
  totalMs: number;
  averageMs: number;
  topTooth: string | null;
  topToothMs: number;
}

function loadHistory(): OdontogramSessionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history: OdontogramSessionEntry[]) {
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
}

export function useOdontogramSession() {
  const [selectedTooth, setSelectedToothState] = useState<string>("");
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [history, setHistory] = useState<OdontogramSessionEntry[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      const storedTooth = localStorage.getItem(STORAGE_SELECTED_TOOTH) || "";
      setSelectedToothState(storedTooth);
    } catch {
      setSelectedToothState("");
    }
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (!sessionStart) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sessionStart]);

  const setSelectedTooth = useCallback((tooth: string) => {
    setSelectedToothState(tooth);
    localStorage.setItem(STORAGE_SELECTED_TOOTH, tooth);
  }, []);

  const startSession = useCallback(() => {
    if (!selectedTooth) return;
    setSessionStart(Date.now());
    setNow(Date.now());
  }, [selectedTooth]);

  const stopSession = useCallback(() => {
    if (!sessionStart) return;
    const endedAt = Date.now();
    const entry: OdontogramSessionEntry = {
      id: `odo_${endedAt}`,
      startedAt: sessionStart,
      endedAt,
      elapsedMs: Math.max(0, endedAt - sessionStart),
      tooth: selectedTooth || null,
    };
    const nextHistory = [entry, ...history].slice(0, 200);
    setHistory(nextHistory);
    saveHistory(nextHistory);
    setSessionStart(null);
  }, [history, selectedTooth, sessionStart]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const activeElapsedMs = sessionStart ? Math.max(0, now - sessionStart) : 0;

  const stats = useMemo<OdontogramStats>(() => {
    const totalMs = history.reduce((sum, entry) => sum + entry.elapsedMs, 0);
    const byTooth = history.reduce<Record<string, number>>((acc, entry) => {
      if (entry.tooth) {
        acc[entry.tooth] = (acc[entry.tooth] || 0) + entry.elapsedMs;
      }
      return acc;
    }, {});

    let topTooth: string | null = null;
    let topToothMs = 0;
    for (const [tooth, ms] of Object.entries(byTooth)) {
      if (ms > topToothMs) {
        topTooth = tooth;
        topToothMs = ms;
      }
    }

    return {
      sessions: history.length,
      totalMs,
      averageMs: history.length ? Math.round(totalMs / history.length) : 0,
      topTooth,
      topToothMs,
    };
  }, [history]);

  return {
    selectedTooth,
    setSelectedTooth,
    isSessionRunning: !!sessionStart,
    activeElapsedMs,
    history,
    stats,
    startSession,
    stopSession,
    clearHistory,
  };
}

export function formatOdontogramDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}
