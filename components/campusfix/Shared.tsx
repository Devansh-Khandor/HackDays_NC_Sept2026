import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  MapPin,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  statuses,
  type Analysis,
  type Draft,
  type Incident,
} from "@/lib/incidents/schema";
import { routes } from "@/lib/routing/routes";
export const statusLabel = (s: string) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
export function SeverityBadge({
  severity,
}: {
  severity: Analysis["severity"];
}) {
  return (
    <span className={`badge severity-${severity}`}>
      <span />
      {severity}
    </span>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status}`}>
      {statusLabel(status)}
    </span>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <div className="error-message" role="alert">
      <AlertTriangle size={18} />
      <span>{message}</span>
    </div>
  ) : null;
}
export function SafetyBanner({ analysis }: { analysis: Analysis }) {
  return analysis.immediateSafetyMessage ? (
    <div className="safety-banner" role="alert">
      <AlertTriangle size={23} />
      <div>
        <strong>Potential Emergency</strong>
        <p>{analysis.immediateSafetyMessage}</p>
      </div>
    </div>
  ) : null;
}
export function LocationText({ location }: { location: Draft["location"] }) {
  return (
    <>
      {[
        location.building,
        location.floor && `Floor ${location.floor}`,
        location.room && `Room ${location.room}`,
        location.locationDescription,
      ]
        .filter(Boolean)
        .join(" · ") || "Location needed"}
    </>
  );
}
export function ReportContent({ draft }: { draft: Draft }) {
  const a = draft.analysis;
  const route = routes[a.suggestedDepartment];
  return (
    <>
      <SafetyBanner analysis={a} />
      <div className="report-heading">
        <div>
          <span className="eyebrow">CampusFix incident · {a.category}</span>
          <h2>{a.issueTitle}</h2>
        </div>
        <SeverityBadge severity={a.severity} />
      </div>
      <div className="location-line">
        <MapPin size={17} />
        <LocationText location={draft.location} />
      </div>
      {draft.image && (
        <img
          className="report-image"
          src={draft.image}
          alt="Submitted photograph of the campus issue"
        />
      )}
      <div className="report-section">
        <h3>Description</h3>
        <p>{a.summary}</p>
      </div>
      <div className="evidence-grid">
        <div>
          <h3>Observed evidence</h3>
          <ul className="check-list">
            {a.visibleEvidence.map((e, i) => (
              <li key={i}>
                <Check size={16} />
                {e}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Possible hazards</h3>
          {a.hazards.length ? (
            <ul className="check-list hazards">
              {a.hazards.map((e, i) => (
                <li key={i}>
                  <AlertTriangle size={16} />
                  {e}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              No specific hazard identified. This is not a safety clearance.
            </p>
          )}
        </div>
      </div>
      <div className="route-card">
        <div className="route-icon">
          <ShieldCheck size={23} />
        </div>
        <div>
          <span className="eyebrow">Suggested service destination</span>
          <h3>{route.name}</h3>
          <p>{a.routingReason}</p>
          {route.url && (
            <a href={route.url} target="_blank" rel="noreferrer">
              Official service information <ArrowUpRight size={14} />
            </a>
          )}
          {route.phone && (
            <small>
              {route.note} · {route.phone}
            </small>
          )}
        </div>
      </div>
      <details className="intelligence">
        <summary>
          <Sparkles size={17} /> How CampusFix understood this <span>+</span>
        </summary>
        <div>
          <p>
            <strong>
              {draft.mode === "demo" ? "Demo fixture" : "Gemini Intelligence"}
            </strong>{" "}
            ·{" "}
            {a.confidence >= 0.8
              ? "High"
              : a.confidence >= 0.5
                ? "Medium"
                : "Low"}{" "}
            confidence
          </p>
          <ul className="check-list">
            <li>
              <Check size={16} />
              Visual / contextual understanding:{" "}
              {a.detectedObject || a.category}
            </li>
            <li>
              <Check size={16} />
              Priority assessment: {a.severityReason}
            </li>
            <li>
              <Check size={16} />
              Routing checked against campus service rules
            </li>
            <li>
              <Check size={16} />
              Structured report validated before submission
            </li>
          </ul>
          <p className="muted">
            These are decision summaries, not private model reasoning.
          </p>
        </div>
      </details>
    </>
  );
}
export function StatusTimeline({ incident }: { incident: Incident }) {
  const index = statuses.indexOf(incident.status);
  return (
    <ol className="timeline">
      {statuses.map((status, i) => {
        const entry = incident.timeline.find((e) => e.status === status);
        return (
          <li key={status} className={i <= index ? "complete" : ""}>
            <span className="timeline-dot">
              {i < index ? <Check size={13} /> : i + 1}
            </span>
            <div>
              <strong>{statusLabel(status)}</strong>
              <small>
                {entry
                  ? new Date(entry.at).toLocaleString()
                  : i === index + 1
                    ? "Next step"
                    : "Pending"}
              </small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
