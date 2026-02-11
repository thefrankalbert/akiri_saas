'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">&#x1F4F6;</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Vous &ecirc;tes hors ligne</h1>
        <p className="mb-6 max-w-md text-gray-600">
          Il semble que vous n&apos;ayez pas de connexion internet. V&eacute;rifiez votre connexion
          et r&eacute;essayez.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary/90 rounded-xl px-6 py-3 font-semibold text-white transition-colors"
        >
          R&eacute;essayer
        </button>
      </div>
    </div>
  );
}
