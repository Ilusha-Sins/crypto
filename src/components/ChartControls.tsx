import React, { useState } from "react";
import { Interval, INTERVALS } from "../types";

interface ChartControlsProps {
  symbol: string;
  setSymbol: (s: string) => void;
  interval: Interval;
  setInterval: (i: Interval) => void;
  symbolsList: string[];
}

export default function ChartControls({ 
  symbol, setSymbol, interval, setInterval, symbolsList 
}: ChartControlsProps) {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSymbols = symbolsList.filter(sym => 
    sym.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="chart-controls">
      {/* Search Input */}
      <div className="search-container">
        <div className="search-icon">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Пошук (напр. BTC)"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="search-input"
        />
        {showSuggestions && filteredSymbols.length > 0 && (
          <div className="search-suggestions">
            {filteredSymbols.map(sym => (
              <div
                key={sym}
                onMouseDown={() => { setSymbol(sym); setSearch(sym); setShowSuggestions(false); }}
                className={`suggestion-item ${sym === symbol ? "active" : ""}`}
              >
                <span>{sym}</span>
                <span className="suggestion-sub">USDT</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interval Buttons */}
      <div className="interval-group">
        {INTERVALS.map((intv) => (
          <button
            key={intv}
            onClick={() => setInterval(intv)}
            className={`interval-btn ${interval === intv ? "active" : ""}`}
          >
            {intv}
          </button>
        ))}
      </div>
    </div>
  );
}
