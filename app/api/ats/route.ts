import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoUser } from "@/lib/auth";
import { getJob, getProfile } from "@/lib/repo";
import { analyzeResume } from "@/lib/ats";

export const dynamic = "force-dynamic";

const schema = z.object({
  jobId: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await ensureDemoUser();
  const parsed = schema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const profile = getProfile(user.id);
  const job = getJob(parsed.data.jobId);

  if (!profile || !job || job.userId !== user.id) {
    return NextResponse.json({ error: "Profile or job not found" }, { status: 404 });
  }

  if (!profile.resumeText?.trim()) {
    return NextResponse.json(
      { error: "Add resume text in your Profile before running ATS analysis." },
      { status: 400 }
    );
  }

  return NextResponse.json({ analysis: analyzeResume(profile, job) });
}
