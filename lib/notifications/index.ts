import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import { databaseError } from "@/lib/incidents/supabaseRepository";
export const notificationSchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid().nullable(),
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof notificationSchema>;
// Row-level security limits results to the caller's own (or, for admins, admin) notifications.
export async function listNotifications(limit = 30) {
  await requireUser();
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("notifications")
    .select("id,incident_id,kind,title,body,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) databaseError(error);
  const { count, error: countError } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (countError) databaseError(countError);
  return {
    unread: count ?? 0,
    items: (data ?? []).map((n) =>
      notificationSchema.parse({
        id: n.id,
        incidentId: n.incident_id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        read: n.read_at !== null,
        createdAt: n.created_at,
      }),
    ),
  };
}
export async function markNotificationsRead(ids: string[] | null) {
  await requireUser();
  const db = await createSupabaseServerClient();
  const { error } = await db.rpc("mark_notifications_read", { p_ids: ids });
  if (error) databaseError(error);
}
