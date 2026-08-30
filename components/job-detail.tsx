"use client";

import { useState } from "react";
import {
  Card,
  Badge,
  FitRing,
  Button,
  Select,
  ProgressBar,
} from "@/components/ui";
import type { JobWithFit, Stage } from "@/lib/types";

const STAGES: { value: Stage; label: string }[] = [
  { value: "saved", label: "Save" },
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

export function JobDetail({
  job,
  onClose,
  onStageChange,
}: {
  job: JobWithFit;
  onClose: () => void;
  onStageChange: (stage: Stage) => void;
}) {
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [stage, setStage] = useState<Stage>(job.appliedStage ?? "saved");

  const generateCover = async () => {
    setGeneratingCover(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, save: false }),
    });
    const data = await res.json();
    setCoverLetter(data.content ?? "");
    setGeneratingCover(false);
  };

  const changeStage = (s: string) => {
    if (s === stage) return;
    setStage(s as Stage);
    onStageChange(s as Stage);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6" >
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-4">
            {job.fit && <FitRing score={job.fit.overall} size={60} />}
            <div>
              <h2 className="text-xl font-bold">{job.title}</h2>
              <p className="text-sm text-muted-foreground">
                {job.company} · {job.remote ? "Remote" : job.location || "—"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="space-y-5 pt-4" onClick={(e) => e.stopPropagation()}>
          {job.fit && (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Skills", value: job.fit.skills },
                { label: "Experience", value: job.fit.experience },
                { label: "Location", value: job.fit.location },
                { label: "Salary", value: job.fit.salary },
              ].map((m) => (
                <div key={m.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span>{m.value}%</span>
                  </div>
                  <ProgressBar value={m.value} />
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Description</h3>
            <p className="whitespace-pre-wrap text-sm">{job.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.skillsRequired.map((s) => (
              <Badge key={s} color={job.fit?.matchedSkills.includes(s) ? "green" : "gray"}>
                {s}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <label className="text-sm text-muted-foreground">Move to:</label>
            <Select
              className="w-auto"
              value={stage}
              onChange={(e) => changeStage(e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" loading={generatingCover} onClick={generateCover}>
                ✨ Generate cover letter
              </Button>
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                >
                  Open posting ↗
                </a>
              )}
            </div>
          </div>

          {coverLetter && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Generated cover letter</h3>
                <Button size="sm" variant="ghost" onClick={() => setCoverLetter(null)}>
                  Close
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm">{coverLetter}</pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
