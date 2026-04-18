import React from "react";

interface GaugeProps {
  value: number; // -1 (Strong Sell) to 1 (Strong Buy)
  label: string;
}

export default function Gauge({ value, label }: GaugeProps) {
  const angle = Math.max(-90, Math.min(90, value * 90));

  
  let color = "#94a3b8"; 
  let text = "Нейтрально";
  
  if (value > 0.15) {
      color = value > 0.5 ? "#059669" : "#10b981"; 
      text = value > 0.5 ? "Активно купувати" : "Купувати";
  } else if (value < -0.15) {
      color = value < -0.5 ? "#dc2626" : "#f87171";
      text = value < -0.5 ? "Активно продавати" : "Продавати";
  }

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-sm border border-slate-100 min-w-[220px] transition-all hover:shadow-md">
      <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">{label}</h4>
      
      <div className="relative w-48 h-24 mb-4">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background Arc Track */}
          <path 
            d="M 20 100 A 80 80 0 0 1 180 100" 
            fill="none" 
            stroke="#f1f5f9" 
            strokeWidth="16" 
            strokeLinecap="round"
          />
          
          {/* Segmented Tracks for visual guide */}
          {/* Strong Sell */}
          <path d="M 20 100 A 80 80 0 0 1 45 45" fill="none" stroke="#fee2e2" strokeWidth="16" />
          {/* Sell */}
          <path d="M 45 45 A 80 80 0 0 1 85 22" fill="none" stroke="#fecaca" strokeWidth="16" />
          {/* Neutral */}
          <path d="M 85 22 A 80 80 0 0 1 115 22" fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {/* Buy */}
          <path d="M 115 22 A 80 80 0 0 1 155 45" fill="none" stroke="#d1fae5" strokeWidth="16" />
          {/* Strong Buy */}
          <path d="M 155 45 A 80 80 0 0 1 180 100" fill="none" stroke="#a7f3d0" strokeWidth="16" />

          {/* Indicators for limits */}
          <line x1="20" y1="100" x2="10" y2="100" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="180" y1="100" x2="190" y2="100" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="100" y1="20" x2="100" y2="10" stroke="#cbd5e1" strokeWidth="1" />

          {/* The Needle */}
          <g transform={`rotate(${angle}, 100, 100)`} className="transition-transform duration-1000 ease-out">
            <line 
              x1="100" y1="100" 
              x2="100" y2="25" 
              stroke="#1e293b" 
              strokeWidth="3" 
              strokeLinecap="round" 
            />
            <circle cx="100" cy="100" r="6" fill="#1e293b" />
            <circle cx="100" cy="100" r="2" fill="white" />
          </g>
        </svg>
      </div>

      <div 
        className="px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-tighter transition-all duration-500 shadow-sm"
        style={{ color: color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        {text}
      </div>
      
      {/* Numerical representation */}
      <div className="mt-2 text-[10px] font-mono text-slate-400">
        SCORE: {(value).toFixed(2)}
      </div>
    </div>
  );
}
