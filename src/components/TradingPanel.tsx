import { FormEvent, useEffect, useMemo, useState } from 'react';
import { placeMarketOrder } from '../api/orders.api';
import { useMarketPriceStream } from '../hooks/useMarketPriceStream';

type Props = {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  onOrderCreated?: () => Promise<void> | void;
};

type Side = 'BUY' | 'SELL';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: '1px solid #2a2a2a',
  background: '#171717',
  color: '#fff',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: '1px solid #2a2a2a',
  background: '#171717',
  color: '#fff',
};

export default function TradingPanel({
  selectedSymbol,
  onSymbolChange,
  onOrderCreated,
}: Props) {
  const [symbolInput, setSymbolInput] = useState(selectedSymbol);
  const [side, setSide] = useState<Side>('BUY');
  const [quantity, setQuantity] = useState('0.001');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setSymbolInput(selectedSymbol);
  }, [selectedSymbol]);

  const normalizedBaseSymbol = useMemo(
    () => symbolInput.trim().toUpperCase(),
    [symbolInput],
  );

  const normalizedFullSymbol = useMemo(
    () => `${normalizedBaseSymbol}USDT`,
    [normalizedBaseSymbol],
  );

  const { price: livePrice, isLive, isLoading: isPriceLoading } =
    useMarketPriceStream(normalizedFullSymbol, {
      enabled: Boolean(normalizedBaseSymbol),
    });

  const estimatedValue = useMemo(() => {
    const qty = Number(quantity);

    if (Number.isNaN(qty) || qty <= 0 || livePrice <= 0) {
      return null;
    }

    return qty * livePrice;
  }, [livePrice, quantity]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const payload =
        side === 'BUY'
          ? {
              symbol: normalizedFullSymbol,
              side,
              quantity,
              ...(stopLoss.trim() ? { stopLoss: stopLoss.trim() } : {}),
              ...(takeProfit.trim() ? { takeProfit: takeProfit.trim() } : {}),
            }
          : {
              symbol: normalizedFullSymbol,
              side,
              quantity,
            };

      await placeMarketOrder(payload);

      setSuccessMessage(
        side === 'BUY'
          ? `BUY order for ${normalizedFullSymbol} executed`
          : `SELL order for ${normalizedFullSymbol} executed`,
      );

      onSymbolChange(normalizedBaseSymbol);
      await onOrderCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order request failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        padding: 16,
        background: '#111',
        color: '#fff',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Trading Panel</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="symbol" style={{ display: 'block', marginBottom: 6 }}>
            Symbol
          </label>
          <input
            id="symbol"
            style={inputStyle}
            value={symbolInput}
            onChange={(event) => setSymbolInput(event.target.value)}
            onBlur={() => onSymbolChange(normalizedBaseSymbol)}
            placeholder="BTC"
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 8,
              flexWrap: 'wrap',
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            <small>Order symbol: {normalizedFullSymbol}</small>
            <small>
              Live price:{' '}
              {isPriceLoading
                ? 'Loading...'
                : livePrice > 0
                  ? livePrice
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
            </small>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="side" style={{ display: 'block', marginBottom: 6 }}>
            Side
          </label>
          <select
            id="side"
            style={selectStyle}
            value={side}
            onChange={(event) => setSide(event.target.value as Side)}
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="quantity" style={{ display: 'block', marginBottom: 6 }}>
            Quantity
          </label>
          <input
            id="quantity"
            style={inputStyle}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="0.001"
          />
          <small style={{ display: 'block', marginTop: 8, opacity: 0.8 }}>
            Estimated notional:{' '}
            {estimatedValue !== null ? `$${estimatedValue.toFixed(2)}` : '—'}
          </small>
        </div>

        {side === 'BUY' ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <label
                htmlFor="stopLoss"
                style={{ display: 'block', marginBottom: 6 }}
              >
                Stop Loss
              </label>
              <input
                id="stopLoss"
                style={inputStyle}
                value={stopLoss}
                onChange={(event) => setStopLoss(event.target.value)}
                placeholder="Optional"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                htmlFor="takeProfit"
                style={{ display: 'block', marginBottom: 6 }}
              >
                Take Profit
              </label>
              <input
                id="takeProfit"
                style={inputStyle}
                value={takeProfit}
                onChange={(event) => setTakeProfit(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </>
        ) : null}

        {error ? <p style={{ color: '#ff6b6b', marginBottom: 12 }}>{error}</p> : null}
        {successMessage ? (
          <p style={{ color: '#51cf66', marginBottom: 12 }}>{successMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #2a2a2a',
            background: '#2563eb',
            color: '#fff',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Submitting...' : `Execute ${side}`}
        </button>
      </form>
    </div>
  );
}