import Link from "next/link";
import { Button } from "@/components/ui";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="text-lg font-bold">HireMatch AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Launch App
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            AI-powered job matching
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Match jobs to your skills and{" "}
            <span className="text-primary">land your next role</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Scrape and rank jobs by fit score, track applications on a kanban
            board, generate tailored cover letters, and prepare for interviews —
            all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">Try it now — no signup</Button>
            </Link>
            <Link href="/profile">
              <Button size="lg" variant="outline">
                Set up your profile
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: "⚡",
                title: "Smart Fit Scoring",
                desc: "Multi-dimensional matching on skills, experience, location, and salary.",
              },
              {
                icon: "📋",
                title: "Application Tracking",
                desc: "Drag jobs through your pipeline from saved to offer.",
              },
              {
                icon: "🤖",
                title: "AI Assistance",
                desc: "Tailored cover letters and resume generation powered by NVIDIA NIM.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border p-6 text-left"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        HireMatch AI — a production-ready job matching demo
      </footer>
    </div>
  );
}
