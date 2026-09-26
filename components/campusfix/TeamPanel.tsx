"use client";
import { useCallback, useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { ErrorMessage } from "./Shared";
type Employee = {
  email: string;
  addedAt: string;
  registered: boolean;
  openTickets: number;
};
// Admin-only: the employees tickets can be assigned to.
export function TeamPanel() {
  const [team, setTeam] = useState<Employee[] | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const call = useCallback(async (method = "GET", body?: object) => {
    setError("");
    try {
      const r = await fetch("/api/team", {
        method,
        cache: "no-store",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setTeam(data);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void call();
  }, [call]);
  return (
    <section className="team-panel incident-list">
      <div className="list-heading">
        <div>
          <h2>
            Team <span>{team?.length ?? 0}</span>
          </h2>
          <p>
            Employees you can assign tickets to. They sign in with this email.
          </p>
        </div>
      </div>
      <form
        className="team-add"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (await call("POST", { email })) setEmail("");
          setBusy(false);
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="employee@ncsu.edu"
          aria-label="Employee email"
          required
        />
        <button className="button primary" disabled={busy || !email}>
          <UserPlus size={16} />
          Add employee
        </button>
      </form>
      <ErrorMessage message={error} />
      <ul className="team-list">
        {team?.map((m) => (
          <li key={m.email}>
            <div>
              <strong>{m.email}</strong>
              <small>
                {m.openTickets} open ticket{m.openTickets === 1 ? "" : "s"} ·{" "}
                {m.registered ? "Signed up" : "Has not signed up yet"}
              </small>
            </div>
            <button
              className="small-button icon-only"
              aria-label={`Remove ${m.email}`}
              disabled={busy}
              onClick={async () => {
                if (
                  m.openTickets &&
                  !window.confirm(
                    `${m.email} still has ${m.openTickets} open ticket(s). Remove anyway? Reassign those tickets afterwards.`,
                  )
                )
                  return;
                setBusy(true);
                await call("DELETE", { email: m.email });
                setBusy(false);
              }}
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
