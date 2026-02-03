'use client';

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-pulse">
        <div className="text-2xl font-bold mb-4">MISES VS CERIZE</div>
        <div className="text-muted text-sm text-center">Carregando dados...</div>
      </div>
    </div>
  );
}
