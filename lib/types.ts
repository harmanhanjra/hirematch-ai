export type Stage =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

export const STAGES: Stage[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface Profile {
  id: number;
  userId: string;
  headline: string | null;
  summary: string | null;
  location: string | null;
  remotePreference: "remote" | "hybrid" | "onsite" | "any" | null;
  yearsExperience: number | null;
  skills: string[]; // json-encoded
  targetRoles: string[]; // json-encoded
  salaryMin: number | null;
  salaryMax: number | null;
  resumeText: string | null;
}

export interface Job {
  id: string;
  userId: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  url: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  skillsRequired: string[]; // json-encoded
  source: string;
  postedAt: string;
  createdAt: string;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  stage: Stage;
  notes: string | null;
  appliedAt: string | null;
  updatedAt: string;
}

export interface FitBreakdown {
  skills: number;
  experience: number;
  location: number;
  salary: number;
  overall: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface JobWithFit extends Job {
  fit?: FitBreakdown;
  appliedStage?: Stage | null;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  type: "cv" | "cover_letter";
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
