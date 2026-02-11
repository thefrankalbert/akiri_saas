export default function MainLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="text-center">
        <div className="border-t-primary mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200" />
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  );
}
