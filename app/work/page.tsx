import Link from "next/link";
import { requirePageUser } from "@/lib/auth/server";
import { getRepository } from "@/lib/incidents";
import type { Incident } from "@/lib/incidents/schema";
import {
  LocationText,
  SeverityBadge,
  StatusBadge,
} from "@/components/campusfix/Shared";
const severityRank = { emergency: 0, urgent: 1, priority: 2, routine: 3 };
function TicketList({
  tickets,
  empty,
}: {
  tickets: Incident[];
  empty: string;
}) {
  if (!tickets.length) return <p className="muted">{empty}</p>;
  return (
    <div className="my-report-list">
      {tickets.map((t) => {
        const sentBack =
          t.status === "assigned" &&
          t.timeline.some((e) => e.status === "awaiting_verification");
        return (
          <Link
            key={t.id}
            href={`/incidents/${t.id}`}
            className="my-report-card work-card"
          >
            <div className="work-card-top">
              <small>{t.displayId}</small>
              <SeverityBadge severity={t.analysis.severity} />
              <StatusBadge status={t.status} />
              {sentBack && <span className="sent-back-tag">Sent back</span>}
            </div>
            <h2>{t.analysis.issueTitle}</h2>
            <p>
              <LocationText location={t.location} />
            </p>
          </Link>
        );
      })}
    </div>
  );
}
export default async function WorkQueue() {
  const user = await requirePageUser("employee");
  const mine = (await (await getRepository()).getIncidents()).filter(
    (i) => i.assignedTo === user.email,
  );
  const todo = mine
    .filter((i) => i.status === "assigned" || i.status === "in_progress")
    .sort(
      (a, b) =>
        severityRank[a.analysis.severity] - severityRank[b.analysis.severity],
    );
  const waiting = mine.filter((i) => i.status === "awaiting_verification");
  const done = mine.filter((i) => i.status === "resolved").slice(0, 10);
  return (
    <main className="detail-page">
      <span className="eyebrow">Employee workspace</span>
      <h1>My assignments</h1>
      <p>
        Tickets the administrator assigned to you. Open one to start work and
        mark it resolved; the administrator verifies it before the reporter is
        notified.
      </p>
      <h2 className="work-section-title">
        To do <span>{todo.length}</span>
      </h2>
      <TicketList tickets={todo} empty="Nothing assigned right now." />
      <h2 className="work-section-title">
        Awaiting verification <span>{waiting.length}</span>
      </h2>
      <TicketList tickets={waiting} empty="No tickets waiting on the admin." />
      <h2 className="work-section-title">
        Recently resolved <span>{done.length}</span>
      </h2>
      <TicketList tickets={done} empty="Verified tickets will appear here." />
    </main>
  );
}
