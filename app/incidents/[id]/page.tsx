import { requirePageUser } from "@/lib/auth/server";
import { IncidentDetail } from "@/components/campusfix/IncidentDetail";
export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;
  return (
    <IncidentDetail id={id} viewer={{ email: user.email, role: user.role }} />
  );
}
