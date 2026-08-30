import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoUser } from "@/lib/auth";
import {
  createDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/repo";
import { buildResumeMarkdown } from "@/lib/documents";
import { getProfile } from "@/lib/repo";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  type: z.enum(["cv", "cover_letter"]),
  title: z.string().min(1),
  content: z.string().optional(),
});

export async function GET() {
  const user = await ensureDemoUser();
  const documents = listDocuments(user.id);

  // Auto-create a draft resume from profile if none exists
  if (documents.length === 0) {
    const profile = getProfile(user.id);
    if (profile) {
      createDocument(user.id, "cv", "My Resume (draft)", buildResumeMarkdown(profile));
      return NextResponse.json({ documents: listDocuments(user.id) });
    }
  }

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await ensureDemoUser();
  const raw = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const doc = createDocument(
    user.id,
    parsed.data.type,
    parsed.data.title,
    parsed.data.content ?? ""
  );
  return NextResponse.json({ document: doc });
}

export async function PATCH(request: Request) {
  const user = await ensureDemoUser();
  const raw = await request.json().catch(() => ({}));
  const { id } = raw as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const doc = getDocument(id);
  if (!doc || doc.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const updated = updateDocument(id, {
    title: typeof raw.title === "string" ? raw.title : undefined,
    content: typeof raw.content === "string" ? raw.content : undefined,
  });
  return NextResponse.json({ document: updated });
}

export async function DELETE(request: Request) {
  const user = await ensureDemoUser();
  const raw = await request.json().catch(() => ({}));
  const { id } = raw as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const doc = getDocument(id);
  if (!doc || doc.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  deleteDocument(id);
  return NextResponse.json({ ok: true });
}
