import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Yakalanan Hata (Error Boundary):", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-[32px] border border-slate-200 shadow-sm mt-6">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4 shadow-inner">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Eyvah, bir şeyler ters gitti!</h2>
          <p className="text-sm font-medium text-slate-500 mb-8 max-w-md">
            Görünüşe göre sistemde anlık bir kesinti yaşandı. Endişelenme, verilerin güvende. Sayfayı yenileyerek iş akışına devam edebilirsin.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-slate-900/20"
          >
            <RefreshCw size={16} />
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}