import React, { useState, useEffect } from "react";
import axios from "axios";

interface ChartHeaderProps {
  symbol: string;
  setSymbol: (s: string) => void;
  interval: string;
  setInterval: (i: string) => void;
  overlays: { sma: boolean; ema: boolean; bb: boolean; patterns: boolean };
  setOverlays: React.Dispatch<React.SetStateAction<{ sma: boolean; ema: boolean; bb: boolean; patterns: boolean }>>;
  symbolsList: string[];
}

interface TickerStats {
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string; 
  lastPrice: string;
}

const ChartHeader = ({
  symbol,
  setSymbol,
  interval,
  setInterval: setTimeInterval, 
  overlays,
  setOverlays,
  symbolsList,
}: ChartHeaderProps) => {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stats, setStats] = useState<TickerStats | null>(null);

  const filteredSymbols = symbolsList.filter((sym) =>
    sym.toLowerCase().includes(search.toLowerCase())
  );

  // Fetch 24h Stats
  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await axios.get("https://api.binance.com/api/v3/ticker/24hr", {
                params: { symbol: symbol + "USDT" }
            });
            setStats(res.data);
        } catch (e) {
            console.error("Stats fetch error", e);
        }
    };
    fetchStats();
    
    const timerId = window.setInterval(fetchStats, 5000); 
    return () => clearInterval(timerId);
  }, [symbol]);

  const formatVol = (val: string) => {
      const num = parseFloat(val);
      if (num > 1000000000) return (num / 1000000000).toFixed(2) + "B";
      if (num > 1000000) return (num / 1000000).toFixed(2) + "M";
      if (num > 1000) return (num / 1000).toFixed(2) + "K";
      return num.toFixed(2);
  };

  const formatPrice = (val: string | number) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num)) return "—";
      if (num === 0) return "0.00";
      if (num < 1) return num.toFixed(4);
      if (num < 10) return num.toFixed(3);
      return num.toFixed(2);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 z-20 relative">
      
      {/* Top Row: Search + Stats + Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        {/* Search & Symbol Info */}
        <div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto items-start lg:items-center">
            <div className="relative w-full sm:w-64 z-30 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                    />
                </svg>
                </div>
                <input
                type="text"
                placeholder="Пошук (напр. BTC)"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700"
                />
                {showSuggestions && filteredSymbols.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-2">
                    {filteredSymbols.map((sym) => (
                    <div
                        key={sym}
                        onMouseDown={() => {
                        setSymbol(sym);
                        setSearch(sym);
                        setShowSuggestions(false);
                        }}
                        className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center ${
                        sym === symbol ? "bg-blue-50 text-blue-700" : "text-gray-700"
                        }`}
                    >
                        <span>{sym}</span>
                        <span className="text-xs text-gray-400">USDT</span>
                    </div>
                    ))}
                </div>
                )}
            </div>

            {/* Ticker Stats Display */}
            {stats && (
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-x-6 gap-y-3 text-xs sm:text-sm items-center w-full lg:w-auto">
                    <div className="flex flex-col whitespace-nowrap">
                        <span className="text-gray-400 text-[10px] uppercase">Ціна</span>
                        <span className={`font-bold text-lg ${parseFloat(stats.priceChangePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPrice(stats.lastPrice)}
                        </span>
                    </div>
                    <div className="flex flex-col whitespace-nowrap">
                        <span className="text-gray-400 text-[10px] uppercase">Зміна 24h</span>
                        <span className={`font-medium ${parseFloat(stats.priceChangePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(stats.priceChangePercent) >= 0 ? '+' : ''}{stats.priceChangePercent}%
                        </span>
                    </div>
                    <div className="flex flex-col sm:border-l sm:border-gray-200 sm:pl-3 whitespace-nowrap">
                        <span className="text-gray-400 text-[10px] uppercase">24h High</span>
                        <span className="font-medium text-gray-700">{formatPrice(stats.highPrice)}</span>
                    </div>
                    <div className="flex flex-col whitespace-nowrap">
                        <span className="text-gray-400 text-[10px] uppercase">24h Low</span>
                        <span className="font-medium text-gray-700">{formatPrice(stats.lowPrice)}</span>
                    </div>
                    <div className="flex flex-col sm:border-l sm:border-gray-200 sm:pl-3 whitespace-nowrap col-span-2 sm:col-span-1">
                        <span className="text-gray-400 text-[10px] uppercase">24h Vol (USDT)</span>
                        <span className="font-medium text-gray-700">{formatVol(stats.quoteVolume)}</span>
                    </div>
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto justify-start xl:justify-end">
            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
            <button
                onClick={() => setOverlays((p) => ({ ...p, sma: !p.sma }))}
                className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded transition-all ${
                overlays.sma
                    ? "bg-white text-yellow-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
            >
                SMA
            </button>
            <button
                onClick={() => setOverlays((p) => ({ ...p, ema: !p.ema }))}
                className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded transition-all ${
                overlays.ema
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
            >
                EMA
            </button>
            <button
                onClick={() => setOverlays((p) => ({ ...p, bb: !p.bb }))}
                className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded transition-all ${
                overlays.bb
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
            >
                BB
            </button>
            <div className="w-px bg-gray-300 mx-1 h-4 self-center"></div>
            <button
                onClick={() => setOverlays((p) => ({ ...p, patterns: !p.patterns }))}
                className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                overlays.patterns
                    ? "bg-white text-red-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
            >
                <span>Патерни</span>
            </button>
            </div>

            <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>

            <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar max-w-full">
            {["1m", "5m", "15m", "1h", "4h", "1d", "1w"].map((intv) => (
                <button
                key={intv}
                onClick={() => setTimeInterval(intv)}
                className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    interval === intv
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                >
                {intv}
                </button>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChartHeader;