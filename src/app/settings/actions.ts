"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type SettingsActionState = {
  ok: boolean;
  message: string;
};

const channelSchema = z.object({
  platform: z.enum(["telegram", "line"]),
  external_user_id: z.string().min(2),
  label: z.string().optional(),
});

export async function saveNotificationChannelAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await requireUser();
  const supabase = getSupabaseAdmin();

  if (!supabase || user.isDemo) {
    return { ok: false, message: "請先設定 Supabase service role key，才能儲存通知管道。" };
  }

  const parsed = channelSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: "請確認平台與外部使用者 ID。" };
  }

  const { error } = await supabase.from("notification_channels").upsert(
    {
      user_id: user.id,
      platform: parsed.data.platform,
      external_user_id: parsed.data.external_user_id.trim(),
      label: parsed.data.label || parsed.data.platform,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "platform,external_user_id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true, message: "通知管道已儲存。" };
}
