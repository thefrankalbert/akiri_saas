'use client';

export default function OfflinePage() {
  return (
    <div className="bg-surface-950 flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">&#x1F4F6;</div>
        <h1 className="mb-2 text-2xl font-bold text-neutral-100">Vous &ecirc;tes hors ligne</h1>
        <p className="text-surface-100 mb-6 max-w-md">
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
