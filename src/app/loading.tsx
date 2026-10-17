export default function RootLoading() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="flex min-h-[50vh] flex-col items-center justify-center p-8 space-y-4"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Loading Saugatuck Douglas Garden Club...
      </p>
    </div>
  );
}
