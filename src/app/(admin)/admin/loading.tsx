export default function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Loading administrative workspace"
      className="flex min-h-[40vh] flex-col items-center justify-center p-8 space-y-4"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground animate-pulse">
        Loading Admin Dashboard...
      </p>
    </div>
  );
}
