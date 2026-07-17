import { createClient } from "@supabase/supabase-js";
import { getProfileIdFromCookieHeader } from "@/lib/current-user";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: "服务未配置数据库" }, { status: 503 });
    }

    const body = (await request.json()) as {
      reportId?: string;
      contact?: string;
      note?: string;
      clientToken?: string;
    };

    const contact = typeof body.contact === "string" ? body.contact.trim().slice(0, 100) : "";
    if (!contact) {
      return Response.json({ error: "请留下微信号或手机号，方便顾问联系您" }, { status: 400 });
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : "";
    const reportId = typeof body.reportId === "string" ? body.reportId.trim() : "";
    const clientToken =
      typeof body.clientToken === "string" ? body.clientToken.trim().slice(0, 128) : "";
    const profileId = getProfileIdFromCookieHeader(request.headers.get("cookie"));

    const { error } = await supabase.from("planner_bookings").insert({
      contact,
      ...(note ? { note } : {}),
      ...(reportId ? { report_id: reportId } : {}),
      ...(clientToken ? { client_token: clientToken } : {}),
      ...(profileId ? { user_id: profileId } : {}),
    });

    if (error) {
      console.error("planner_bookings insert:", error.message);
      return Response.json({ error: "提交失败，请稍后重试" }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "服务暂时不可用" }, { status: 500 });
  }
}
