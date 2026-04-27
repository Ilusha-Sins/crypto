import { DrawingObject } from '../types';

interface DrawingToolbarProps {
  drawTool: 'cursor' | 'line' | 'rect' | 'text' | 'fib';
  setDrawTool: (tool: 'cursor' | 'line' | 'rect' | 'text' | 'fib') => void;
  setDrawings: (d: DrawingObject[]) => void;
}

const tools = [
  {
    id: 'cursor',
    label: 'Вказівник',
    icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5',
  },
  {
    id: 'line',
    label: 'Трендова лінія',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    id: 'rect',
    label: 'Зона підтримки',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z',
  },
  {
    id: 'fib',
    label: 'Рівні Фібоначчі',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  },
  {
    id: 'text',
    label: 'Текст',
    icon: 'M5 8V6h14v2M12 6v14',
  },
] as const;

function ToolButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      style={{
        padding: 10,
        borderRadius: 12,
        border: '1px solid #2a2a2a',
        background: active ? 'rgba(37, 99, 235, 0.18)' : '#171717',
        color: active ? '#93c5fd' : '#9ca3af',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <svg
        style={{ width: 22, height: 22 }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
    </button>
  );
}

export default function DrawingToolbar({
  drawTool,
  setDrawTool,
  setDrawings,
}: DrawingToolbarProps) {
  return (
    <nav
      aria-label="Інструменти графічного аналізу"
      style={{
        background: '#111',
        border: '1px solid #2a2a2a',
        borderRadius: 16,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        width: 60,
      }}
    >
      {tools.map((tool) => (
        <ToolButton
          key={tool.id}
          active={drawTool === tool.id}
          label={tool.label}
          icon={tool.icon}
          onClick={() => setDrawTool(tool.id)}
        />
      ))}

      <div
        style={{
          width: '100%',
          height: 1,
          background: '#2a2a2a',
          margin: '4px 0',
        }}
      />

      <button
        onClick={() => setDrawings([])}
        aria-label="Видалити всі малюнки"
        title="Видалити всі малюнки"
        style={{
          padding: 10,
          borderRadius: 12,
          border: '1px solid #3f1d1d',
          background: '#1a1111',
          color: '#f87171',
          cursor: 'pointer',
        }}
      >
        <svg
          style={{ width: 22, height: 22 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </nav>
  );
}