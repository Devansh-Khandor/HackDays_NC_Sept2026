"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Inbox,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
type Notification = {
  id: string;
  incidentId: string | null;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};
const POLL_MS = 20000;
const icons: Record<string, typeof Bell> = {
  reported: Inbox,
  acknowledged: ShieldCheck,
  assigned: ClipboardList,
  unassigned: ClipboardList,
  in_progress: Wrench,
  awaiting_verification: CheckCheck,
  resolved: CheckCircle2,
  verified: CheckCircle2,
  not_resolved: RotateCcw,
  sent_back: RotateCcw,
};
function ago(date: string) {
  const mins = Math.floor((Date.now() - Date.parse(date)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
export function NotificationCenter() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setItems(data.items);
      setUnread(data.unread);
    } finally {
      setLoaded(true);
    }
  }, []);
  // Polls while the tab is visible and refreshes as soon as the user returns to it.
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  async function markRead(ids?: string[]) {
    const affected = new Set(
      ids ?? items.filter((n) => !n.read).map((n) => n.id),
    );
    setItems((all) =>
      all.map((n) => (affected.has(n.id) ? { ...n, read: true } : n)),
    );
    setUnread((u) => (ids ? Math.max(0, u - affected.size) : 0));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    });
  }
  async function openNotification(n: Notification) {
    setOpen(false);
    if (!n.read) void markRead([n.id]);
    if (n.incidentId) router.push(`/incidents/${n.incidentId}`);
  }
  return (
    <div className="notification-center" ref={ref}>
      <button
        className="bell-button"
        aria-label={
          unread ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void refresh();
        }}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="bell-count">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
      {open && (
        <div
          className="notification-panel"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="notification-panel-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="text-button" onClick={() => void markRead()}>
                Mark all read
              </button>
            )}
          </div>
          <ul>
            {items.map((n) => {
              const Icon = icons[n.kind] ?? Bell;
              return (
                <li key={n.id}>
                  <button
                    className={`notification-item${n.read ? "" : " unread"} kind-${n.kind}`}
                    onClick={() => void openNotification(n)}
                  >
                    <span className="notification-icon">
                      <Icon size={16} />
                    </span>
                    <span className="notification-text">
                      <strong>{n.title}</strong>
                      <span>{n.body}</span>
                      <small>{ago(n.createdAt)}</small>
                    </span>
                    {!n.read && (
                      <span className="unread-dot" aria-label="Unread" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {loaded && !items.length && (
            <p className="notification-empty">
              You&apos;re all caught up. Updates about your tickets appear here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
