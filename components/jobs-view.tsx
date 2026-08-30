"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  Badge,
  FitRing,
  Button,
  Input,
  Select,
  EmptyState,
} from "@/components/ui";
import type { JobWithFit } from "@/lib/types";
import { JobDetail } from "@/components/job-detail";

export function JobsView() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobWithFit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minFit, setMinFit] = useState(0);
  const [selected, setSelected] = useState<JobWithFit | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setLoading(false);
      const highlight = searchParams.get("highlight");
      if (highlight) {
        setSelected(data.jobs?.find((j: any) => j.id === highlight) ?? null);
      }
    })();
  }, [searchParams]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (remoteOnly && !j.remote) return false;
      if (minFit > 0 && (j.fit?.overall ?? 0) < minFit) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${j.title} ${j.company} ${j.location ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, search, remoteOnly, minFit]);

  const handleStageChange = async (job: JobWithFit, stage: string) => {
    if (stage === "none") return;
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, stage }),
    });
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, appliedStage: stage as any } : j))
    );
    setSelected((prev) => (prev && prev.id === job.id ? { ...prev, appliedStage: stage as any } : prev));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Matches</h1>
          <p className="text-sm text-muted-foreground">
            Ranked by fit score against your profile.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>+ Add job</Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Search title, company, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={remoteOnly ? "remote" : "all"} onChange={(e) => setRemoteOnly(e.target.value === "remote")}>
            <option value="all">All locations</option>
            <option value="remote">Remote only</option>
          </Select>
          <Select value={String(minFit)} onChange={(e) => setMinFit(Number(e.target.value))}>
            <option value="0">Any fit score</option>
            <option value="60">60%+ fit</option>
            <option value="70">70%+ fit</option>
            <option value="80">80%+ fit</option>
          </Select>
          <div className="flex items-end">
            <span className="text-sm text-muted-foreground">
              {filtered.length} job{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No jobs match your filters"
          description="Try adjusting your search or fit score filter, or add a job manually."
          action={<Button onClick={() => setShowAdd(true)}>Add a job</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <Card
              key={job.id}
              className="cursor-pointer p-4 transition-shadow hover:shadow-md"
            >
              <button className="w-full text-left" onClick={() => setSelected(job)}>
                <div className="flex items-start gap-4">
                  <FitRing score={job.fit?.overall ?? 0} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{job.title}</h3>
                      {job.remote && <Badge color="green">Remote</Badge>}
                      {job.appliedStage && job.appliedStage !== "saved" ? (
                        <Badge color="blue">{job.appliedStage}</Badge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                      {job.salaryMin ? ` · $${(job.salaryMin / 1000).toFixed(0)}k–${(job.salaryMax ?? job.salaryMin) / 1000}k` : ""}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {job.description}
                    </p>
                  </div>
                </div>
              </button>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {job.fit?.matchedSkills.slice(0, 4).map((s) => (
                  <Badge key={s} color="green">{s}</Badge>
                ))}
                {job.fit?.missingSkills.slice(0, 3).map((s) => (
                  <Badge key={s} color="gray" className="line-through opacity-70">{s}</Badge>
                ))}
                <div className="ml-auto">
                  {job.appliedStage && job.appliedStage !== "saved" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(job)}
                    >
                      View · {job.appliedStage}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleStageChange(job, "applied")}
                    >
                      ✓ Mark applied
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <JobDetail
          job={selected}
          onClose={() => setSelected(null)}
          onStageChange={(stage) => handleStageChange(selected, stage)}
        />
      )}

      {showAdd && <AddJobDialog onClose={() => setShowAdd(false)} onAdded={() => { fetch("/api/jobs").then((r) => r.json()).then((d) => setJobs(d.jobs ?? [])); }} />}
    </div>
  );
}

function AddJobDialog({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    remote: false,
    salaryMin: "",
    salaryMax: "",
    description: "",
    skills: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        company: form.company,
        location: form.location || null,
        remote: form.remote,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        description: form.description,
        skillsRequired: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg p-6" >
        <h3 className="mb-4 text-lg font-bold">Add a job manually</h3>
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          <Input placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Location (e.g. Remote)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.remote} onChange={(e) => setForm({ ...form, remote: e.target.checked })} />
              Remote
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Salary min ($)" type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} />
            <Input placeholder="Salary max ($)" type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} />
          </div>
          <Input placeholder="Skills (comma separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          <textarea
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Job description…"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button loading={saving} onClick={submit} disabled={!form.title || !form.company || !form.description}>
              Add job
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
