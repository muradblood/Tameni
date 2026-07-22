import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

const SESSION_KEY = "tameeni_session_id";
const DATA_KEY = "tameeniTempData";

export function useVisitorSession() {
  const [sessionId] = useState<string>(() => {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = nanoid(24);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  });

  const [visitorIp, setVisitorIp] = useState<string>("");

  useEffect(() => {
    fetch("https://api.ipify.org/?format=json")
      .then((r) => r.json())
      .then(({ ip }) => setVisitorIp(ip))
      .catch(() => setVisitorIp("unknown"));
  }, []);

  function saveData(data: Record<string, unknown>) {
    const existing = getStoredData();
    const merged = { ...existing, ...data };
    sessionStorage.setItem(DATA_KEY, JSON.stringify(merged));
    return merged;
  }

  function getStoredData(): Record<string, unknown> {
    try {
      return JSON.parse(sessionStorage.getItem(DATA_KEY) ?? "{}");
    } catch {
      return {};
    }
  }

  return { sessionId, visitorIp, saveData, getStoredData };
}
