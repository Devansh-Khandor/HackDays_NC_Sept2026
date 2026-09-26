import { requirePageUser } from "@/lib/auth/server";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  ScanLine,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { ReportWorkflow } from "@/components/campusfix/ReportWorkflow";
import { dashboardFor } from "@/components/campusfix/Shared";
export default async function Home() {
  const user = await requirePageUser();
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="red-rule" />
            Small observations. Real impact.
          </div>
          <h1>
            See it. Report it.
            <br />
            <span>Fix it.</span>
          </h1>
          <p>
            Spot something broken on campus? Take a photo.
            <br className="desktop-break" /> Gemini understands the problem. We
            help get it to the right people.
          </p>
          <div className="hero-actions">
            <a href="#report" className="button primary">
              Report an Issue
              <ArrowDown size={17} />
            </a>
            <Link
              href={dashboardFor(user.role).href}
              className="hero-secondary"
            >
              {dashboardFor(user.role).label}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-powered">
            <Sparkles size={16} />
            <span>Powered by Google Gemini</span>
            <span className="hero-divider" />
            Built for NC State MLH Hack Day
          </div>
        </div>
        <div className="hero-aside">
          <div className="aside-topline">
            <span>FROM OBSERVATION TO ACTION</span>
            <span>01 — 03</span>
          </div>
          <div className="hero-flow">
            <div className="hero-flow-item">
              <div className="flow-icon">
                <Camera size={23} />
              </div>
              <div>
                <span>01 / CAPTURE</span>
                <h3>Show us the problem.</h3>
                <p>A photo. A few words. That&apos;s it.</p>
              </div>
            </div>
            <div className="hero-flow-item">
              <div className="flow-icon red-icon">
                <ScanLine size={23} />
              </div>
              <div>
                <span>02 / UNDERSTAND</span>
                <h3>Let Gemini connect the dots.</h3>
                <p>Evidence, urgency, and the right team.</p>
              </div>
            </div>
            <div className="hero-flow-item">
              <div className="flow-icon">
                <ClipboardCheck size={23} />
              </div>
              <div>
                <span>03 / TAKE ACTION</span>
                <h3>You review. We route.</h3>
                <p>One clear report. Ready to be resolved.</p>
              </div>
            </div>
          </div>
          <div className="aside-bottom">
            <span className="live-dot" />
            Human approved. Always.
          </div>
        </div>
      </section>
      <ReportWorkflow role={user.role} />
      <section className="bottom-note">
        <Shield />
        <div>
          <h3>Good neighbors notice. Great campuses respond.</h3>
          <p>
            From a flickering light to a leaking fountain, every report helps.
          </p>
        </div>
        <span>MADE FOR CAMPUS LIFE</span>
      </section>
    </main>
  );
}
function Shield() {
  return (
    <div className="bottom-mark">
      <ClipboardCheck size={25} />
    </div>
  );
}
