"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  Button,
  Badge,
  Select,
  Input,
  Label,
  Textarea,
  EmptyState,
} from "@/components/ui";
import type { Job } from "@/lib/types";

interface Doc {
  id: string;
  type: "cv" | "cover_letter";
  title: string;
  content: string;
  updatedAt: string;
}

export function DocumentsView() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genJob, setGenJob] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  const load = async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocs(data.documents ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []));
  }, []);

  const generateResume = async () => {
    setGenerating(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generateResume: true, save: true }),
    });
    await res.json();
    await load();
    setGenerating(false);
    setShowGenerate(false);
  };

  const generateCover = async (jobId: string) => {
    setGenerating(true);
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, save: true }),
    });
    const data = await res.json();
    if (!data.document) {
      alert("Set up your profile first.");
    }
    await load();
    setGenerating(false);
    setShowGenerate(false);
    setGenJob(null);
  };

  const saveDoc = async (id: string, title: string, content: string) => {
    await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, content }),
    });
    await load();
  };

  const deleteDoc = async (id: string) => {
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 skeleton rounded-xl" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Generate and manage your resume and cover letters.
          </p>
        </div>
        <Button onClick={() => setShowGenerate(true)} loading={generating}>
          ✨ Generate
        </Button>
      </div>

      {docs.length === 0 && (
        <EmptyState
          icon="📄"
          title="No documents yet"
          description="Generate a resume from your profile, or a tailored cover letter for a job."
          action={<Button onClick={() => setShowGenerate(true)}>Generate the first document</Button>}
        />
      )}

      {docs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardHeader
                title={doc.title}
                subtitle={
                  <div className="flex items-center gap-2">
                    <Badge color={doc.type === "cv" ? "primary" : "blue"}>
                      {doc.type === "cv" ? "Resume" : "Cover letter"}
                    </Badge>
                    <span className="text-xs">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                }
                action={
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(doc)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => deleteDoc(doc.id)}
                    >
                      Delete
                    </Button>
                  </div>
                }
              />
              <div className="px-5 pb-5">
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                  {doc.content}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showGenerate && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowGenerate(false)}
        >
          <Card
            className="w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold">Generate a document</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={generateResume}
                loading={generating && !genJob}
              >
                📋 Resume from my profile
              </Button>
              <div className="text-sm text-muted-foreground">— or —</div>
              <div>
                <Label>Cover letter for job</Label>
                <Select
                  value={genJob ?? ""}
                  onChange={(e) => setGenJob(e.target.value || null)}
                >
                  <option value="">Select a job…</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} @ {j.company}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!genJob}
                loading={generating && !!genJob}
                onClick={() => genJob && generateCover(genJob)}
              >
                ✉️ Cover letter for selected job
              </Button>
            </div>
          </Card>
        </div>
      )}

      {editing && (
        <EditDialog
          doc={editing}
          onSave={(title, content) => saveDoc(editing.id, title, content)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EditDialog({
  doc,
  onSave,
  onClose,
}: {
  doc: Doc;
  onSave: (title: string, content: string) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [saving, setSaving] = useState(false);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <Card
        className="flex max-h-[90vh] w-full max-w-2xl flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-64"
            />
            <Badge color={doc.type === "cv" ? "primary" : "blue"}>
              {doc.type === "cv" ? "Resume" : "Cover letter"}
            </Badge>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            ✕
          </button>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[50vh] flex-1 resize-none rounded-none border-0 focus-visible:ring-0"
        />
        <div className="flex justify-end gap-2 p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={saving}
            onClick={() => {
              setSaving(true);
              onSave(title, content).then(onClose);
            }}
          >
            Save changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
