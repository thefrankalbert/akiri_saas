export default function GlobalLoading() {
  return (
    <div className="bg-surface-950 flex min-h-dvh items-center justify-center">
      <div className="text-center">
        <div className="border-t-primary border-surface-700 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
        <p className="text-surface-100 text-sm">Chargement...</p>
      </div>
    </div>
  );
}
