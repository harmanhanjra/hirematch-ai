import db, { helpers, now, uuid } from "./db";
import type {
  User,
  Profile,
  Job,
  Application,
  DocumentRecord,
  Stage,
} from "./types";

function mapProfile(r: any): Profile | null {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    headline: r.headline,
    summary: r.summary,
    location: r.location,
    remotePreference: r.remote_preference,
    yearsExperience: r.years_experience,
    skills: helpers.parseArray(r.skills),
    targetRoles: helpers.parseArray(r.target_roles),
    salaryMin: r.salary_min,
    salaryMax: r.salary_max,
    resumeText: r.resume_text,
  };
}

function mapJob(r: any): Job | null {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    company: r.company,
    location: r.location,
    remote: Boolean(r.remote),
    url: r.url,
    salaryMin: r.salary_min,
    salaryMax: r.salary_max,
    description: r.description,
    skillsRequired: helpers.parseArray(r.skills_required),
    source: r.source,
    postedAt: r.posted_at,
    createdAt: r.created_at,
  };
}

function mapApplication(r: any): Application | null {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    jobId: r.job_id,
    stage: r.stage as Stage,
    notes: r.notes,
    appliedAt: r.applied_at,
    updatedAt: r.updated_at,
  };
}

const getUserStmt = db.prepare("SELECT * FROM users WHERE id = ?");
const getUserByEmailStmt = db.prepare("SELECT * FROM users WHERE email = ?");
const insertUserStmt = db.prepare(
  "INSERT INTO users (id, email, name, created_at) VALUES (@id, @email, @name, @created_at)"
);

export function getUser(id: string): User | null {
  const r = getUserStmt.get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    createdAt: r.created_at,
  };
}

export function findUserByEmail(email: string): User | null {
  const r = getUserByEmailStmt.get(email) as any;
  if (!r) return null;
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    createdAt: r.created_at,
  };
}

export function createUser(email: string, name: string | null): User {
  const user = { id: uuid(), email, name, created_at: now() };
  insertUserStmt.run(user);
  return getUser(user.id)!;
}

export function getOrCreateUser(email: string, name: string | null): User {
  return findUserByEmail(email) ?? createUser(email, name);
}

// Profile
const getProfileStmt = db.prepare("SELECT * FROM profiles WHERE user_id = ?");
const upsertProfileStmt = db.prepare(`
  INSERT INTO profiles (
    user_id, headline, summary, location, remote_preference,
    years_experience, skills, target_roles, salary_min, salary_max,
    resume_text, updated_at
  ) VALUES (
    @user_id, @headline, @summary, @location, @remote_preference,
    @years_experience, @skills, @target_roles, @salary_min, @salary_max,
    @resume_text, @updated_at
  )
  ON CONFLICT(user_id) DO UPDATE SET
    headline=@headline, summary=@summary, location=@location,
    remote_preference=@remote_preference, years_experience=@years_experience,
    skills=@skills, target_roles=@target_roles,
    salary_min=@salary_min, salary_max=@salary_max,
    resume_text=@resume_text, updated_at=@updated_at
`);

export function getProfile(userId: string): Profile | null {
  return mapProfile(getProfileStmt.get(userId));
}

export function saveProfile(userId: string, data: Partial<Profile>): Profile {
  const existing = getProfile(userId);
  const merged = { ...existing, ...data, userId };
  upsertProfileStmt.run({
    user_id: userId,
    headline: merged.headline ?? null,
    summary: merged.summary ?? null,
    location: merged.location ?? null,
    remote_preference: merged.remotePreference ?? null,
    years_experience: merged.yearsExperience ?? null,
    skills: JSON.stringify(merged.skills ?? []),
    target_roles: JSON.stringify(merged.targetRoles ?? []),
    salary_min: merged.salaryMin ?? null,
    salary_max: merged.salaryMax ?? null,
    resume_text: merged.resumeText ?? null,
    updated_at: now(),
  });
  return getProfile(userId)!;
}

// Jobs
const insertJobStmt = db.prepare(`
  INSERT INTO jobs (
    id, user_id, title, company, location, remote, url,
    salary_min, salary_max, description, skills_required, source,
    posted_at, created_at
  ) VALUES (
    @id, @user_id, @title, @company, @location, @remote, @url,
    @salary_min, @salary_max, @description, @skills_required, @source,
    @posted_at, @created_at
  )
`);

