// Suspense fallback for public share links, which read the database at request time.
export default function Loading() {
  return (
    <div className="flex h-dvh items-center justify-center">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
    </div>
  );
}
