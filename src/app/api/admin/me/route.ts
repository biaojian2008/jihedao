import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
