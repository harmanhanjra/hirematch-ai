import type { Profile, Job, FitBreakdown } from "./types";
import { chat } from "./ai/nvidia";

export async function generateResumeMarkdown(profile: Profile): Promise<string> {
  const prompt = buildResumePrompt(profile);
  const ai = await chat(
    [
      {
        role: "system",
        content:
          "You are an expert technical resume writer. Produce clean, ATS-friendly Markdown for a resume. Be specific, quantify achievements where possible, and highlight the candidate's skills. Do not invent experience the candidate does not have.",
      },
      { role: "user", content: prompt },
    ],
    { temperature: 0.6, maxTokens: 1500 }
  );

  return ai;
}

export function buildResumeMarkdown(profile: Profile): string {
  const skills = profile.skills.join(", ") || "Add skills";
  const roles = profile.targetRoles.join(", ") || "N/A";
  return [
    `# ${profile.headline || "Professional"}`,
    ``,
    profile.summary || "Professional summary pending.",
    ``,
    `## Target Roles`,
    roles,
    ``,
    `## Skills`,
    skills,
    ``,
    `## Experience`,
    `${profile.yearsExperience ?? 0}+ years of professional experience`,
  ].join("\n");
}

function buildResumePrompt(profile: Profile): string {
  return `
Personal details:
- Headline: ${profile.headline || "N/A"}
- Summary: ${profile.summary || "N/A"}
- Location: ${profile.location || "N/A"}
- Years experience: ${profile.yearsExperience ?? 0}
- Target roles: ${(profile.targetRoles || []).join(", ")}
- Skills: ${(profile.skills || []).join(", ")}

Write a complete, professional resume in Markdown based on these details.
`;
}

export function buildCoverLetterMarkdown(profile: Profile, job: Job, fit: FitBreakdown): string {
  const company = job.company;
  const role = job.title;
  const missing = fit.missingSkills.length
    ? `I am actively building expertise in ${fit.missingSkills.slice(0, 3).join(", ")}.`
    : "";
  return [
    `# Cover Letter — ${role} at ${company}`,
    ``,
    `Dear Hiring Team,`,
    ``,
    `I'm excited to apply for the ${role} role at ${company}. As a professional with ${
      profile.yearsExperience ?? 0
    } years of experience, I bring strong strengths in ${profile.skills
      .slice(0, 5)
      .join(", ")}.`,
    ``,
    profile.summary ? `${profile.summary}\n` : "",
    `My background aligns well with your needs: I match on ${fit.matchedSkills.length} required skills including ${fit
      .matchedSkills.slice(0, 4)
      .join(", ")}. ${missing}`,
    ``,
    `I would welcome the opportunity to discuss how I can contribute to the team at ${company}. Thank you for your consideration.`,
    ``,
    `Sincerely,`,
    profile.headline || "You",
  ].join("\n");
}
