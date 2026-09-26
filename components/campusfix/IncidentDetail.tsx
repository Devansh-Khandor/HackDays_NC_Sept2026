"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Users, CheckCircle2 } from "lucide-react";
import { type Incident } from "@/lib/incidents/schema";
import type { Actor } from "@/lib/incidents/workflow";
import {
  ActivityLog,
  ReportContent,
  StatusBadge,
  StatusTimeline,
  ErrorMessage,
} from "./Shared";
import { IncidentActions } from "./IncidentActions";
const backLinks = {
  admin: { href: "/admin", label: "All incidents" },
  employee: { href: "/work", label: "My assignments" },
  student: { href: "/my-reports", label: "My reports" },
};
export function IncidentDetail({ id, viewer }: { id: string; viewer: Actor }) {
  const back = backLinks[viewer.role];
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const r = await fetch(`/api/incidents/${id}`, {
          signal: controller.signal,
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setIncident(data);
        setError("");
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      }
    }
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => {
      controller.abort();
      clearInterval(t);
    };
  }, [id]);
  async function confirm() {
    setBusy(true);
    try {
      const r = await fetch(`/api/incidents/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setIncident(data);
      setConfirmed(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="detail-page">
      <Link className="text-button" href={back.href}>
        <ArrowLeft size={16} />
        {back.label}
      </Link>
      <ErrorMessage message={error} />
      {incident ? (
        <>
          <div className="detail-heading">
            <div>
              <span className="eyebrow">Track your impact</span>
              <h1>{incident.displayId}</h1>
            </div>
            <StatusBadge status={incident.status} />
          </div>
          {incident.mode === "demo" && (
            <div className="demo-label">
              Fictional demo report · No university service has been contacted
            </div>
          )}
          <div className="detail-grid">
            <article className="detail-card">
              <ReportContent draft={incident} />
            </article>
            <aside>
              <IncidentActions
                key={`${incident.id}-${incident.status}`}
                incident={incident}
                viewer={viewer}
                onUpdated={setIncident}
              />
              <div className="detail-card">
                <h3>From report to resolution</h3>
                <StatusTimeline incident={incident} />
                <p className="muted">
                  You&apos;ll get a notification in the bell above whenever this
                  report moves forward.
                </p>
                <ActivityLog incident={incident} />
              </div>
              {viewer.role === "student" && (
                <div className="detail-card community">
                  <Users size={24} />
                  <strong>{incident.confirmations}</strong>
                  <h3>Community confirmations</h3>
                  <p>
                    Seeing the same issue? Help the team understand its impact.
                  </p>
                  <button
                    className="button secondary wide"
                    disabled={
                      busy || confirmed || incident.status === "resolved"
                    }
                    onClick={confirm}
                  >
                    {confirmed ? (
                      <>
                        <CheckCircle2 size={16} />
                        Thanks for confirming
                      </>
                    ) : incident.status === "resolved" ? (
                      "This issue is resolved"
                    ) : busy ? (
                      "Confirming..."
                    ) : (
                      "I'm seeing this too"
                    )}
                  </button>
                </div>
              )}
            </aside>
          </div>
        </>
      ) : (
        !error && <div className="empty-state">Loading your report...</div>
      )}
    </main>
  );
}
