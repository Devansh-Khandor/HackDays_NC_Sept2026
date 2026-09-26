import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>We couldn&apos;t find that page.</h1>
      <Link href="/" className="button primary">
        Back to CampusFix
      </Link>
    </main>
  );
}
