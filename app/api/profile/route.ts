import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoUser } from "@/lib/auth";
import { getProfile, saveProfile } from "@/lib/repo";

export const dynamic = "force-dynamic";

const schema = z.object({
  headline: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  remotePreference: z
    .enum(["remote", "hybrid", "onsite", "any"])
    .optional()
    .nullable(),
  yearsExperience: z.number().optional().nullable(),
  skills: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  resumeText: z.string().optional().nullable(),
});

export async function GET() {
  const user = await ensureDemoUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = getProfile(user.id);
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const user = await ensureDemoUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const profile = saveProfile(user.id, parsed.data);
  return NextResponse.json({ profile });
}
