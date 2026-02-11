export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="border-t-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200" />
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  );
}
