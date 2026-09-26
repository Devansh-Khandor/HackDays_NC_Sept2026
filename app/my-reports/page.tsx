import Link from "next/link";
import { requirePageUser } from "@/lib/auth/server";
import { getRepository } from "@/lib/incidents";
export default async function MyReports() {
  await requirePageUser();
  const reports = await (await getRepository()).getIncidents();
  return (
    <main className="detail-page">
      <span className="eyebrow">Track your impact</span>
      <h1>My reports</h1>
      <p>Issues you reported or confirmed.</p>
      <Link className="button primary" href="/report">
        Report an issue
      </Link>
      <div className="my-report-list">
        {reports.length ? (
          reports.map((report) => (
            <Link
              key={report.id}
              href={`/incidents/${report.id}`}
              className="my-report-card"
            >
              <small>{report.displayId}</small>
              <h2>{report.analysis.issueTitle}</h2>
              <p>
                {report.status.replaceAll("_", " ")} ·{" "}
                {report.location.building}
              </p>
            </Link>
          ))
        ) : (
          <p>No reports yet. Your submitted reports will appear here.</p>
        )}
      </div>
    </main>
  );
}
