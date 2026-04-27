interface GaugeProps {
  value: number;
  label: string;
}

export default function Gauge({ value, label }: GaugeProps) {
  const angle = Math.max(-90, Math.min(90, value * 90));

  let color = '#94a3b8';
  let text = 'Нейтрально';

  if (value > 0.15) {
    color = value > 0.5 ? '#059669' : '#10b981';
    text = value > 0.5 ? 'Активно купувати' : 'Купувати';
  } else if (value < -0.15) {
    color = value < -0.5 ? '#dc2626' : '#f87171';
    text = value < -0.5 ? 'Активно продавати' : 'Продавати';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: '#171717',
        borderRadius: 16,
        border: '1px solid #2a2a2a',
        minWidth: 220,
        color: '#fff',
      }}
    >
      <h4
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#9ca3af',
          margin: '0 0 16px 0',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
        }}
      >
        {label}
      </h4>

      <div style={{ position: 'relative', width: 192, height: 96, marginBottom: 16 }}>
        <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%' }}>
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1f2937"
            strokeWidth="16"
            strokeLinecap="round"
          />

          <path
            d="M 20 100 A 80 80 0 0 1 45 45"
            fill="none"
            stroke="rgba(220, 38, 38, 0.22)"
            strokeWidth="16"
          />
          <path
            d="M 45 45 A 80 80 0 0 1 85 22"
            fill="none"
            stroke="rgba(248, 113, 113, 0.22)"
            strokeWidth="16"
          />
          <path
            d="M 85 22 A 80 80 0 0 1 115 22"
            fill="none"
            stroke="#273244"
            strokeWidth="16"
          />
          <path
            d="M 115 22 A 80 80 0 0 1 155 45"
            fill="none"
            stroke="rgba(16, 185, 129, 0.22)"
            strokeWidth="16"
          />
          <path
            d="M 155 45 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(5, 150, 105, 0.22)"
            strokeWidth="16"
          />

          <line x1="20" y1="100" x2="10" y2="100" stroke="#475569" strokeWidth="1" />
          <line x1="180" y1="100" x2="190" y2="100" stroke="#475569" strokeWidth="1" />
          <line x1="100" y1="20" x2="100" y2="10" stroke="#475569" strokeWidth="1" />

          <g transform={`rotate(${angle}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="25"
              stroke="#e5e7eb"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="6" fill="#e5e7eb" />
            <circle cx="100" cy="100" r="2" fill="#111827" />
          </g>
        </svg>
      </div>

      <div
        style={{
          padding: '6px 14px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color,
          backgroundColor: `${color}18`,
          border: `1px solid ${color}33`,
        }}
      >
        {text}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          fontFamily:
            'ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, monospace',
          color: '#9ca3af',
        }}
      >
        SCORE: {value.toFixed(2)}
      </div>
    </div>
  );
}