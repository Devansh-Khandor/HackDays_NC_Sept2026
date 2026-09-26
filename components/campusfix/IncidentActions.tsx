"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  X,
} from "lucide-react";
import type { Incident } from "@/lib/incidents/schema";
import {
  availableActions,
  latestCompletion,
  type Actor,
  type IncidentAction,
} from "@/lib/incidents/workflow";
import { ErrorMessage } from "./Shared";
type Employee = { email: string; registered: boolean; openTickets: number };
async function send(id: string, action: IncidentAction): Promise<Incident> {
  const r = await fetch(`/api/incidents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  return data;
}
// Role-aware next steps for a ticket. Renders nothing when the viewer has no action.
export function IncidentActions({
  incident,
  viewer,
  onUpdated,
}: {
  incident: Incident;
  viewer: Actor;
  onUpdated: (incident: Incident) => void;
}) {
  const actions = availableActions(incident, viewer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState(incident.assignedTo ?? "");
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const canAssign = actions.includes("assign");
  useEffect(() => {
    if (!canAssign) return;
    let cancelled = false;
    fetch("/api/team", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (!cancelled) setEmployees(data);
      })
      .catch((e) => !cancelled && setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [canAssign]);
  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  if (!actions.length) return null;
  async function run(action: () => Promise<IncidentAction>) {
    setBusy(true);
    setError("");
    try {
      onUpdated(await send(incident.id, await action()));
      setNote("");
      setPhoto(null);
      setPreview("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function uploadPhoto() {
    if (!photo) return null;
    const form = new FormData();
    form.set("image", photo);
    const r = await fetch("/api/uploads", { method: "POST", body: form });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    return data.image as string;
  }
  const completion = latestCompletion(incident);
  return (
    <section className="action-panel" aria-label="Ticket actions">
      {actions.includes("acknowledge") && (
        <div className="action-block">
          <div>
            <strong>New report</strong>
            <p>Acknowledge it so the reporter knows it has been seen.</p>
          </div>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => run(async () => ({ action: "acknowledge" }))}
          >
            {busy ? "Saving..." : "Acknowledge"}
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      {canAssign && (
        <div className="action-block">
          <div>
            <strong>
              {incident.assignedTo
                ? "Reassign ticket"
                : "Assign to an employee"}
            </strong>
            <p>
              {incident.assignedTo
                ? `Currently with ${incident.assignedTo}.`
                : "The employee is notified and can resolve it from their queue."}
            </p>
          </div>
          <div className="assign-row">
            <select
              aria-label="Employee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              disabled={!employees?.length}
            >
              <option value="">
                {employees === null
                  ? "Loading team..."
                  : employees.length
                    ? "Choose an employee"
                    : "No employees yet — add one under Team"}
              </option>
              {employees?.map((e) => (
                <option key={e.email} value={e.email}>
                  {e.email} · {e.openTickets} open
                  {e.registered ? "" : " · not signed up"}
                </option>
              ))}
            </select>
            <button
              className="button primary"
              disabled={busy || !assignee || assignee === incident.assignedTo}
              onClick={() => run(async () => ({ action: "assign", assignee }))}
            >
              <UserCheck size={17} />
              {busy ? "Saving..." : incident.assignedTo ? "Reassign" : "Assign"}
            </button>
          </div>
        </div>
      )}
      {actions.includes("verify") && (
        <div className="action-block stacked">
          <div>
            <strong>Verify the employee&apos;s work</strong>
            <p>
              Check the notes and photo below, or verify in person, then confirm
              the outcome. The reporter is notified either way.
            </p>
          </div>
          {completion && (
            <div className="completion-evidence">
              <small>
                Submitted {new Date(completion.at).toLocaleString()}
                {completion.actor && ` by ${completion.actor}`}
              </small>
              <p>{completion.note || "No notes were added."}</p>
              {completion.image ? (
                <a href={completion.image} target="_blank" rel="noreferrer">
                  <img
                    src={completion.image}
                    alt="Employee's photo of the completed work"
                  />
                </a>
              ) : (
                <small>No photo attached.</small>
              )}
            </div>
          )}
          <label className="field">
            <span>Note (required when sending back)</span>
            <textarea
              rows={3}
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Confirmed on site; or: the leak is still visible under the sink."
            />
          </label>
          <div className="button-row">
            <button
              className="button secondary"
              disabled={busy || note.trim().length < 3}
              onClick={() => run(async () => ({ action: "reject", note }))}
            >
              <RotateCcw size={16} />
              Send back
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => run(async () => ({ action: "verify", note }))}
            >
              <CheckCircle2 size={17} />
              {busy ? "Saving..." : "Verify & resolve"}
            </button>
          </div>
        </div>
      )}
      {actions.includes("start") && (
        <div className="action-block">
          <div>
            <strong>Assigned to you</strong>
            <p>Let the reporter know you are working on it.</p>
          </div>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => run(async () => ({ action: "start" }))}
          >
            Start work
          </button>
        </div>
      )}
      {actions.includes("complete") && (
        <div className="action-block stacked">
          <div>
            <strong>Resolve this ticket</strong>
            <p>
              Describe the fix and optionally attach a photo. The administrator
              verifies it before the reporter is told it&apos;s resolved.
            </p>
          </div>
          <label className="field">
            <span>What did you do?</span>
            <textarea
              rows={3}
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Replaced the fountain valve and tested the drain."
            />
          </label>
          <div className="photo-row">
            {preview ? (
              <div className="photo-preview">
                <img src={preview} alt="Selected proof-of-work" />
                <button
                  aria-label="Remove photo"
                  onClick={() => {
                    setPhoto(null);
                    setPreview("");
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <label className="small-button">
                <Camera size={15} />
                Add photo (optional)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
          <button
            className="button primary"
            disabled={busy}
            onClick={() =>
              run(async () => ({
                action: "complete",
                note,
                image: await uploadPhoto(),
              }))
            }
          >
            <CheckCircle2 size={17} />
            {busy ? "Submitting..." : "Mark as resolved"}
          </button>
        </div>
      )}
      <ErrorMessage message={error} />
    </section>
  );
}
