import React from "react";
import { createRoot } from "react-dom/client";
import CandlestickChart from "./components/CandlestickChart";
import "./index.css";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Щось пішло не так :(</h1>
            <p className="text-gray-600 mb-4">Виникла помилка під час роботи додатку.</p>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono text-red-800 overflow-auto max-h-48 mb-6">
              {this.state.error?.message || "Unknown Error"}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Перезавантажити сторінку
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
              <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    C
                  </div>
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                      Crypto Market Analyzer
                  </h1>
              </div>
          </header>
          <main className="py-6">
              <CandlestickChart />
          </main>
        </div>
      </ErrorBoundary>
    </React.StrictMode>
  );
}