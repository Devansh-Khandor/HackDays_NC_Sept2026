import { requirePageUser } from "@/lib/auth/server";
import { ReportWorkflow } from "@/components/campusfix/ReportWorkflow";
export default async function ReportPage() {
  const user = await requirePageUser();
  return (
    <main className="home standalone-report">
      <ReportWorkflow role={user.role} />
    </main>
  );
}
