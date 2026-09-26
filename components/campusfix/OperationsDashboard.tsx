"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Inbox,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { statuses, type Incident, type Status } from "@/lib/incidents/schema";
import { mapUrl } from "@/lib/incidents/geo";
import {
  ErrorMessage,
  ReportContent,
  SeverityBadge,
  StatusBadge,
  StatusTimeline,
} from "./Shared";
const filters = [
  "All incidents",
  "Urgent",
  "Facilities",
  "Housing",
  "Transportation",
  "OIT",
  "Resolved",
];
const actions: Partial<Record<Status, string>> = {
  reported: "Acknowledge",
  acknowledged: "Assign",
  assigned: "Start Work",
  in_progress: "Resolve",
};
function age(date: string) {
  const mins = Math.max(1, Math.floor((Date.now() - Date.parse(date)) / 60000));
  return mins < 60
    ? `${mins}m ago`
    : mins < 1440
      ? `${Math.floor(mins / 60)}h ago`
      : `${Math.floor(mins / 1440)}d ago`;
}
export function OperationsDashboard() {
  const drawerRef = useRef<HTMLElement>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState("All incidents");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/incidents", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setIncidents(data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  // Refresh only sets state after a network response; this effect subscribes to external data.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = setInterval(() => void refresh(), 15000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (!selected) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), summary, input, textarea",
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", listener);
    };
  }, [selected]);
  async function update() {
    if (!selected) return;
    const status = statuses[statuses.indexOf(selected.status) + 1];
    if (!status) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/incidents/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setSelected(data);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const open = incidents.filter((i) => i.status !== "resolved");
  const urgent = open.filter((i) =>
    ["urgent", "emergency"].includes(i.analysis.severity),
  );
  const today = incidents.filter(
    (i) => new Date(i.createdAt).toDateString() === new Date().toDateString(),
  );
  const confirmations = incidents.reduce((a, i) => a + i.confirmations, 0);
  const mostConfirmed = [...open].sort(
    (a, b) => b.confirmations - a.confirmations,
  )[0];
  const shown = incidents.filter((i) => {
    const search =
      `${i.displayId} ${i.analysis.issueTitle} ${i.location.building} ${i.location.floor} ${i.location.room} ${i.location.locationDescription}`.toLowerCase();
    return (
      search.includes(query.toLowerCase()) &&
      (filter === "All incidents" ||
        (filter === "Urgent" &&
          ["urgent", "emergency"].includes(i.analysis.severity) &&
          i.status !== "resolved") ||
        (filter === "Resolved" && i.status === "resolved") ||
        (filter === "Housing" ? "University Housing" : filter) === i.department)
    );
  });
  return (
    <main className="dashboard">
      <div className="dashboard-heading">
        <div>
          <div className="dashboard-eyebrow">
            <span className="eyebrow">Campus operations</span>
            <span className="demo-admin">Demo Admin</span>
          </div>
          <h1>
            CampusFix Command Center<span>.</span>
          </h1>
          <p>
            AI-assisted campus incident operations. A clearer picture of what
            needs attention.
          </p>
        </div>
        <Link href="/#report" className="button primary">
          New report
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="metrics">
        {[
          {
            label: "Open incidents",
            value: open.length,
            Icon: Inbox,
            note: "Awaiting resolution",
          },
          {
            label: "Urgent incidents",
            value: urgent.length,
            Icon: AlertTriangle,
            note: "Need priority attention",
          },
          {
            label: "Reports today",
            value: today.length,
            Icon: Activity,
            note: "Campus observations",
          },
          {
            label: "Total confirmations",
            value: confirmations,
            Icon: Users,
            note: "A stronger campus signal",
          },
        ].map(({ label, value, Icon, note }, i) => (
          <div className={`metric metric-${i}`} key={label}>
            <div>
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{loading ? "—" : value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="pulse">
        <div className="pulse-title">
          <Sparkles size={19} />
          <strong>Campus Pulse</strong>
        </div>
        <p>
          {mostConfirmed ? (
            <>
              <strong>{mostConfirmed.analysis.issueTitle}</strong> has{" "}
              {mostConfirmed.confirmations} confirmations — the most supported
              open report.
            </>
          ) : (
            "Campus reports will appear here as your community shares observations."
          )}
        </p>
        {mostConfirmed && (
          <button
            onClick={() => setSelected(mostConfirmed)}
            aria-label="View most confirmed incident"
          >
            <ArrowRight size={19} />
          </button>
        )}
      </div>
      <ErrorMessage message={error} />
      <section className="incident-list">
        <div className="list-heading">
          <div>
            <h2>
              Incident queue <span>{incidents.length}</span>
            </h2>
            <p>Every observation, organized and ready for action.</p>
          </div>
          <button className="small-button" onClick={() => void refresh()}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <div className="list-controls">
          <div className="filters" aria-label="Filter incidents">
            {filters.map((f) => (
              <button
                key={f}
                className={filter === f ? "selected" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports..."
              aria-label="Search reports"
            />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Incident</th>
                <th>Location</th>
                <th>Department</th>
                <th>
                  <Users size={16} />
                  <span className="sr-only">Confirmations</span>
                </th>
                <th>Reported</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((i) => (
                <tr key={i.id}>
                  <td>
                    <SeverityBadge severity={i.analysis.severity} />
                  </td>
                  <td>
                    <button
                      className="incident-title"
                      onClick={() => setSelected(i)}
                    >
                      {i.analysis.issueTitle}
                    </button>
                    <small className="incident-meta">
                      {i.displayId} <span>· {i.analysis.category}</span>
                      {i.mode === "demo" && <em>Demo</em>}
                    </small>
                  </td>
                  <td>
                    <span>
                      {i.location.building ||
                        i.location.locationDescription ||
                        (i.location.coordinates && "GPS location")}
                    </span>
                    <small>
                      {[
                        i.location.floor && `Floor ${i.location.floor}`,
                        i.location.room && `Room ${i.location.room}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      {i.location.coordinates && (
                        <>
                          {(i.location.floor || i.location.room) && " · "}
                          <a
                            className="map-link"
                            href={mapUrl(i.location.coordinates)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Map
                          </a>
                        </>
                      )}
                    </small>
                  </td>
                  <td>{i.department}</td>
                  <td className="confirmations-cell">{i.confirmations}</td>
                  <td>
                    <span className="age">
                      <Clock size={13} />
                      {age(i.createdAt)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={i.status} />
                  </td>
                  <td>
                    <button
                      className="row-open"
                      aria-label={`Open ${i.displayId}`}
                      onClick={() => setSelected(i)}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(loading || !shown.length) && (
          <div className="empty-state">
            <Inbox size={30} />
            <h3>
              {loading
                ? "Loading campus reports..."
                : incidents.length
                  ? "No reports match your search."
                  : "Nothing reported yet. That's a good thing."}
            </h3>
            <p>
              {!loading && "Try a different filter or create a new report."}
            </p>
          </div>
        )}
        <div className="list-footer">
          <span>
            {shown.length} of {incidents.length} reports
          </span>
          <span>
            <span className="live-dot" />
            Updates every 15 seconds · fictional demo reports labeled
          </span>
        </div>
      </section>
      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <section
            ref={drawerRef}
            className="incident-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <span className="eyebrow" id="drawer-title">
                  {selected.displayId} · Incident details
                </span>
                <StatusBadge status={selected.status} />
              </div>
              <button
                autoFocus
                aria-label="Close incident details"
                onClick={() => setSelected(null)}
              >
                <X size={22} />
              </button>
            </div>
            <div className="drawer-body">
              <ReportContent draft={selected} />
              <h3 className="timeline-title">Report activity</h3>
              <StatusTimeline incident={selected} />
              <p className="support-count">
                <Users size={18} />
                {selected.confirmations} community confirmations
              </p>
              <ErrorMessage message={error} />
            </div>
            <div className="drawer-actions">
              <Link
                className="button secondary"
                href={`/incidents/${selected.id}`}
              >
                Track report
                <ArrowUpRight size={15} />
              </Link>
              {actions[selected.status] && (
                <button
                  className="button primary"
                  onClick={update}
                  disabled={busy}
                >
                  {busy ? "Saving..." : actions[selected.status]}
                  <ArrowRight size={17} />
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
