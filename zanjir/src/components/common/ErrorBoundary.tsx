import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Kutilmagan xatolikda oq ekran o'rniga tushunarli xabar ko'rsatadi. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Kutilmagan xatolik:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-3xl">
          Z
        </div>
        <p className="text-sm font-bold text-emerald-300">Kutilmagan xatolik yuz berdi</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
        >
          Sahifani qayta yuklash
        </button>
      </div>
    );
  }
}
