import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoUser } from "@/lib/auth";
import { getProfile, getJob, getApplicationForJob } from "@/lib/repo";
import { computeFit } from "@/lib/matching";
import { chat } from "@/lib/ai/nvidia";
import {
  buildResumeMarkdown,
  generateResumeMarkdown,
  buildCoverLetterMarkdown,
} from "@/lib/documents";
import { createDocument } from "@/lib/repo";

export const dynamic = "force-dynamic";

const chatSchema = z.object({
  message: z.string().min(1),
  context: z.string().optional(),
});

const coverSchema = z.object({
  jobId: z.string(),
  save: z.boolean().optional(),
});

const resumeSchema = z.object({
  save: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await ensureDemoUser();
  const raw = await request.json().catch(() => ({}));

  // Cover letter generation
  if (typeof raw.jobId === "string") {
    const parsed = coverSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const job = getJob(parsed.data.jobId);
    const profile = getProfile(user.id);
    if (!job || !profile) {
      return NextResponse.json({ error: "Job or profile not found" }, { status: 404 });
    }
    const fit = computeFit(profile, job);
    const content = await generateCoverLetter(profile, job, fit);
    let doc = null;
    if (parsed.data.save) {
      doc = createDocument(
        user.id,
        "cover_letter",
        `Cover letter — ${job.title} at ${job.company}`,
        content
      );
    }
    return NextResponse.json({ content, document: doc });
  }

  // Resume generation
  if (raw.generateResume !== undefined) {
    const profile = getProfile(user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not set up" }, { status: 404 });
    }
    const content = await generateResumeMarkdown(profile);
    let doc = null;
    if (raw.save) {
      doc = createDocument(user.id, "cv", "My Resume", content);
    }
    return NextResponse.json({ content, document: doc });
  }

  // General chat with context
  const parsed = chatSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const content = await chat([
    {
      role: "system",
      content:
        "You are a helpful job-search assistant. Help the user analyze jobs, prepare applications, and improve their career strategy. Be concise and practical. Use the provided context about the user's profile where relevant.",
    },
    {
      role: "user",
      content: `User context: ${parsed.data.context || "No specific context granted."}\n\nQuestion: ${parsed.data.message}`,
    },
  ]);

  return NextResponse.json({ content });
}

async function generateCoverLetter(profile: any, job: any, fit: any): Promise<string> {
  // Try live AI, fall back to template
  const aiContent = await chat([
    {
      role: "system",
      content:
        "You are a professional cover letter writer. Write a compelling, tailored cover letter in Markdown. Do not fabricate credentials. Keep it focused and enthusiastic.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          profile: {
            headline: profile.headline,
            summary: profile.summary,
            yearsExperience: profile.yearsExperience,
            skills: profile.skills,
          },
          job,
          fit: {
            matched: fit.matchedSkills,
            missing: fit.missingSkills,
            overall: fit.overall,
          },
        },
        null,
        2
      ),
    },
  ]);

  if (aiContent && !aiContent.startsWith("# Assistant response")) {
    return aiContent;
  }
  return buildCoverLetterMarkdown(profile, job, fit);
}

export async function GET() {
  const user = await ensureDemoUser();
  return NextResponse.json({ hasKey: Boolean(process.env.NVIDIA_API_KEY) });
}
