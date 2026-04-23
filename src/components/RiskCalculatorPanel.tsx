import RiskCalculator from './RiskCalculator';
import { useMarketPriceStream } from '../hooks/useMarketPriceStream';

type Props = {
  selectedSymbolFull: string;
  fallbackPrice: number;
};

export default function RiskCalculatorPanel({
  selectedSymbolFull,
  fallbackPrice,
}: Props) {
  const { price: livePrice, isLive, isLoading, error } = useMarketPriceStream(
    selectedSymbolFull,
    {
      initialPrice: fallbackPrice > 0 ? fallbackPrice : 0,
      enabled: Boolean(selectedSymbolFull),
    },
  );

  const currentPrice = livePrice > 0 ? livePrice : fallbackPrice;

  return (
    <div
      style={{
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#111',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2a2a2a',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <strong>{selectedSymbolFull}</strong>

        <div style={{ fontSize: 13, opacity: 0.9 }}>
          Price:{' '}
          {isLoading && currentPrice <= 0
            ? 'Loading...'
            : currentPrice > 0
              ? currentPrice
              : '—'}{' '}
          {isLive ? (
            <span
              style={{
                marginLeft: 6,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(37, 99, 235, 0.18)',
                color: '#93c5fd',
                fontWeight: 700,
              }}
            >
              LIVE
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #2a2a2a',
            color: '#ff6b6b',
            background: '#1a1111',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <RiskCalculator currentPrice={currentPrice} />
    </div>
  );
}