import { Suspense } from "react";
import { JobsView } from "@/components/jobs-view";

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}</div>}>
      <JobsView />
    </Suspense>
  );
}
