import type { Job, Profile } from "./types";

export interface AtsAnalysis {
  score: number;
  keywordScore: number;
  structureScore: number;
  impactScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  presentSections: string[];
  missingSections: string[];
  recommendations: string[];
}

const COMMON_TERMS = new Set([
  "the","and","for","with","that","this","you","your","our","are","from","will","have","has",
  "job","role","team","work","using","into","their","they","who","but","not","all","can","skills",
  "experience","years","required","preferred","responsibilities","requirements","about","company"
]);

const SECTION_PATTERNS: Array<[string, RegExp]> = [
  ["summary", /(^|\n)\s*(professional\s+)?summary\s*[:\n]/i],
  ["experience", /(^|\n)\s*(work\s+)?experience\s*[:\n]/i],
  ["skills", /(^|\n)\s*(technical\s+)?skills\s*[:\n]/i],
  ["education", /(^|\n)\s*education\s*[:\n]/i],
  ["projects", /(^|\n)\s*projects?\s*[:\n]/i],
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function extractKeywords(job: Job): string[] {
  const explicit = job.skillsRequired.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const words = normalize(`${job.title} ${job.description}`)
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !COMMON_TERMS.has(word));

  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);

  const inferred = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([word]) => word);

  return [...new Set([...explicit, ...inferred])].slice(0, 24);
}

function hasTerm(text: string, term: string): boolean {
  const normalized = normalize(text);
  const clean = normalize(term).trim();
  if (!clean) return false;
  return normalized.includes(clean);
}

export function analyzeResume(profile: Profile, job: Job): AtsAnalysis {
  const resume = profile.resumeText?.trim() || "";
  const keywords = extractKeywords(job);
  const matchedKeywords = keywords.filter((k) => hasTerm(resume, k));
  const missingKeywords = keywords.filter((k) => !hasTerm(resume, k));

  const keywordScore = keywords.length
    ? Math.round((matchedKeywords.length / keywords.length) * 100)
    : 70;

  const presentSections = SECTION_PATTERNS
    .filter(([, pattern]) => pattern.test(resume))
    .map(([name]) => name);
  const missingSections = SECTION_PATTERNS
    .map(([name]) => name)
    .filter((name) => !presentSections.includes(name));

  const structureScore = Math.round((presentSections.length / SECTION_PATTERNS.length) * 100);

  const metricMatches = resume.match(/\b\d+(?:\.\d+)?%|\$\s?\d+[kKmM]?|\b\d+[kKmM]\+?\b/g) ?? [];
  const actionVerbMatches = resume.match(
    /\b(built|created|designed|implemented|improved|reduced|increased|optimized|automated|launched|led|delivered|scaled|deployed)\b/gi
  ) ?? [];
  const impactScore = Math.min(100, metricMatches.length * 12 + actionVerbMatches.length * 5);

  const score = Math.round(keywordScore * 0.55 + structureScore * 0.25 + impactScore * 0.2);

  const recommendations: string[] = [];
  if (!resume) {
    recommendations.push("Add your resume text in Profile before running ATS analysis.");
  } else {
    if (missingKeywords.length) {
      recommendations.push(
        `Add truthful evidence for these high-value terms where relevant: ${missingKeywords.slice(0, 6).join(", ")}.`
      );
    }
    if (missingSections.length) {
      recommendations.push(
        `Improve ATS structure by adding: ${missingSections.slice(0, 4).join(", ")}.`
      );
    }
    if (metricMatches.length < 3) {
      recommendations.push("Quantify more achievements with percentages, money, users, latency, accuracy, or time saved.");
    }
    if (actionVerbMatches.length < 4) {
      recommendations.push("Start more bullets with strong action verbs and ownership language.");
    }
    if (resume.length < 800) {
      recommendations.push("Your resume text looks thin; add concrete project or work evidence rather than generic claims.");
    }
  }

  return {
    score,
    keywordScore,
    structureScore,
    impactScore,
    matchedKeywords,
    missingKeywords,
    presentSections,
    missingSections,
    recommendations: recommendations.slice(0, 5),
  };
}
