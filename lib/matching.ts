import type { Profile, Job, FitBreakdown, FitSignal } from "./types";

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

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function skillAliases(skill: string): Set<string> {
  const key = normalizeSkill(skill);
  const set = new Set<string>([key]);
  for (const [base, aliases] of Object.entries(SKILL_SYNONYMS)) {
    if (base === key) aliases.forEach((a) => set.add(a));
    if (aliases.includes(key)) set.add(base);
  }
  return set;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSkillsFromText(text: string, candidateSkills: string[]): string[] {
  const joined = tokenize(text).join(" ");
  const found: string[] = [];
  for (const skill of candidateSkills) {
    const key = normalizeSkill(skill);
    const pattern = new RegExp(`\\b${escapeRegExp(key)}\\b`, "i");
    if (pattern.test(joined) || joined.includes(key)) {
      found.push(skill);
      continue;
    }
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

function addSignal(
  signals: FitSignal[],
  kind: FitSignal["kind"],
  category: FitSignal["category"],
  label: string,
  detail: string
) {
  signals.push({ kind, category, label, detail });
}

export function computeFit(profile: Profile, job: Job): FitBreakdown {
  const profileSkills = profile.skills.map(normalizeSkill);
  const requiredSkills = Array.from(
    new Set(
      job.skillsRequired.length
        ? job.skillsRequired.map(normalizeSkill)
        : extractSkillsFromText(
            job.description,
            profile.skills.length ? profile.skills : ["typescript", "react", "node"]
          ).map(normalizeSkill)
    )
  );

  const matched = new Set<string>();
  const missing: string[] = [];

  for (const req of requiredSkills) {
    const found = profileSkills.some(
      (have) =>
        have === req ||
        skillAliases(have).has(req) ||
        skillAliases(req).has(have)
    );
    if (found) matched.add(req);
    else missing.push(req);
  }

  const skillsScore =
    requiredSkills.length === 0
      ? profileSkills.length > 0
        ? 0.7
        : 0.5
      : matched.size / requiredSkills.length;

  let experienceScore = 0.5;
  if (profile.yearsExperience != null) {
    const yrs = profile.yearsExperience;
    if (yrs >= 3) experienceScore = 1;
    else if (yrs >= 2) experienceScore = 0.85;
    else if (yrs >= 1) experienceScore = 0.7;
  }

  let locationScore = 0.7;
  if (job.remote) locationScore = 1;
  else if (profile.remotePreference === "remote") locationScore = 0.4;
  else if (profile.location && job.location) {
    const pl = profile.location.toLowerCase();
    const jl = job.location.toLowerCase();
    if (pl.includes(jl) || jl.includes(pl)) locationScore = 0.95;
  }

  let salaryScore = 0.6;
  if (job.salaryMin != null && profile.salaryMin != null) {
    if (job.salaryMin >= profile.salaryMin) salaryScore = 1;
    else if (job.salaryMax != null && job.salaryMax >= profile.salaryMin) salaryScore = 0.8;
    else salaryScore = 0.5;
  } else if (profile.salaryMin == null) {
    salaryScore = 0.7;
  }

  const overall = Math.round(
    (skillsScore * 0.5 +
      experienceScore * 0.2 +
      locationScore * 0.15 +
      salaryScore * 0.15) *
      100
  );

  const signals: FitSignal[] = [];
  const recommendations: string[] = [];

  if (matched.size) {
    addSignal(
      signals,
      "strength",
      "skills",
      `${matched.size} required skill${matched.size === 1 ? "" : "s"} matched`,
      Array.from(matched).map(titleCase).join(", ")
    );
  }
  if (missing.length) {
    addSignal(
      signals,
      "gap",
      "skills",
      `${missing.length} skill gap${missing.length === 1 ? "" : "s"}`,
      missing.map(titleCase).join(", ")
    );
    recommendations.push(
      `Prioritize evidence or learning for ${missing.slice(0, 3).map(titleCase).join(", ")}.`
    );
  }

  if (experienceScore >= 0.85) {
    addSignal(
      signals,
      "strength",
      "experience",
      "Experience aligns well",
      `${profile.yearsExperience ?? 0}+ years of experience supports this role.`
    );
  } else {
    addSignal(
      signals,
      "neutral",
      "experience",
      "Experience may need stronger evidence",
      "Use measurable project outcomes and relevant ownership to offset seniority gaps."
    );
    recommendations.push(
      "Strengthen the application with quantified outcomes and role-relevant project evidence."
    );
  }

  if (job.remote || locationScore >= 0.9) {
    addSignal(
      signals,
      "strength",
      "location",
      "Location preference aligns",
      job.remote ? "This role supports remote work." : "Your location closely matches the role."
    );
  } else if (locationScore < 0.6) {
    addSignal(
      signals,
      "gap",
      "location",
      "Location mismatch",
      "Your current preference does not strongly align with this role's location."
    );
    recommendations.push("Confirm relocation, hybrid, or remote flexibility before applying.");
  }

  if (salaryScore >= 0.8) {
    addSignal(
      signals,
      "strength",
      "salary",
      "Compensation aligns",
      "The advertised range appears compatible with your target."
    );
  } else if (salaryScore <= 0.5) {
    addSignal(
      signals,
      "gap",
      "salary",
      "Compensation may be below target",
      "The listed salary range may not meet your stated minimum."
    );
  }

  if (overall >= 80) recommendations.unshift("High-priority application: tailor your resume and apply.");
  else if (overall >= 65) recommendations.unshift("Good match: close the top skill gaps before applying.");
  else recommendations.unshift("Lower-priority match: apply only if the role is strategically valuable.");

  const evidencePoints =
    requiredSkills.length +
    (profile.yearsExperience != null ? 1 : 0) +
    (Boolean(profile.location || job.remote) ? 1 : 0) +
    (profile.salaryMin != null || job.salaryMin != null ? 1 : 0);
  const confidence: FitBreakdown["confidence"] =
    evidencePoints >= 6 ? "high" : evidencePoints >= 3 ? "medium" : "low";

  const summary =
    overall >= 80
      ? "Strong match with clear evidence across the most important dimensions."
      : overall >= 65
        ? "Good match with a few gaps worth addressing before applying."
        : "Partial match; the application needs stronger evidence or better alignment.";

  return {
    skills: Math.round(skillsScore * 100),
    experience: Math.round(experienceScore * 100),
    location: Math.round(locationScore * 100),
    salary: Math.round(salaryScore * 100),
    overall,
    matchedSkills: Array.from(matched),
    missingSkills: missing,
    confidence,
    summary,
    signals,
    recommendations: Array.from(new Set(recommendations)).slice(0, 4),
  };
}
