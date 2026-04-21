import { useEffect, useState } from 'react';
import { getMarketPrice } from '../api/market.api';
import RiskCalculator from './RiskCalculator';

type Props = {
  selectedSymbolFull: string;
};

export default function RiskCalculatorPanel({ selectedSymbolFull }: Props) {
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPrice() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getMarketPrice(selectedSymbolFull);
      setCurrentPrice(Number(result.price));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load price');
      setCurrentPrice(0);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPrice();

    const intervalId = window.setInterval(() => {
      void loadPrice();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [selectedSymbolFull]);

  return (
    <div
      style={{
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#111',
      }}
    >
      {error ? (
        <div
          style={{
            margin: 12,
            padding: 12,
            borderRadius: 10,
            background: '#3a1212',
            border: '1px solid #6b1f1f',
            color: '#fff',
          }}
        >
          {error}
        </div>
      ) : null}

      {isLoading && currentPrice === 0 ? (
        <div style={{ padding: 16, color: '#fff' }}>Loading market price...</div>
      ) : (
        <RiskCalculator currentPrice={currentPrice} />
      )}
    </div>
  );
}