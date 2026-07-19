"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Bell, BellOff, X } from "lucide-react";

interface Props {
  userId: Id<"users"> | undefined;
}

export function PushNotificationCard({ userId }: Props) {
  const [status, setStatus] = useState<"idle" | "requesting" | "granted" | "denied" | "unsupported">("idle");
  const [dismissed, setDismissed] = useState(false);

  const hasSubscription = useQuery(
    api.notifications.hasPushSubscription,
    userId ? { userId } : "skip"
  );
  const saveSub = useMutation(api.notifications.savePushSubscription);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("granted");
    if (Notification.permission === "denied") setStatus("denied");
    // Check localStorage dismiss
    if (localStorage.getItem("push_dismissed") === "1") setDismissed(true);
  }, []);

  const requestPermission = async () => {
    if (!userId) return;
    setStatus("requesting");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push not configured");
        setStatus("granted");
        return;
      }

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const json = sub.toJSON();
      await saveSub({
        userId,
        endpoint: json.endpoint!,
        p256dh: (json.keys as any).p256dh,
        auth: (json.keys as any).auth,
      });

      setStatus("granted");
    } catch (err) {
      console.error("Push subscription failed:", err);
      setStatus("denied");
    }
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("push_dismissed", "1");
  };

  // Don't show if: already subscribed, unsupported, denied, or dismissed
  if (status === "unsupported" || status === "denied" || dismissed || hasSubscription || status === "granted") return null;

  return (
    <div style={{
      background: "linear-gradient(145deg, #0F1E35, #0F172A)",
      border: "1px solid rgba(59,130,246,0.25)",
      borderRadius: 20, padding: "1.25rem 1.5rem",
      display: "flex", alignItems: "center", gap: "1rem",
      boxShadow: "0 0 30px rgba(59,130,246,0.06)",
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: "12px",
        background: "rgba(59,130,246,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Bell size={20} color="#3B82F6" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>
          Never miss a study day
        </p>
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
          Get a reminder at 6:30 PM if your streak is at risk
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button
          onClick={requestPermission}
          disabled={status === "requesting"}
          style={{
            background: "#3B82F6", color: "#fff",
            border: "none", borderRadius: "10px",
            padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 700,
            cursor: status === "requesting" ? "not-allowed" : "pointer",
            opacity: status === "requesting" ? 0.7 : 1,
          }}
        >
          {status === "requesting" ? "Enabling…" : "Enable"}
        </button>
        <button
          onClick={dismiss}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "0.5rem" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Utility: convert VAPID base64 key → Uint8Array ──────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
