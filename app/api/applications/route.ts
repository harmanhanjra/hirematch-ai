import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoUser } from "@/lib/auth";
import { listApplications, setApplicationStage } from "@/lib/repo";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  jobId: z.string(),
  stage: z.enum([
    "saved",
    "applied",
    "screening",
    "interview",
    "offer",
    "rejected",
  ]),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const user = await ensureDemoUser();
  const applications = listApplications(user.id);
  return NextResponse.json({ applications });
}

export async function PATCH(request: Request) {
  const user = await ensureDemoUser();
  const raw = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const app = setApplicationStage(
    user.id,
    parsed.data.jobId,
    parsed.data.stage,
    parsed.data.notes
  );
  return NextResponse.json({ application: app });
}
