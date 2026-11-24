// Suspense fallback for the signed-in pages. With cacheComponents on, these pages read
// auth and the database at request time, so they need a boundary to stream into.
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
    </div>
  );
}
