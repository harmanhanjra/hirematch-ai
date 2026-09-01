import { describe, expect, it } from "vitest";
import { computeFit } from "../lib/matching";
import type { Job, Profile } from "../lib/types";

const profile: Profile = {
  id: 1,
  userId: "user-1",
  headline: "AI Engineer",
  summary: null,
  location: "Berlin, Germany",
  remotePreference: "any",
  yearsExperience: 3,
  skills: ["Python", "React", "AWS"],
  targetRoles: ["AI Engineer"],
  salaryMin: 60_000,
  salaryMax: null,
  resumeText: null,
};

const job: Job = {
  id: "job-1",
  userId: "user-1",
  title: "AI Engineer",
  company: "Example",
  location: "Berlin",
  remote: false,
  url: null,
  salaryMin: 65_000,
  salaryMax: 80_000,
  description: "Build production AI systems with Python and AWS.",
  skillsRequired: ["Python", "AWS"],
  source: "test",
  postedAt: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("computeFit", () => {
  it("scores a strongly aligned role and explains the evidence", () => {
    const fit = computeFit(profile, job);

    expect(fit).toMatchObject({
      skills: 100,
      experience: 100,
      location: 95,
      salary: 100,
      overall: 99,
      matchedSkills: ["python", "aws"],
      missingSkills: [],
      confidence: "medium",
    });
    expect(fit.signals.map((signal) => signal.category)).toEqual(
      expect.arrayContaining(["skills", "experience", "location", "salary"])
    );
    expect(fit.recommendations[0]).toContain("High-priority");
  });

  it("matches common skill aliases", () => {
    const fit = computeFit(
      { ...profile, skills: ["JavaScript", "Kubernetes", "Machine Learning"] },
      {
        ...job,
        skillsRequired: ["JS", "k8s", "ML"],
      }
    );

    expect(fit.skills).toBe(100);
    expect(fit.missingSkills).toEqual([]);
  });

  it("deduplicates normalized requirements before scoring", () => {
    const fit = computeFit(
      { ...profile, skills: ["Python"] },
      { ...job, skillsRequired: ["Python", " python ", "PYTHON"] }
    );

    expect(fit.skills).toBe(100);
    expect(fit.matchedSkills).toEqual(["python"]);
    expect(fit.signals[0]?.label).toBe("1 required skill matched");
  });

  it("extracts requirements from the description when none are supplied", () => {
    const fit = computeFit(
      { ...profile, skills: ["React", "Python"] },
      {
        ...job,
        description: "The product is built with React; Ruby experience is optional.",
        skillsRequired: [],
      }
    );

    expect(fit.skills).toBe(100);
    expect(fit.matchedSkills).toEqual(["react"]);
  });

  it("surfaces skill, location, and salary gaps for a weak match", () => {
    const fit = computeFit(
      {
        ...profile,
        location: "Berlin",
        remotePreference: "remote",
        yearsExperience: 0,
        skills: ["Python"],
        salaryMin: 80_000,
      },
      {
        ...job,
        location: "Munich",
        remote: false,
        salaryMin: 45_000,
        salaryMax: 55_000,
        skillsRequired: ["Go", "Kubernetes"],
      }
    );

    expect(fit).toMatchObject({
      skills: 0,
      experience: 50,
      location: 40,
      salary: 50,
      overall: 24,
      missingSkills: ["go", "kubernetes"],
    });
    expect(
      fit.signals.filter((signal) => signal.kind === "gap").map((signal) => signal.category)
    ).toEqual(expect.arrayContaining(["skills", "location", "salary"]));
    expect(fit.recommendations[0]).toContain("Lower-priority");
  });
});
