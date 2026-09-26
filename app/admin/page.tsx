import { requirePageUser } from "@/lib/auth/server";
import { OperationsDashboard } from "@/components/campusfix/OperationsDashboard";
export default async function Admin() {
  const user = await requirePageUser("admin");
  return (
    <OperationsDashboard viewer={{ email: user.email, role: user.role }} />
  );
}
