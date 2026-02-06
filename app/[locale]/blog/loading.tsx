export default function BlogLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="animate-pulse space-y-8">
        <div className="h-10 bg-surface-200 dark:bg-surface-800 rounded-lg w-2/3" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-surface-200 dark:bg-surface-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
