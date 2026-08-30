"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, Badge, EmptyState, Button } from "@/components/ui";
import { STAGES, type Stage } from "@/lib/types";

interface JobBrief {
  id: string;
  title: string;
  company: string;
  remote: boolean;
  location: string | null;
}

interface AppItem {
  id: string;
  jobId: string;
  stage: Stage;
  notes: string | null;
  updatedAt: string;
}

const STAGE_META: Record<Stage, { label: string; color: string; dot: string }> = {
  saved: { label: "Saved", color: "bg-gray-400", dot: "bg-gray-400" },
  applied: { label: "Applied", color: "bg-blue-500", dot: "bg-blue-500" },
  screening: { label: "Screening", color: "bg-amber-500", dot: "bg-amber-500" },
  interview: { label: "Interview", color: "bg-violet-500", dot: "bg-violet-500" },
  offer: { label: "Offer", color: "bg-emerald-500", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", color: "bg-red-500", dot: "bg-red-500" },
};

export function ApplicationsView() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [jobs, setJobs] = useState<Record<string, JobBrief>>({});
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  const load = useCallback(async () => {
    const [appRes, jobRes] = await Promise.all([
      fetch("/api/applications"),
      fetch("/api/jobs"),
    ]);
    const appData = await appRes.json();
    const jobData = await jobRes.json();
    const jobMap: Record<string, JobBrief> = {};
    for (const j of jobData.jobs ?? []) {
      jobMap[j.id] = j;
    }
    setApps(appData.applications ?? []);
    setJobs(jobMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const moveTo = async (jobId: string, stage: Stage) => {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, stage }),
    });
    setApps((prev) =>
      prev.map((a) =>
        a.jobId === jobId
          ? { ...a, stage, updatedAt: new Date().toISOString() }
          : a
      )
    );
  };

  const onDrop = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    e.stopPropagation();
    const jobId = e.dataTransfer.getData("text/jobId");
    setDragOver(null);
    if (jobId) moveTo(jobId, stage);
  };

  // Ensure every job is represented on the board
  const renderedApps = apps.filter((a) => jobs[a.jobId]);
  const jobIdsOnBoard = new Set(renderedApps.map((a) => a.jobId));

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-96 skeleton rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (Object.keys(jobs).length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No jobs to track yet"
        description="Add or find jobs first, then move them through your pipeline."
        action={
          <Link href="/jobs">
            <Button>Find jobs</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-sm text-muted-foreground">
          Drag jobs between stages to update your pipeline.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((stage) => {
          const stageApps = renderedApps.filter((a) => a.stage === stage);
          const meta = STAGE_META[stage];
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage);
              }}
              onDragLeave={() => setDragOver((d) => (d === stage ? null : d))}
              onDrop={(e) => onDrop(e, stage)}
              className={`rounded-xl border border-border bg-muted/50 p-2 ${
                dragOver === stage ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between px-1 py-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                <span className="text-xs text-muted-foreground">{stageApps.length}</span>
              </div>
              <div className="mt-1 space-y-2">
                {stageApps.map((app) => {
                  const job = jobs[app.jobId];
                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/jobId", app.jobId)
                      }
                      className="cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm active:cursor-grabbing"
                    >
                      <div className="text-sm font-medium leading-tight">
                        {job.title}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {job.company}
                      </div>
                      {job.remote && (
                        <div className="mt-1">
                          <Badge color="green">Remote</Badge>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        {STAGES.map((s) => (
                          <button
                            key={s}
                            onClick={() => moveTo(app.jobId, s)}
                            title={STAGE_META[s].label}
                            className={`h-1.5 flex-1 rounded-full ${
                              s === app.stage ? meta.color : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {stageApps.length === 0 && (
                  <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Jobs without any application yet */}
      {Object.keys(jobs).filter((id) => !jobIdsOnBoard.has(id)).length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Unapplied jobs — click to save to your pipeline
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(jobs)
              .filter((j) => !jobIdsOnBoard.has(j.id))
              .map((job) => (
                <button
                  key={job.id}
                  onClick={() => moveTo(job.id, "saved")}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  + {job.title} · {job.company}
                </button>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
