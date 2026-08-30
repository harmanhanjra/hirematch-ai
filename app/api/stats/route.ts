import { NextResponse } from "next/server";
import { ensureDemoUser } from "@/lib/auth";
import { getProfile, listJobs, listApplications } from "@/lib/repo";
import { computeFit } from "@/lib/matching";
import { STAGES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await ensureDemoUser();
  const profile = getProfile(user.id);
  const jobs = listJobs(user.id);
  const applications = listApplications(user.id);

  const appMap = new Map(applications.map((a) => [a.jobId, a]));

  const stageCounts: Record<string, number> = {};
  for (const s of STAGES) stageCounts[s] = 0;
  for (const app of applications) stageCounts[app.stage] = (stageCounts[app.stage] ?? 0) + 1;

  const scored = jobs
    .map((job) => {
      const fit = profile ? computeFit(profile, job) : null;
      const app = appMap.get(job.id);
      return { job, fit, stage: app?.stage ?? null };
    });

  const scoredJobs = scored.filter((s) => s.fit);
  const avgFit =
    scoredJobs.length === 0
      ? 0
      : Math.round(
          scoredJobs.reduce((sum, s) => sum + (s.fit?.overall ?? 0), 0) /
            scoredJobs.length
        );

  const topRolesFits = scoredJobs
    .filter((s) => s.fit)
    .sort((a, b) => (b.fit?.overall ?? 0) - (a.fit?.overall ?? 0))
    .slice(0, 5)
    .map((s) => ({
      title: s.job.title,
      company: s.job.company,
      overall: s.fit!.overall,
    }));

  // Skill gap analysis
  const skillGap = profile
    ? (() => {
        const required = new Map<string, number>();
        for (const job of jobs) {
          for (const skill of job.skillsRequired) {
            const k = skill.toLowerCase();
            required.set(k, (required.get(k) ?? 0) + 1);
          }
        }
        const have = new Set(profile.skills.map((s) => s.toLowerCase()));
        const topMissing = [...required.entries()]
          .sort((a, b) => b[1] - a[1])
          .filter(([skill]) => !have.has(skill))
          .slice(0, 8)
          .map(([skill, count]) => ({ skill, count }));
        return topMissing;
      })()
    : [];

  return NextResponse.json({
    totalJobs: jobs.length,
    totalApplications: applications.filter((a) => a.stage !== "saved").length,
    saved: stageCounts["saved"] ?? 0,
    applied: stageCounts["applied"] ?? 0,
    screening: stageCounts["screening"] ?? 0,
    interview: stageCounts["interview"] ?? 0,
    offer: stageCounts["offer"] ?? 0,
    rejected: stageCounts["rejected"] ?? 0,
    avgFit,
    hasProfile: Boolean(profile),
    topRoles: topRolesFits,
    skillGap,
    stageCounts,
  });
}
