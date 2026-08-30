"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  Badge,
} from "@/components/ui";

interface Profile {
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  remotePreference?: string | null;
  yearsExperience?: number | null;
  skills?: string[];
  targetRoles?: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
  resumeText?: string | null;
}

const SUGGESTED_SKILLS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "SQL",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "Go",
  "Rust",
  "GraphQL",
  "Testing",
  "CSS",
];

const SUGGESTED_ROLES = [
  "Frontend Engineer",
  "Full Stack Engineer",
  "Backend Engineer",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Data Engineer",
];

export function ProfileView() {
  const [profile, setProfile] = useState<Profile>({ skills: [], targetRoles: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [roleInput, setRoleInput] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (data.profile) {
      setProfile({
        skills: [],
        targetRoles: [],
        ...data.profile,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addSkill = (skillInput: string) => {
    const s = skillInput.trim();
    if (!s) return;
    addSkillToProfile(s);
  };

  const addSkillToProfile = (s: string) => {
    if (profile.skills!.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    setProfile({ ...profile, skills: [...profile.skills!, s] });
  };

  const removeSkill = (s: string) => {
    setProfile({ ...profile, skills: profile.skills!.filter((x) => x !== s) });
  };

  const addRole = (r: string) => {
    const t = r.trim();
    if (!t) return;
    if (profile.targetRoles!.includes(t)) return;
    setProfile({ ...profile, targetRoles: [...profile.targetRoles!, t] });
  };

  const removeRole = (r: string) => {
    setProfile({
      ...profile,
      targetRoles: profile.targetRoles!.filter((x) => x !== r),
    });
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="h-[500px] skeleton rounded-xl" />
      </div>
    );
  }

  const numFields = [
    profile.headline,
    profile.summary,
    profile.location,
    profile.skills?.length ? 1 : 0,
    profile.targetRoles?.length ? 1 : 0,
  ].filter(Boolean).length;
  const completion = Math.min(
    100,
    20 +
      (profile.skills?.length ?? 0) * 4 +
      (profile.targetRoles?.length ?? 0) * 4 +
      numFields * 5
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            This powers your match scores and personalization.
          </p>
        </div>
        <div className="text-sm">
          <span className="font-semibold text-emerald-600">
            {completion}% complete
          </span>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Headline</Label>
            <Input
              value={profile.headline ?? ""}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              placeholder="Senior Frontend Engineer"
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={profile.location ?? ""}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              placeholder="Remote, USA"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label>Professional summary</Label>
          <Textarea
            value={profile.summary ?? ""}
            onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
            placeholder="A short summary of who you are and what you do…"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Years of experience</Label>
            <Input
              type="number"
              value={profile.yearsExperience ?? ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  yearsExperience:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="5"
            />
          </div>
          <div>
            <Label>Work preference</Label>
            <Select
              value={profile.remotePreference ?? "any"}
              onChange={(e) =>
                setProfile({ ...profile, remotePreference: e.target.value })
              }
            >
              <option value="any">Any</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </Select>
          </div>
          <div>
            <Label>Salary range (USD/yr)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={profile.salaryMin ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    salaryMin:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="120000"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                value={profile.salaryMax ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    salaryMax:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="180000"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <CardHeader
          title="Skills"
          subtitle="Add the technologies and tools you know"
          className="p-0 pb-4"
        />
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill(skillInput);
                setSkillInput("");
              }
            }}
            placeholder="Type a skill and press Enter"
          />
          <Button
            variant="secondary"
            onClick={() => {
              addSkill(skillInput);
              setSkillInput("");
            }}
          >
            Add
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(profile.skills ?? []).map((s) => (
            <Badge key={s} color="primary">
              {s}
              <button
                onClick={() => removeSkill(s)}
                className="ml-1 hover:text-primary"
                aria-label={`Remove ${s}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_SKILLS.filter(
            (s) =>
              !(profile.skills ?? []).some(
                (x) => x.toLowerCase() === s.toLowerCase()
              )
          ).map((s) => (
            <button
              key={s}
              onClick={() => addSkillToProfile(s)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              + {s}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <CardHeader
          title="Target roles"
          subtitle="What roles are you looking for?"
          className="p-0 pb-4"
        />
        <div className="flex gap-2">
          <Input
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRole(roleInput);
                setRoleInput("");
              }
            }}
            placeholder="e.g. Senior Frontend Engineer"
          />
          <Button
            variant="secondary"
            onClick={() => {
              addRole(roleInput);
              setRoleInput("");
            }}
          >
            Add
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(profile.targetRoles ?? []).map((r) => (
            <Badge key={r} color="blue">
              {r}
              <button
                onClick={() => removeRole(r)}
                className="ml-1 hover:text-primary"
                aria-label={`Remove ${r}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_ROLES.filter(
            (r) => !(profile.targetRoles ?? []).includes(r)
          ).map((r) => (
            <button
              key={r}
              onClick={() => addRole(r)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              + {r}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-600">✓ Saved</span>}
        <Button onClick={save} loading={saving} size="lg">
          Save profile
        </Button>
      </div>
    </div>
  );
}
