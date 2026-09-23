import { Loader2 } from "lucide-react";

// Shown while a page's data is on its way, or when it could not be loaded.
export function PageState({ error }: { error?: string }) {
  if (error) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-sm text-destructive">{error}</div>
    );
  }
  return (
    <div className="flex justify-center py-12 text-muted-foreground" role="status" aria-label="Loading">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
