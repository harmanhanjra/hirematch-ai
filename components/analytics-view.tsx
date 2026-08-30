"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, EmptyState, FitRing } from "@/components/ui";
import type { JobWithFit } from "@/lib/types";

interface Stats {
  totalJobs: number;
  totalApplications: number;
  avgFit: number;
  hasProfile: boolean;
  saved: number;
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  rejected: number;
  stageCounts: Record<string, number>;
  topRoles: { title: string; company: string; overall: number }[];
  skillGap: { skill: string; count: number }[];
}

interface JobData {
  jobs: JobWithFit[];
  hasProfile: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  saved: "#9ca3af",
  applied: "#3b82f6",
  screening: "#f59e0b",
  interview: "#8b5cf6",
  offer: "#10b981",
  rejected: "#ef4444",
};

export function AnalyticsView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sRes, jRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/jobs"),
      ]);
      setStats(await sRes.json());
      setJobData(await jRes.json());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-40 skeleton rounded-xl" />
          <div className="h-40 skeleton rounded-xl" />
          <div className="h-40 skeleton rounded-xl" />
        </div>
        <div className="h-72 skeleton rounded-xl" />
      </div>
    );
  }

  if (!stats || stats.totalJobs === 0) {
    return (
      <EmptyState
        icon="📈"
        title="No data to analyze yet"
        description="Add some jobs and track applications to unlock insights."
      />
    );
  }

  const stages = ["saved", "applied", "screening", "interview", "offer", "rejected"];
  const maxCount = Math.max(
    1,
    ...stages.map((s) => stats.stageCounts?.[s] ?? 0)
  );

  const avgFit = stats?.avgFit ?? 0;
  const conversionToInterview =
    stats.totalApplications > 0
      ? Math.round((stats.interview / stats.totalApplications) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your progress and close your skill gaps.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Jobs tracked", value: stats.totalJobs, icon: "💼" },
          { label: "Applications", value: stats.totalApplications, icon: "📨" },
          { label: "Interviews", value: stats.interview, icon: "🎙️" },
          { label: "Offers", value: stats.offer, icon: "🎉" },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <div className="text-2xl">{k.icon}</div>
            <div className="mt-2 text-3xl font-bold">{k.value}</div>
            <div className="text-sm text-muted-foreground">{k.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline funnel */}
        <Card>
          <CardHeader
            title="Pipeline funnel"
            subtitle="Applications by stage"
          />
          <div className="space-y-4 p-5 pt-0">
            {stages.map((stage) => {
              const count = stats.stageCounts?.[stage] ?? 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize">{stage}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: STAGE_COLORS[stage],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Metrics */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <FitRing score={avgFit} size={64} />
              <div>
                <div className="text-lg font-semibold">Average fit score</div>
                <p className="text-sm text-muted-foreground">
                  Across all matched jobs
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-violet-500">
                  {conversionToInterview}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Applications → Interview
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-500">
                  {stats.totalApplications > 0
                    ? Math.round((stats.offer / stats.totalApplications) * 100)
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">
                  Applications → Offer
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill gaps */}
        <Card>
          <CardHeader
            title="Skill gaps"
            subtitle="Most in-demand skills you haven't listed"
          />
          <div className="p-5 pt-0">
            {stats.skillGap.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No gaps detected — you&apos;re on top of the market. 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {stats.skillGap.slice(0, 8).map((gap) => {
                  const max = stats.skillGap[0].count;
                  return (
                    <div key={gap.skill}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="capitalize">{gap.skill}</span>
                        <span className="text-muted-foreground">
                          {gap.count} jobs
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${(gap.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Top roles */}
        <Card>
          <CardHeader
            title="Top matches"
            subtitle="Your best-fit roles by score"
          />
          <div className="space-y-2 p-5 pt-0">
            {(jobData?.jobs ?? [])
              .slice(0, 6)
              .map((job, idx) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {job.title}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {job.company}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {job.fit?.overall ?? 0}
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
