"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, Badge, FitRing, Button, ProgressBar } from "@/components/ui";
import type { JobWithFit } from "@/lib/types";

interface Stats {
  totalJobs: number;
  totalApplications: number;
  saved: number;
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  rejected: number;
  avgFit: number;
  hasProfile: boolean;
  topRoles: { title: string; company: string; overall: number }[];
  skillGap: { skill: string; count: number }[];
}

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<JobWithFit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sRes, jRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/jobs"),
      ]);
      const s = await sRes.json();
      const j = await jRes.json();
      setStats(s);
      setJobs(j.jobs ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded"></div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl"></div>
          ))}
        </div>
        <div className="h-64 skeleton rounded-xl"></div>
      </div>
    );
  }

  const topJobs = jobs.slice(0, 5);
  const statCards = [
    { label: "Total jobs", value: stats?.totalJobs ?? 0, icon: "💼", color: "text-blue-500" },
    { label: "Applications", value: stats?.totalApplications ?? 0, icon: "📨", color: "text-violet-500" },
    { label: "Interviews", value: stats?.interview ?? 0, icon: "🎙️", color: "text-amber-500" },
    { label: "Offers", value: stats?.offer ?? 0, icon: "🎉", color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your job search at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs">
            <Button variant="outline" size="sm">Browse jobs</Button>
          </Link>
          <Link href="/profile">
            <Button size="sm">Edit profile</Button>
          </Link>
        </div>
      </div>

      {!stats?.hasProfile && (
        <Card className="border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Complete your profile for accurate matches</h3>
              <p className="text-sm text-muted-foreground">
                Add your skills, experience, and preferences to get precise fit scores.
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm">Set up now</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className={`text-2xl ${card.color}`}>{card.icon}</div>
            <div className="mt-2 text-3xl font-bold">{card.value}</div>
            <div className="text-sm text-muted-foreground">{card.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Top matches"
              subtitle="Highest fit score first"
              action={
                <Link href="/jobs">
                  <Button variant="ghost" size="sm">View all →</Button>
                </Link>
              }
            />
            <div className="divide-y divide-border">
              {topJobs.length === 0 && (
                <p className="p-5 text-sm text-muted-foreground">
                  No jobs yet. <Link className="text-primary underline" href="/jobs">Search jobs</Link> to get started.
                </p>
              )}
              {topJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-4 p-4">
                  <FitRing score={job.fit?.overall ?? 0} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{job.title}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {job.company} · {job.remote ? "Remote" : job.location || "—"}
                    </div>
                  </div>
                  {job.appliedStage && job.appliedStage !== "saved" ? (
                    <Badge color="green">{job.appliedStage}</Badge>
                  ) : (
                    <Link href={`/jobs?highlight=${job.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Average fit score"
              subtitle="Across your matched jobs"
            />
            <div className="px-5 pb-5">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-primary">
                  {stats?.avgFit ?? 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Higher is better — upskill on your gaps below to improve matches.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Skill gaps" subtitle="Most in-demand skills you lack" />
            <div className="space-y-3 p-5 pt-0">
              {stats?.skillGap.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  You&apos;re on top of the most-demanded skills. 🎉
                </p>
              )}
              {stats?.skillGap.slice(0, 6).map((gap) => (
                <div key={gap.skill}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize">{gap.skill}</span>
                    <span className="text-muted-foreground">
                      {gap.count} jobs
                    </span>
                  </div>
                  <ProgressBar
                    value={(gap.count / Math.max(stats?.skillGap[0]?.count ?? 1, 1)) * 100}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
