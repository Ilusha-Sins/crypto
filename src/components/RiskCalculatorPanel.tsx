import RiskCalculator from './RiskCalculator';
import { useMarketPriceStream } from '../hooks/useMarketPriceStream';
import {
  errorBannerStyle,
  liveBadgeStyle,
  panelHeaderStyle,
  panelStyle,
} from '../styles/ui';

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
        ...panelStyle,
        overflow: 'hidden',
      }}
    >
      <div style={panelHeaderStyle}>
        <strong>{selectedSymbolFull}</strong>

        <div style={{ fontSize: 13, opacity: 0.9 }}>
          Price:{' '}
          {isLoading && currentPrice <= 0
            ? 'Loading...'
            : currentPrice > 0
              ? currentPrice
              : '—'}{' '}
          {isLive ? <span style={liveBadgeStyle}>LIVE</span> : null}
        </div>
      </div>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      <RiskCalculator currentPrice={currentPrice} />
    </div>
  );
}