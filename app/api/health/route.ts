import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    db.prepare("SELECT 1").get();
    return NextResponse.json({
      ok: true,
      service: "hirematch-ai",
      database: "ok",
      aiConfigured: Boolean(process.env.NVIDIA_API_KEY),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "hirematch-ai",
        database: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
