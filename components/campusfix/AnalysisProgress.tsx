"use client";
import { useEffect, useState } from "react";
import { ScanLine, Check, Sparkles } from "lucide-react";
export function AnalysisProgress({ demo }: { demo: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 1700);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="analysis-progress" role="status" aria-live="polite">
      <div className="scan-orbit">
        <ScanLine size={48} />
        <Sparkles size={20} />
      </div>
      <span className="eyebrow">
        {demo ? "Loading a fictional scenario" : "Powered by Gemini"}
      </span>
      <h2>
        {demo ? "Preparing your demo..." : "Gemini is inspecting the issue..."}
      </h2>
      <p>Turning what you see into a clear, actionable report.</p>
      <ol>
        {[
          "Examining the image and context",
          "Identifying the issue",
          "Checking possible hazards",
          "Determining next steps",
        ].map((s, i) => (
          <li key={s} className={i <= step ? "current" : ""}>
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <small>
        Progress labels illustrate the workflow; they are not live model
        reasoning.
      </small>
    </div>
  );
}
