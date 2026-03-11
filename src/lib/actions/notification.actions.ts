"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AuthError, ValidationError, DatabaseError } from "@/lib/errors";

const MarkAsReadSchema = z.object({
  notificationId: z.string().uuid(),
});

const MarkAllAsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1, "Geen notificaties opgegeven"),
});

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function markNotificationAsRead(input: z.input<typeof MarkAsReadSchema>): Promise<ActionResult> {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthError("Niet ingelogd");
  }

  // Validate
  const parsed = MarkAsReadSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new ValidationError(firstIssue?.message ?? "Ongeldig notificatie ID");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", parsed.data.notificationId);

  if (error) {
    throw new DatabaseError(`Notificatie bijwerken mislukt: ${error.message}`);
  }

  return { success: true };
}

export async function markAllNotificationsAsRead(input: z.input<typeof MarkAllAsReadSchema>): Promise<ActionResult> {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new AuthError("Niet ingelogd");
  }

  // Validate
  const parsed = MarkAllAsReadSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new ValidationError(firstIssue?.message ?? "Ongeldige notificatie IDs");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .in("id", parsed.data.notificationIds);

  if (error) {
    throw new DatabaseError(`Notificaties bijwerken mislukt: ${error.message}`);
  }

  return { success: true };
}
