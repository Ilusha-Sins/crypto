import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  buttonSecondaryStyle,
  cardStyle,
  inputStyle,
  liveBadgeStyle,
  panelPaddedStyle,
  subtleTextStyle,
} from '../styles/ui';

interface ChartHeaderProps {
  symbol: string;
  setSymbol: (s: string) => void;
  interval: string;
  setInterval: (i: string) => void;
  overlays: { sma: boolean; ema: boolean; bb: boolean; patterns: boolean };
  setOverlays: React.Dispatch<
    React.SetStateAction<{
      sma: boolean;
      ema: boolean;
      bb: boolean;
      patterns: boolean;
    }>
  >;
  symbolsList: string[];
}

interface TickerStats {
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
  lastPrice: string;
}

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const;

function formatVol(val: string) {
  const num = parseFloat(val);
  if (num > 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num > 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num > 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatPrice(val: string | number) {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (Number.isNaN(num)) return '—';
  if (num === 0) return '0.00';
  if (num < 1) return num.toFixed(4);
  if (num < 10) return num.toFixed(3);
  return num.toFixed(2);
}

function ToggleButton({
  active,
  label,
  activeColor,
  onClick,
}: {
  active: boolean;
  label: string;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid #2a2a2a',
        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? activeColor : '#9ca3af',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function IntervalButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid #2a2a2a',
        background: active ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
        color: active ? '#93c5fd' : '#9ca3af',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export default function ChartHeader({
  symbol,
  setSymbol,
  interval,
  setInterval: setTimeInterval,
  overlays,
  setOverlays,
  symbolsList,
}: ChartHeaderProps) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stats, setStats] = useState<TickerStats | null>(null);

  const filteredSymbols = useMemo(
    () =>
      symbolsList.filter((sym) =>
        sym.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, symbolsList],
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
          params: { symbol: `${symbol}USDT` },
        });
        setStats(res.data);
      } catch (error) {
        console.error('Stats fetch error', error);
      }
    };

    void fetchStats();
    const timerId = window.setInterval(fetchStats, 5000);
    return () => clearInterval(timerId);
  }, [symbol]);

  const isPositive = stats ? parseFloat(stats.priceChangePercent) >= 0 : false;

  return (
    <div style={{ ...panelPaddedStyle, position: 'relative', zIndex: 20 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              flex: 1,
              minWidth: 320,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 280,
                zIndex: 30,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: '#6b7280',
                }}
              >
                <svg
                  style={{ width: 18, height: 18 }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
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
                onChange={(event) => {
                  setSearch(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{
                  ...inputStyle,
                  paddingLeft: 38,
                  fontWeight: 700,
                }}
              />

              {showSuggestions && filteredSymbols.length > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '100%',
                    background: '#111',
                    border: '1px solid #2a2a2a',
                    borderRadius: 12,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
                    maxHeight: 240,
                    overflowY: 'auto',
                  }}
                >
                  {filteredSymbols.map((sym) => (
                    <div
                      key={sym}
                      onMouseDown={() => {
                        setSymbol(sym);
                        setSearch(sym);
                        setShowSuggestions(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: sym === symbol ? '#93c5fd' : '#e5e7eb',
                        background:
                          sym === symbol ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                        borderBottom: '1px solid #1b1b1b',
                      }}
                    >
                      <span>{sym}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>USDT</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {stats ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: 12,
                }}
              >
                <div style={cardStyle}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                    Ціна
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 22,
                      color: isPositive ? '#4ade80' : '#f87171',
                    }}
                  >
                    {formatPrice(stats.lastPrice)}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                    Зміна 24h
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: isPositive ? '#4ade80' : '#f87171',
                    }}
                  >
                    {isPositive ? '+' : ''}
                    {stats.priceChangePercent}%
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                    24h High
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatPrice(stats.highPrice)}</div>
                </div>

                <div style={cardStyle}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                    24h Low
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatPrice(stats.lowPrice)}</div>
                </div>

                <div style={cardStyle}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                    24h Vol
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatVol(stats.quoteVolume)}</div>
                </div>
              </div>
            ) : (
              <div style={{ ...subtleTextStyle, fontSize: 13 }}>Loading market stats...</div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'flex-start',
              minWidth: 320,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                padding: 4,
                borderRadius: 10,
                background: '#171717',
                border: '1px solid #2a2a2a',
              }}
            >
              <ToggleButton
                active={overlays.sma}
                label="SMA"
                activeColor="#fbbf24"
                onClick={() => setOverlays((prev) => ({ ...prev, sma: !prev.sma }))}
              />
              <ToggleButton
                active={overlays.ema}
                label="EMA"
                activeColor="#c084fc"
                onClick={() => setOverlays((prev) => ({ ...prev, ema: !prev.ema }))}
              />
              <ToggleButton
                active={overlays.bb}
                label="BB"
                activeColor="#93c5fd"
                onClick={() => setOverlays((prev) => ({ ...prev, bb: !prev.bb }))}
              />
              <div
                style={{
                  width: 1,
                  background: '#2a2a2a',
                  margin: '0 4px',
                }}
              />
              <ToggleButton
                active={overlays.patterns}
                label="Патерни"
                activeColor="#f87171"
                onClick={() =>
                  setOverlays((prev) => ({ ...prev, patterns: !prev.patterns }))
                }
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                padding: 4,
                borderRadius: 10,
                background: '#171717',
                border: '1px solid #2a2a2a',
                maxWidth: '100%',
                overflowX: 'auto',
              }}
            >
              {INTERVALS.map((intv) => (
                <IntervalButton
                  key={intv}
                  active={interval === intv}
                  label={intv}
                  onClick={() => setTimeInterval(intv)}
                />
              ))}
            </div>

            <div style={{ fontSize: 13 }}>
              <span style={{ color: '#9ca3af' }}>Active symbol:</span>{' '}
              <strong>{symbol}USDT</strong>
              <span style={liveBadgeStyle}>LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}