export function createJob(data: {
  userId: string;
  title: string;
  company: string;
  location?: string | null;
  remote?: boolean;
  url?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description: string;
  skillsRequired?: string[];
  source?: string;
  postedAt?: string | null;
}): Job {
  const job = {
    id: uuid(),
    user_id: data.userId,
    title: data.title,
    company: data.company,
    location: data.location ?? null,
    remote: data.remote ? 1 : 0,
    url: data.url ?? null,
    salary_min: data.salaryMin ?? null,
    salary_max: data.salaryMax ?? null,
    description: data.description,
    skills_required: JSON.stringify(data.skillsRequired ?? []),
    source: data.source,
    posted_at: data.postedAt ?? now(),
    created_at: now(),
  };
  insertJobStmt.run(job);
  return mapJob(db.prepare("SELECT * FROM jobs WHERE id = ?").get(job.id))!;
}

export function insertJobs(userId: string, jobs: Omit<Job, "id" | "userId" | "createdAt">[]): number {
  const insert = db.transaction((items: typeof jobs) => {
    let count = 0;
    for (const j of items) {
      const exists = db
        .prepare("SELECT id FROM jobs WHERE user_id = ? AND title = ? AND company = ?")
        .get(userId, j.title, j.company);
      if (exists) continue;
      createJob({ ...j, userId });
      count++;
    }
    return count;
  });
  return insert(jobs);
}

const listJobsStmt = db.prepare(
  "SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC"
);

export function listJobs(userId: string): Job[] {
  const rows = listJobsStmt.all(userId);
  return rows.map(mapJob).filter(Boolean) as Job[];
}

const getJobStmt = db.prepare("SELECT * FROM jobs WHERE id = ?");

export function getJob(id: string): Job | null {
  return mapJob(getJobStmt.get(id));
}

export function deleteJob(id: string, userId: string): void {
  db.prepare("DELETE FROM jobs WHERE id = ? AND user_id = ?").run(id, userId);
}

// Applications
const upsertApplicationStmt = db.prepare(`
  INSERT INTO applications (id, user_id, job_id, stage, notes, applied_at, updated_at)
  VALUES (@id, @user_id, @job_id, @stage, @notes, @applied_at, @updated_at)
  ON CONFLICT(id) DO UPDATE SET
    stage=@stage, notes=@notes, applied_at=@applied_at, updated_at=@updated_at
`);

const getApplicationByJobStmt = db.prepare(
  "SELECT * FROM applications WHERE user_id = ? AND job_id = ?"
);

export function setApplicationStage(
  userId: string,
  jobId: string,
  stage: Stage,
  notes?: string | null
): Application {
  const existing = getApplicationByJobStmt.get(userId, jobId) as any;
  const appliedAt = existing?.applied_at ?? (stage === "applied" ? now() : existing?.applied_at ?? null);
  const id = existing?.id ?? uuid();
  upsertApplicationStmt.run({
    id,
    user_id: userId,
    job_id: jobId,
    stage,
    notes: notes ?? existing?.notes ?? null,
    applied_at: appliedAt,
    updated_at: now(),
  });
  return mapApplication(getApplicationByJobStmt.get(userId, jobId))!;
}

export function getApplicationForJob(userId: string, jobId: string): Application | null {
  return mapApplication(getApplicationByJobStmt.get(userId, jobId));
}

export function listApplications(userId: string): Application[] {
  const rows = db
    .prepare("SELECT * FROM applications WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId);
  return rows.map(mapApplication).filter(Boolean) as Application[];
}

export function applicationsForJobIds(userId: string, jobIds: string[]): Map<string, Application> {
  if (jobIds.length === 0) return new Map();
  const placeholders = jobIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT * FROM applications WHERE user_id = ? AND job_id IN (${placeholders})`
    )
    .all(userId, ...jobIds) as any[];
  const map = new Map<string, Application>();
  for (const r of rows) {
    const a = mapApplication(r);
    if (a) map.set(a.jobId, a);
  }
  return map;
}

// Documents
export function createDocument(
  userId: string,
  type: DocumentRecord["type"],
  title: string,
  content: string
): DocumentRecord {
  const id = uuid();
  const ts = now();
  db.prepare(
    `INSERT INTO documents (id, user_id, type, title, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, type, title, content, ts, ts);
  return getDocument(id)!;
}

export function getDocument(id: string): DocumentRecord | null {
  const r = db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as any;
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listDocuments(userId: string): DocumentRecord[] {
  const rows = db
    .prepare("SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as any[];
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function updateDocument(id: string, updates: { title?: string; content?: string }): DocumentRecord {
  const existing = getDocument(id)!;
  const title = updates.title ?? existing.title;
  const content = updates.content ?? existing.content;
  db.prepare("UPDATE documents SET title = ?, content = ?, updated_at = ? WHERE id = ?").run(
    title,
    content,
    now(),
    id
  );
  return getDocument(id)!;
}

export function deleteDocument(id: string): void {
  db.prepare("DELETE FROM documents WHERE id = ?").run(id);
}
