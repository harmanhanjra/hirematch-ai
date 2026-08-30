import type { Profile, Job, FitBreakdown } from "./types";

const SKILL_SYNONYMS: Record<string, string[]> = {
  js: ["javascript", "node", "nodejs", "typescript"],
  javascript: ["js", "typescript", "node"],
  typescript: ["ts", "javascript"],
  node: ["nodejs", "javascript", "js"],
  nodejs: ["node", "javascript"],
  react: ["reactjs", "react.js"],
  reactjs: ["react"],
  python: ["py"],
  postgres: ["postgresql", "sql"],
  postgresql: ["postgres", "sql"],
  sql: ["postgres", "postgresql", "sqlite", "mysql"],
  aws: ["amazon web services"],
  devops: ["ci/cd", "cicd", "docker", "kubernetes", "k8s"],
  kubernetes: ["k8s", "kube"],
  "machine learning": ["ml", "deep learning", "ai"],
  ml: ["machine learning", "deep learning"],
  ai: ["machine learning", "ml", "artificial intelligence"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

function skillAliases(skill: string): Set<string> {
  const key = normalizeSkill(skill);
  const set = new Set<string>([key]);
  for (const [base, aliases] of Object.entries(SKILL_SYNONYMS)) {
    if (base === key) aliases.forEach((a) => set.add(a));
    if (aliases.includes(key)) set.add(base);
  }
  // add two-word variants around phrases
  return set;
}

function extractSkillsFromText(
  text: string,
  candidateSkills: string[]
): string[] {
  const joined = tokenize(text).join(" ");
  const found: string[] = [];
  for (const skill of candidateSkills) {
    const key = normalizeSkill(skill);
    const pattern = new RegExp(`\\b${escapeRegExp(key)}\\b`, "i");
    if (pattern.test(joined) || joined.includes(key)) {
      found.push(skill);
      continue;
    }
    // check aliases
    for (const alias of skillAliases(skill)) {
      const aliasPattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i");
      if (aliasPattern.test(joined)) {
        found.push(skill);
        break;
      }
    }
  }
  return found;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function computeFit(profile: Profile, job: Job): FitBreakdown {
  const profileSkills = profile.skills.map(normalizeSkill);
  const requiredSkills = job.skillsRequired.length
    ? job.skillsRequired.map(normalizeSkill)
    : extractSkillsFromText(
        job.description,
        profile.skills.length ? profile.skills : ["typescript", "react", "node"]
      );

  const matched = new Set<string>();
  const missing: string[] = [];

  for (const req of requiredSkills) {
    let found = false;
    for (const have of profileSkills) {
      if (
        have === req ||
        skillAliases(have).has(req) ||
        skillAliases(req).has(have)
      ) {
        found = true;
        break;
      }
    }
    if (found) matched.add(req);
    else missing.push(req);
  }

  const skillsScore =
    requiredSkills.length === 0
      ? profileSkills.length > 0
        ? 0.7
        : 0.5
      : requiredSkills.length === 0
        ? 0.5
        : matched.size / requiredSkills.length;

  // Experience: perfect match if within range
  let experienceScore = 0.5;
  if (profile.yearsExperience != null) {
    const yrs = profile.yearsExperience;
    if (yrs >= 3) experienceScore = 1;
    else if (yrs >= 2) experienceScore = 0.85;
    else if (yrs >= 1) experienceScore = 0.7;
    else experienceScore = 0.5;
  }

  // Location / remote
  let locationScore = 0.7;
  if (job.remote) locationScore = 1;
  else if (profile.remotePreference === "remote" && !job.remote)
    locationScore = 0.4;
  else if (
    profile.remotePreference === "onsite" &&
    profile.location &&
    job.location &&
    profile.location.toLowerCase().includes(job.location.toLowerCase())
  )
    locationScore = 1;
  else if (profile.location && job.location) {
    const pl = profile.location.toLowerCase();
    const jl = job.location.toLowerCase();
    if (pl.includes(jl) || jl.includes(pl)) locationScore = 0.95;
    else if (job.remote) locationScore = 0.9;
  }

  // Salary
  let salaryScore = 0.6;
  if (job.salaryMin != null && profile.salaryMin != null) {
    if (job.salaryMin >= profile.salaryMin) salaryScore = 1;
    else if (job.salaryMax != null && job.salaryMax >= profile.salaryMin)
      salaryScore = 0.8;
    else salaryScore = 0.5;
  } else if (profile.salaryMin == null) {
    salaryScore = 0.7;
  }

  const overall = Math.round(
    (skillsScore * 0.5 + experienceScore * 0.2 + locationScore * 0.15 + salaryScore * 0.15) * 100
  );

  return {
    skills: Math.round(skillsScore * 100),
    experience: Math.round(experienceScore * 100),
    location: Math.round(locationScore * 100),
    salary: Math.round(salaryScore * 100),
    overall,
    matchedSkills: Array.from(matched),
    missingSkills: missing,
  };
}
