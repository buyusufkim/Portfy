import { useState, useEffect, useRef } from "react";
import { setGlobalServerOffset } from "../services/core/utils";

export function useTurkeyClock() {
  const [now, setNow] = useState(() => new Date());
  const offsetRef = useRef(0);
  const [source, setSource] = useState<"server" | "fallback">("fallback");
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchServerTime() {
      try {
        const start = Date.now();
        const res = await fetch("/api/time/turkey");
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        
        if (active) {
          const latency = Date.now() - start;
          const serverTime = data.timestamp;
          const offset = serverTime + (latency / 2) - Date.now();
          offsetRef.current = offset;
          setGlobalServerOffset(offset);
          setNow(new Date(Date.now() + offset));
          setSource("server");
          setIsSynced(true);
        }
      } catch (err) {
        if (active) {
          console.warn("Failed to fetch server time, using local fallback", err);
          setSource("fallback");
        }
      }
    }

    fetchServerTime();

    const syncInterval = setInterval(fetchServerTime, 5 * 60 * 1000); // Sync every 5 minutes

    const tickInterval = setInterval(() => {
      setNow(new Date(Date.now() + offsetRef.current));
    }, 1000);

    return () => {
      active = false;
      clearInterval(syncInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const formatterDate = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });

  const formatterTime = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Istanbul",
  });

  const dateLabel = formatterDate.format(now);
  const timeLabel = formatterTime.format(now);
  const fullLabel = `${dateLabel} · ${timeLabel}`;
  
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Istanbul",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const todayISO = `${year}-${month}-${day}`;

  return { 
    dateLabel, 
    timeLabel, 
    fullLabel,
    iso: now.toISOString(),
    timestamp: now.getTime(),
    todayISO,
    timezone: "Europe/Istanbul" as const,
    source,
    isSynced
  };
}

