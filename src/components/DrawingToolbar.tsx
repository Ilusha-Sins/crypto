import React from "react";
import { DrawingObject } from "../types";

interface DrawingToolbarProps {
  drawTool: 'cursor' | 'line' | 'rect' | 'text' | 'fib';
  setDrawTool: (tool: 'cursor' | 'line' | 'rect' | 'text' | 'fib') => void;
  setDrawings: (d: DrawingObject[]) => void;
}

export default function DrawingToolbar({ drawTool, setDrawTool, setDrawings }: DrawingToolbarProps) {
  const tools = [
    { id: 'cursor', label: 'Вказівник', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5' },
    { id: 'line', label: 'Трендова лінія', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { id: 'rect', label: 'Зона підтримки', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z' },
    { id: 'fib', label: 'Рівні Фібоначчі', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { id: 'text', label: 'Текст', icon: 'M5 8V6h14v2M12 6v14' }
  ];

  return (
    <nav className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-row lg:flex-col gap-2 items-center" aria-label="Інструменти графічного аналізу">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setDrawTool(tool.id as any)}
          aria-label={tool.label}
          title={tool.label}
          aria-pressed={drawTool === tool.id}
          className={`p-2.5 rounded-xl transition-all ${
            drawTool === tool.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
          </svg>
        </button>
      ))}
      <div className="w-full lg:w-8 h-px lg:h-px bg-slate-100 my-1"></div>
      <button
        onClick={() => setDrawings([])}
        aria-label="Видалити всі малюнки"
        className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </nav>
  );
}