"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { type Draft, type Incident, hasLocation } from "@/lib/incidents/schema";
import { IncidentCapture } from "./IncidentCapture";
import {
  CAMPUS_BUILDINGS_LIST,
  CampusBuildingOptions,
  LocationPicker,
} from "./LocationPicker";
import { AnalysisProgress } from "./AnalysisProgress";
import {
  ErrorMessage,
  ReportContent,
  SeverityBadge,
  SafetyBanner,
  LocationText,
  dashboardFor,
} from "./Shared";
import type { Role } from "@/lib/auth/policy";
import { routes } from "@/lib/routing/routes";
import { routeIncident } from "@/lib/routing/routingEngine";
import { applySafetyRules } from "@/lib/safety/safetyRules";
type Step = "capture" | "analysis" | "clarify" | "review" | "success";
async function request(url: string, body: unknown, method = "POST") {
  const result = await fetch(url, {
    method,
    headers:
      body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  const json = await result.json();
  if (!result.ok)
    throw new Error(json.error || "Something went wrong. Please try again.");
  return json;
}
export function ReportWorkflow({ role = "student" }: { role?: Role }) {
  const [step, setStep] = useState<Step>("capture");
  const demo = false;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [duplicate, setDuplicate] = useState<{
    incident: Incident;
    assessment: { reason: string };
  } | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const key = useRef("");
  async function review(d: Draft) {
    setStep("review");
    setDuplicate(null);
    setDuplicateNotice("Checking open reports for possible duplicates...");
    setBusy(true);
    try {
      const data = await request("/api/duplicates", d);
      setDuplicate(data.duplicate);
      setDuplicateNotice(
        data.unavailable
          ? "Duplicate check is temporarily unavailable. You can still submit this report."
          : "",
      );
    } catch {
      setDuplicateNotice(
        "Duplicate check is temporarily unavailable. You can still submit this report.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function analyze(form: FormData) {
    setError("");
    setStep("analysis");
    try {
      const result = await request("/api/analyze", form);
      setDraft(result);
      key.current = crypto.randomUUID();
      if (result.readyForReview) await review(result);
      else setStep("clarify");
    } catch (e) {
      setError((e as Error).message);
      setStep("capture");
    }
  }
  async function clarify() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const result = await request("/api/clarify", {
        analysis: draft.analysis,
        knownLocation: draft.location,
        userMessage: answer,
        conversationHistory: history.slice(-6),
        mode: draft.mode,
      });
      const next = {
        ...draft,
        analysis: result.updatedAnalysis,
        location: result.location,
      };
      setDraft(next);
      setHistory(
        (h) =>
          [
            ...h,
            { role: "user", text: answer },
            {
              role: "assistant",
              text: result.readyForReview
                ? "Got it. Your report is ready to review."
                : result.updatedAnalysis.clarifyingQuestions.join(" "),
            },
          ].slice(-8) as typeof h,
      );
      setAnswer("");
      if (result.readyForReview) await review(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const data = await request("/api/incidents", {
        ...draft,
        userApproved: true,
        submissionKey: key.current,
      });
      setIncident(data);
      setStep("success");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!duplicate) return;
    setBusy(true);
    setError("");
    try {
      const data = await request(
        `/api/incidents/${duplicate.incident.id}/confirm`,
        {},
      );
      setConfirmed(true);
      setIncident(data);
      setStep("success");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const steps = ["Capture", "Understand", "Clarify", "Review", "Submitted"];
  const index = { capture: 0, analysis: 1, clarify: 2, review: 3, success: 4 }[
    step
  ];
  return (
    <section id="report" className="report-workspace">
      <div className="workflow-top">
        <span>
          <span className="live-dot" />
          Campus reporting, simplified
        </span>
        <span>{demo ? "DEMO MODE" : "GEMINI POWERED"}</span>
      </div>
      <div className="workflow-grid">
        <aside className="workflow-sidebar">
          <span className="eyebrow">Your report</span>
          <h2>
            A little context.
            <br />A lot of impact.
          </h2>
          <ol className="steps">
            {steps.map((label, i) => (
              <li
                key={label}
                className={i === index ? "active" : i < index ? "done" : ""}
              >
                <span>
                  {i < index ? (
                    <Check size={15} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <div>
                  <strong>{label}</strong>
                  <small>
                    {
                      [
                        "Show us what you see",
                        "Let Gemini connect the dots",
                        "Fill in the missing pieces",
                        "Make sure it looks right",
                        "Keep track of the fix",
                      ][i]
                    }
                  </small>
                </div>
              </li>
            ))}
          </ol>
          <div className="sidebar-trust">
            <ShieldCheck size={20} />
            <p>
              <strong>You&apos;re in control.</strong>Nothing is submitted
              without your approval.
            </p>
          </div>
        </aside>
        <div
          className="workflow-content"
          aria-busy={busy || step === "analysis"}
        >
          {step === "capture" && (
            <IncidentCapture
              demo={demo}
              onAnalyze={analyze}
            />
          )}
          {step === "analysis" && <AnalysisProgress demo={demo} />}
          {step === "clarify" && draft && (
            <>
              <div className="capture-heading">
                <div>
                  <span className="eyebrow">
                    {demo ? "Demo scenario" : "Gemini identified"}
                  </span>
                  <h2>Here&apos;s what we found.</h2>
                </div>
                <Sparkles className="red" size={25} />
              </div>
              <SafetyBanner analysis={draft.analysis} />
              <div className="analysis-result">
                <div className="flex-between">
                  <span className="category-label">
                    {draft.analysis.category}
                  </span>
                  <SeverityBadge severity={draft.analysis.severity} />
                </div>
                <h3>{draft.analysis.issueTitle}</h3>
                <p>{draft.analysis.summary}</p>
                <ul className="check-list">
                  {draft.analysis.visibleEvidence.map((s, i) => (
                    <li key={i}>
                      <Check size={16} />
                      {s}
                    </li>
                  ))}
                </ul>
                {draft.analysis.hazards.length > 0 && (
                  <div className="hazard-note">
                    Possible hazard: {draft.analysis.hazards.join(" · ")}
                  </div>
                )}
                <span className="confidence">
                  {draft.analysis.confidence >= 0.8
                    ? "High"
                    : draft.analysis.confidence >= 0.5
                      ? "Medium"
                      : "Low"}{" "}
                  confidence ·{" "}
                  {demo ? "Fictional example" : "Gemini assessment"}
                </span>
              </div>
              <div className="chat">
                <div className="chat-avatar">
                  <Sparkles size={17} />
                </div>
                <div>
                  <strong>Just a little more context</strong>
                  <p>
                    {draft.analysis.clarifyingQuestions.join(" ") ||
                      "Which building, floor, and room is this in?"}
                  </p>
                </div>
              </div>
              {history.map((m, i) => (
                <div className={`chat-message ${m.role}`} key={i}>
                  {m.text}
                </div>
              ))}
              <label className="field">
                Your answer
                <textarea
                  rows={3}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  maxLength={2000}
                  placeholder="Engineering Building II, second floor near room 2201."
                />
              </label>
              <button
                className="button primary wide"
                disabled={busy || answer.trim().length < 3}
                onClick={clarify}
              >
                {busy ? "Preparing your report..." : "Continue to review"}
                <ArrowRight size={18} />
              </button>
              <button
                className="text-button back"
                onClick={() => setStep("capture")}
              >
                <ArrowLeft size={15} />
                Back to capture
              </button>
            </>
          )}
          {step === "review" && draft && (
            <>
              <div className="capture-heading">
                <div>
                  <span className="eyebrow">Ready when you are</span>
                  <h2>Your photo. A clear plan.</h2>
                  <p>Check the details, then send it on its way.</p>
                </div>
                <span className="step-number">04</span>
              </div>
              {demo && (
                <div className="demo-label">
                  Demo Mode · This is a fictional report.
                </div>
              )}
              {editing ? (
                <div className="edit-form">
                  <label className="field">
                    Issue title
                    <input
                      value={draft.analysis.issueTitle}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          analysis: {
                            ...draft.analysis,
                            issueTitle: e.target.value,
                          },
                        })
                      }
                      maxLength={180}
                    />
                  </label>
                  <label className="field">
                    Description
                    <textarea
                      rows={4}
                      maxLength={3000}
                      value={draft.analysis.summary}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          analysis: {
                            ...draft.analysis,
                            summary: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  {(
                    [
                      "building",
                      "floor",
                      "room",
                      "locationDescription",
                    ] as const
                  ).map((field) => (
                    <label className="field" key={field}>
                      {field === "locationDescription"
                        ? "Nearby landmark / location"
                        : field}
                      <input
                        required={field === "floor" || field === "room"}
                        list={
                          field === "building"
                            ? CAMPUS_BUILDINGS_LIST
                            : undefined
                        }
                        value={draft.location[field]}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            location: {
                              ...draft.location,
                              [field]: e.target.value,
                            },
                          })
                        }
                        maxLength={250}
                      />
                    </label>
                  ))}
                  <CampusBuildingOptions />
                  <LocationPicker
                    value={draft.location.coordinates}
                    building={draft.location.building}
                    onPick={(building) =>
                      setDraft(
                        (d) =>
                          d && { ...d, location: { ...d.location, building } },
                      )
                    }
                    onLocate={(coordinates, building) =>
                      setDraft(
                        (d) =>
                          d && {
                            ...d,
                            location: {
                              ...d.location,
                              coordinates,
                              building: building ?? d.location.building,
                            },
                          },
                      )
                    }
                    onClear={() =>
                      setDraft(
                        (d) =>
                          d && {
                            ...d,
                            location: { ...d.location, coordinates: null },
                          },
                      )
                    }
                  />
                  <button
                    className="button primary"
                    disabled={
                      !hasLocation(draft.location) ||
                      !draft.analysis.issueTitle.trim() ||
                      !draft.analysis.summary.trim() ||
                      busy
                    }
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        const next = {
                          ...draft,
                          analysis: routeIncident(
                            applySafetyRules(draft.analysis),
                            draft.location,
                          ),
                        };
                        setDraft(next);
                        setEditing(false);
                        await review(next);
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Save changes
                  </button>
                </div>
              ) : (
                <ReportContent draft={draft} />
              )}
              {!editing && (
                <>
                  {duplicateNotice && (
                    <p className="muted duplicate-notice" role="status">
                      {duplicateNotice}
                    </p>
                  )}
                  {duplicate && (
                    <div className="duplicate-alert">
                      <Users size={23} />
                      <div>
                        <h3>This may already have been reported</h3>
                        <p>
                          <strong>
                            {duplicate.incident.analysis.issueTitle}
                          </strong>
                        </p>
                        <p>
                          {duplicate.incident.displayId} ·{" "}
                          {duplicate.incident.confirmations} confirmations
                        </p>
                        <p>{duplicate.assessment.reason}</p>
                        <div className="button-row">
                          <button
                            className="button secondary"
                            onClick={confirm}
                            disabled={busy}
                          >
                            Yes, I&apos;m seeing this too
                          </button>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => setDuplicate(null)}
                          >
                            Create separate report
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="review-actions">
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => {
                        setEditing(true);
                        setDuplicate(null);
                      }}
                    >
                      Edit report
                    </button>
                    <button
                      className="button primary"
                      disabled={busy || !!duplicate}
                      onClick={submit}
                    >
                      {busy ? "Working..." : "Submit Report"}
                      <Send size={17} />
                    </button>
                  </div>
                  <p className="privacy-note">
                    Saved to the CampusFix demo dashboard. No university system
                    is contacted.
                  </p>
                </>
              )}
            </>
          )}
          {step === "success" && incident && (
            <div className="success-panel">
              <div className="success-icon">
                <CheckCircle2 size={45} />
              </div>
              <span className="eyebrow">A better campus, together</span>
              <h2>
                {confirmed ? "You helped make it count." : "Issue Reported"}
              </h2>
              <p>
                {confirmed
                  ? "Thanks. Your confirmation helps CampusFix measure how many people are affected."
                  : "Your observation is now an actionable service request."}
              </p>
              <div className="success-ticket">
                <span className="eyebrow">{incident.displayId}</span>
                <h3>{incident.analysis.issueTitle}</h3>
                <p>
                  <MapPin size={16} />
                  <LocationText location={incident.location} />
                </p>
                <div>
                  <Check size={16} />
                  Routed in CampusFix to {routes[incident.department].name}
                </div>
              </div>
              <Link
                className="button primary wide"
                href={`/incidents/${incident.id}`}
              >
                Track Report
                <ArrowRight size={17} />
              </Link>
              <button
                className="button secondary wide"
                onClick={() => {
                  setStep("capture");
                  setDraft(null);
                  setIncident(null);
                  setHistory([]);
                  setError("");
                  setConfirmed(false);
                  setDuplicate(null);
                }}
              >
                Report Another Issue
              </button>
              <Link
                className="text-button dashboard-link"
                href={dashboardFor(role).href}
              >
                {dashboardFor(role).label}
                <ChevronRight size={15} />
              </Link>
              <div className="powered">
                <Sparkles size={16} />
                {demo ? "Demo Mode" : "Powered by Gemini"}
                <small>Vision → reasoning → routing → structured report</small>
              </div>
            </div>
          )}
          <ErrorMessage message={error} />
        </div>
      </div>
    </section>
  );
}
