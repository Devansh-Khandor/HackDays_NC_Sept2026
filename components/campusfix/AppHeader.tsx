"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ScanLine, ArrowUpRight } from "lucide-react";
import { InstallAppButton } from "@/components/campusfix/InstallAppButton";
import { NotificationCenter } from "@/components/campusfix/NotificationCenter";
import type { Role } from "@/lib/auth/policy";
const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  employee: "Employee",
  student: "Reporter",
};
export function AppHeader({ role }: { role: Role }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <span className="brand-mark">
          <ScanLine size={23} />
        </span>
        <span>
          CampusFix<span className="brand-ai">AI</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        {role === "employee" && (
          <Link
            className={path.startsWith("/work") ? "active" : ""}
            href="/work"
          >
            My assignments
          </Link>
        )}
        <Link
          className={path === "/" || path === "/report" ? "active" : ""}
          href="/"
        >
          Report an issue
        </Link>
        <Link
          className={path.startsWith("/my-reports") ? "active" : ""}
          href="/my-reports"
        >
          My reports
        </Link>
        {role === "admin" && (
          <Link
            className={path.startsWith("/admin") ? "active" : ""}
            href="/admin"
          >
            Operations <ArrowUpRight size={15} />
          </Link>
        )}
        <button
          className="text-button"
          onClick={async () => {
            const r = await fetch("/api/auth/logout", { method: "POST" });
            if (r.ok) {
              router.replace("/login");
              router.refresh();
            }
          }}
        >
          Sign out
        </button>
      </nav>
      <span className="header-note">
        <span className="live-dot" />
        {roleLabels[role]}
      </span>
      <NotificationCenter />
      <InstallAppButton />
    </header>
  );
}
