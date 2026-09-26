"use client";
import { useState } from "react";
import {
  Mail,
  LockKeyhole,
  ScanLine,
  ArrowRight,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { credentialsSchema } from "@/lib/auth/policy";
export function AuthForm({
  configured,
  next,
  confirmationError,
}: {
  configured: boolean;
  next: string;
  confirmationError: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    confirmationError
      ? "That confirmation link has expired or is invalid. Request a new account confirmation or sign in if already verified."
      : "",
  );
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const result = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, next }),
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error);
      if (data.redirect) window.location.assign(data.redirect);
      else {
        setMessage(data.message);
        setPassword("");
        setBusy(false);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-intro">
        <div className="auth-emblem">
          <ScanLine size={42} />
        </div>
        <span className="auth-kicker">CAMPUSFIX AI</span>
        <h1>
          {mode === "login" ? "Welcome back." : "A better campus starts here."}
        </h1>
        <p>
          {mode === "login"
            ? "Sign in to report an issue and track the fix."
            : "Create your account with your NC State email."}
        </p>
      </div>
      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            disabled={busy}
          >
            Sign in
          </button>
          <button
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
            disabled={busy}
          >
            Create account
          </button>
        </div>
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <div className="auth-input">
            <Mail size={18} />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@ncsu.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </div>
          <label htmlFor="password">Password</label>
          <div className="auth-input">
            <LockKeyhole size={18} />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder={
                mode === "signup"
                  ? "At least 8 characters"
                  : "Enter your password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </div>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="auth-success" role="status">
              <CheckCircle2 size={18} />
              {message}
            </p>
          )}
          {!configured && (
            <p className="auth-setup" role="status">
              Sign-in will be available once the Supabase connection is ready.
            </p>
          )}
          <button
            className="auth-submit"
            type="submit"
            disabled={busy || !configured}
          >
            {busy ? (
              <LoaderCircle className="spin" size={19} />
            ) : (
              <Mail size={19} />
            )}
            <span>
              {busy
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in with email"
                  : "Create account"}
            </span>
            {!busy && <ArrowRight size={18} />}
          </button>
        </form>
        <p className="auth-note">
          For the NC State community.
          <br />
          Only verified <strong>@ncsu.edu</strong> accounts can sign in.
        </p>
      </section>
      <p className="auth-footer">
        See it. Report it. Fix it.
        <br />
        <span>Hackathon prototype · Not an official NC State service</span>
      </p>
    </main>
  );
}
