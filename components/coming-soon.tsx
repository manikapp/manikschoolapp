export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-xl px-8 py-16 text-center">
      <p className="font-display text-2xl font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink/60">{body}</p>
      <span className="mt-6 inline-block rounded-full bg-brass/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brass-dark">
        Coming soon
      </span>
    </main>
  );
}
