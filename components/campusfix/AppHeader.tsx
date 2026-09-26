"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, ArrowUpRight } from "lucide-react";
import { InstallAppButton } from "@/components/campusfix/InstallAppButton";
export function AppHeader() {
  const path = usePathname();
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
        <Link
          className={path === "/" || path === "/report" ? "active" : ""}
          href="/"
        >
          Report an issue
        </Link>
        <Link
          className={path.startsWith("/admin") ? "active" : ""}
          href="/admin"
        >
          Operations <ArrowUpRight size={15} />
        </Link>
      </nav>
      <span className="header-note">
        <span className="live-dot" />
        Built for a better campus
      </span>
      <InstallAppButton />
    </header>
  );
}
