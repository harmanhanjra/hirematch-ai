import type { Job } from "./types";
import { insertJobs } from "./repo";

type SeedJob = Omit<Job, "id" | "userId" | "createdAt">;

const JOBS: SeedJob[] = [
  {
    title: "Senior Frontend Engineer",
    company: "Stripe",
    location: "Remote (US)",
    remote: true,
    url: "https://stripe.com/jobs",
    salaryMin: 150000,
    salaryMax: 210000,
    description:
      "Build delightful payment experiences. You'll work with React, TypeScript, and Next.js on our dashboard and checkout surfaces. Strong testing, accessibility, and performance skills required. Deep understanding of the web platform and modern tooling.",
    skillsRequired: ["React", "TypeScript", "Next.js", "JavaScript", "CSS", "Testing"],
    source: "seed",
    postedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    title: "Full Stack Engineer",
    company: "Linear",
    location: "Remote",
    remote: true,
    url: "https://linear.app/careers",
    salaryMin: 140000,
    salaryMax: 190000,
    description:
      "We're building a fast, delightful issue tracker. Work across the stack with React, TypeScript, Node, and PostgreSQL. You care about performance, DX, and craft. Ship to production frequently.",
    skillsRequired: ["React", "TypeScript", "Node", "PostgreSQL", "GraphQL", "Rust"],
    source: "seed",
    postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    title: "Staff Software Engineer",
    company: "Vercel",
    location: "San Francisco, CA (Hybrid)",
    remote: false,
    url: "https://vercel.com/careers",
    salaryMin: 180000,
    salaryMax: 250000,
    description:
      "Own architecture for the Next.js and deploy platform. Deep expertise in JavaScript, Node.js, cloud infrastructure, and distributed systems. Mentor engineers and drive cross-cutting initiatives.",
    skillsRequired: ["JavaScript", "Node.js", "TypeScript", "AWS", "Distributed Systems", "Next.js"],
    source: "seed",
    postedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    title: "Machine Learning Engineer",
    company: "Anthropic",
    location: "Remote (US)",
    remote: true,
    url: "https://anthropic.com/careers",
    salaryMin: 200000,
    salaryMax: 320000,
    description:
      "Apply LLMs to real-world products. Strong Python, PyTorch, and applied ML skills. Experience with model evaluation, finetuning, and production ML systems. Rigorous approach to safety and evaluation.",
    skillsRequired: ["Python", "PyTorch", "Machine Learning", "LLMs", "Evaluation", "Rust"],
    source: "seed",
    postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    title: "Platform Engineer",
    company: "Datadog",
    location: "New York, NY",
    remote: false,
    url: "https://datadoghq.com/careers",
    salaryMin: 160000,
    salaryMax: 210000,
    description:
      "Build the infrastructure that powers developer observability. Kubernetes, Go, and cloud infrastructure experience. Operate high-scale systems reliably. Strong DevEx focus.",
    skillsRequired: ["Kubernetes", "Go", "Docker", "AWS", "CI/CD", "Terraform"],
    source: "seed",
    postedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    title: "Backend Engineer",
    company: "Notion",
    location: "Remote (US/Canada)",
    remote: true,
    url: "https://notion.so/careers",
    salaryMin: 150000,
    salaryMax: 200000,
    description:
      "Build the backend for collaborative workspaces. Node.js, TypeScript, PostgreSQL, and real-time systems. You care about reliability, scalability, and delightful product experiences.",
    skillsRequired: ["Node.js", "TypeScript", "PostgreSQL", "WebSockets", "AWS"],
    source: "seed",
    postedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    title: "Frontend Engineer, Design Systems",
    company: "GitHub",
    location: "Remote",
    remote: true,
    url: "https://github.com/about/careers",
    salaryMin: 135000,
    salaryMax: 180000,
    description:
      "Build the component library and design system used across GitHub. React, TypeScript, accessibility focus, and strong written communication. Collaborate closely with design.",
    skillsRequired: ["React", "TypeScript", "CSS", "Accessibility", "Design Systems"],
    source: "seed",
    postedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    title: "Software Engineer, Applied AI",
    company: "Shopify",
    location: "Remote (Canada)",
    remote: true,
    url: "https://shopify.com/careers",
    salaryMin: 130000,
    salaryMax: 180000,
    description:
      "Apply AI to commerce problems. Python, Ruby/Rails, and modern ML tooling. Ship AI features that help merchants grow. Strong product instincts and pragmatic engineering.",
    skillsRequired: ["Python", "Machine Learning", "Rails", "PostgreSQL", "LLMs"],
    source: "seed",
    postedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    title: "Senior Software Engineer, Payments",
    company: "Adyen",
    location: "London, UK (Hybrid)",
    remote: false,
    url: "https://adyen.com/careers",
    salaryMin: 120000,
    salaryMax: 160000,
    description:
      "Build payment infrastructure that processes billions of transactions. Java/Go plus JavaScript for tooling. Reliability and correctness are paramount. Work with a global engineering team.",
    skillsRequired: ["Java", "Go", "JavaScript", "Kubernetes", "Distributed Systems"],
    source: "seed",
    postedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    title: "Frontend Developer",
    company: "Figma",
    location: "San Francisco, CA",
    remote: false,
    url: "https://figma.com/careers",
    salaryMin: 155000,
    salaryMax: 205000,
    description:
      "Build Figma's web editor and collaboration features. Deep expertise in web rendering, canvas, performance optimization, and React. Obsessive about product quality and craft.",
    skillsRequired: ["React", "TypeScript", "Canvas", "WebGL", "JavaScript", "Performance"],
    source: "seed",
    postedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    title: "Data Engineer",
    company: "Snowflake",
    location: "Remote (US)",
    remote: true,
    url: "https://snowflake.com/careers",
    salaryMin: 145000,
    salaryMax: 195000,
    description:
      "Build data pipelines and infrastructure. Python, SQL, dbt, and cloud data warehouses. Support internal analytics and external customers. Focus on data quality and lineage.",
    skillsRequired: ["Python", "SQL", "dbt", "AWS", "Airflow", "Spark"],
    source: "seed",
    postedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    title: "DevOps / Site Reliability Engineer",
    company: "Cloudflare",
    location: "Remote (Americas)",
    remote: true,
    url: "https://cloudflare.com/careers",
    salaryMin: 140000,
    salaryMax: 190000,
    description:
      "Keep the edge running at massive scale. Linux, Kubernetes, networking, and Go/Python for automation. On-call with a strong reliability culture. Automate away toil.",
    skillsRequired: ["Linux", "Kubernetes", "Go", "Python", "Networking", "AWS"],
    source: "seed",
    postedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export function seedJobs(userId: string): number {
  return insertJobs(userId, JOBS);
}
