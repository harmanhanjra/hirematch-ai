import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoUser, getCurrentUser } from "@/lib/auth";
import {
  createJob,
  getProfile,
  listJobs,
  applicationsForJobIds,
} from "@/lib/repo";
import { computeFit } from "@/lib/matching";
import { seedJobs } from "@/lib/seed";
import type { JobWithFit } from "@/lib/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional().nullable(),
  remote: z.boolean().optional(),
  url: z.string().url().optional().nullable(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  description: z.string().min(1),
  skillsRequired: z.array(z.string()).optional(),
  source: z.string().optional(),
  postedAt: z.string().optional(),
});

export async function GET() {
  const user = await ensureDemoUser();
  const profile = getProfile(user.id);
  const jobs = listJobs(user.id);

  // Seed jobs on first access if empty
  if (jobs.length === 0) {
    seedJobs(user.id);
  }

  const fresh = listJobs(user.id);
  const appMap = applicationsForJobIds(
    user.id,
    fresh.map((j) => j.id)
  );

  const withFit: JobWithFit[] = fresh.map((job) => {
    const fit = profile ? computeFit(profile, job) : undefined;
    return {
      ...job,
      fit,
      appliedStage: appMap.get(job.id)?.stage ?? null,
    };
  });

  withFit.sort((a, b) => (b.fit?.overall ?? 0) - (a.fit?.overall ?? 0));

  return NextResponse.json({ jobs: withFit, hasProfile: Boolean(profile) });
}

export async function POST(request: Request) {
  const user = await ensureDemoUser();
  const raw = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid job", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const job = createJob({
    userId: user.id,
    title: parsed.data.title,
    company: parsed.data.company,
    location: parsed.data.location ?? null,
    remote: parsed.data.remote ?? false,
    url: parsed.data.url ?? null,
    salaryMin: parsed.data.salaryMin ?? null,
    salaryMax: parsed.data.salaryMax ?? null,
    description: parsed.data.description,
    skillsRequired: parsed.data.skillsRequired ?? [],
    source: parsed.data.source ?? "manual",
    postedAt: parsed.data.postedAt ?? null,
  });

  const profile = getProfile(user.id);
  const fit = profile ? computeFit(profile, job) : undefined;
  return NextResponse.json({ job: { ...job, fit } });
}
