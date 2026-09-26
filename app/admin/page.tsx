import { requirePageUser } from "@/lib/auth/server";
import { OperationsDashboard } from "@/components/campusfix/OperationsDashboard";
export default async function Admin() {
  await requirePageUser(true);
  return <OperationsDashboard />;
}
