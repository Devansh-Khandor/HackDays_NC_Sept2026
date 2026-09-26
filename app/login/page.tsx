import { AuthForm } from "@/components/campusfix/AuthForm";
import { supabaseConfig } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/auth/policy";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      configured={!!supabaseConfig()}
      next={safeNextPath(params.next)}
      confirmationError={params.error === "confirmation"}
    />
  );
}
