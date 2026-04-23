import { useEffect, useState } from 'react';
import { createMarketStreamUrl } from '../api/market.api';
import { updatePositionRisk } from '../api/positions.api';
import type { OpenPositionsResponse } from '../types/api';

type Props = {
  data: OpenPositionsResponse | null;
  isLoading?: boolean;
  onPositionUpdated?: () => Promise<void> | void;
};

type DraftState = Record<
  string,
  {
    stopLoss: string;
    takeProfit: string;
    isSaving: boolean;
    error: string | null;
    success: string | null;
  }
>;

type LivePriceMap = Record<string, string>;

function trimTrailingZeros(value: string) {
  return value.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');
}

function formatPriceNumber(value: number) {
  if (!Number.isFinite(value)) return null;

  if (Math.abs(value) >= 1000) {
    return value.toFixed(2);
  }

  if (Math.abs(value) >= 1) {
    return trimTrailingZeros(value.toFixed(4));
  }

  return trimTrailingZeros(value.toFixed(6));
}

function formatPnlNumber(value: number) {
  if (!Number.isFinite(value)) return null;
  return trimTrailingZeros(value.toFixed(4));
}

function formatPercentNumber(value: number) {
  if (!Number.isFinite(value)) return null;
  return trimTrailingZeros(value.toFixed(2));
}

function pnlColor(value: string | null | undefined) {
  if (!value) return '#fff';

  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '#fff';
  if (numeric > 0) return '#51cf66';
  if (numeric < 0) return '#ff6b6b';
  return '#fff';
}

function calculateLiveMetrics(
  position: OpenPositionsResponse['positions'][number],
  livePrice: string | undefined,
) {
  if (!livePrice) {
    return {
      currentPrice: position.currentPrice,
      currentValue: position.currentValue,
      unrealizedPnl: position.unrealizedPnl,
      pnlPercent: position.pnlPercent,
      isLive: false,
    };
  }

  const quantity = Number(position.quantity);
  const averageEntryPrice = Number(position.averageEntryPrice);
  const currentPrice = Number(livePrice);

  if (
    Number.isNaN(quantity) ||
    Number.isNaN(averageEntryPrice) ||
    Number.isNaN(currentPrice)
  ) {
    return {
      currentPrice: position.currentPrice,
      currentValue: position.currentValue,
      unrealizedPnl: position.unrealizedPnl,
      pnlPercent: position.pnlPercent,
      isLive: false,
    };
  }

  const currentValue = currentPrice * quantity;
  const investedValue = averageEntryPrice * quantity;
  const unrealizedPnl = (currentPrice - averageEntryPrice) * quantity;
  const pnlPercent =
    investedValue === 0 ? 0 : (unrealizedPnl / investedValue) * 100;

  return {
    currentPrice: formatPriceNumber(currentPrice),
    currentValue: formatPriceNumber(currentValue),
    unrealizedPnl: formatPnlNumber(unrealizedPnl),
    pnlPercent: formatPercentNumber(pnlPercent),
    isLive: true,
  };
}

export default function PositionsPanel({
  data,
  isLoading = false,
  onPositionUpdated,
}: Props) {
  const [drafts, setDrafts] = useState<DraftState>({});
  const [livePrices, setLivePrices] = useState<LivePriceMap>({});

  useEffect(() => {
    if (!data?.positions) {
      setDrafts({});
      return;
    }

    setDrafts((prev) => {
      const next: DraftState = {};

      for (const position of data.positions) {
        next[position.id] = {
          stopLoss: prev[position.id]?.stopLoss ?? (position.stopLoss ?? ''),
          takeProfit: prev[position.id]?.takeProfit ?? (position.takeProfit ?? ''),
          isSaving: false,
          error: null,
          success: null,
        };
      }

      return next;
    });
  }, [data]);

  useEffect(() => {
    const symbols = Array.from(
      new Set((data?.positions ?? []).map((position) => position.symbol)),
    );

    if (symbols.length === 0) {
      setLivePrices({});
      return;
    }

    setLivePrices((prev) => {
      const next: LivePriceMap = {};

      for (const symbol of symbols) {
        if (prev[symbol]) {
          next[symbol] = prev[symbol];
        }
      }

      return next;
    });

    const sources = symbols.map((symbol) => {
      const source = new EventSource(createMarketStreamUrl(symbol, '1m'));

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            symbol: string;
            interval: string;
            candle: {
              openTime: number;
              open: number;
              high: number;
              low: number;
              close: number;
              volume: number;
              closeTime: number;
            };
          };

          const nextPrice = String(payload.candle.close);

          setLivePrices((prev) => {
            if (prev[symbol] === nextPrice) {
              return prev;
            }

            return {
              ...prev,
              [symbol]: nextPrice,
            };
          });
        } catch (error) {
          console.error('Failed to parse position stream payload', error);
        }
      };

      source.onerror = () => {
        // EventSource will try to reconnect automatically.
      };

      return source;
    });

    return () => {
      for (const source of sources) {
        source.close();
      }
    };
  }, [data]);

  function updateDraft(
    positionId: string,
    patch: Partial<DraftState[string]>,
  ) {
    setDrafts((prev) => ({
      ...prev,
      [positionId]: {
        stopLoss: prev[positionId]?.stopLoss ?? '',
        takeProfit: prev[positionId]?.takeProfit ?? '',
        isSaving: prev[positionId]?.isSaving ?? false,
        error: prev[positionId]?.error ?? null,
        success: prev[positionId]?.success ?? null,
        ...patch,
      },
    }));
  }

  async function handleSave(positionId: string) {
    const draft = drafts[positionId];

    if (!draft) {
      return;
    }

    updateDraft(positionId, {
      isSaving: true,
      error: null,
      success: null,
    });

    try {
      await updatePositionRisk(positionId, {
        stopLoss: draft.stopLoss.trim() ? draft.stopLoss.trim() : null,
        takeProfit: draft.takeProfit.trim() ? draft.takeProfit.trim() : null,
      });

      updateDraft(positionId, {
        isSaving: false,
        success: 'Risk levels updated',
      });

      await onPositionUpdated?.();
    } catch (err) {
      updateDraft(positionId, {
        isSaving: false,
        error: err instanceof Error ? err.message : 'Failed to update risk',
      });
    }
  }

  function handleClear(positionId: string) {
    updateDraft(positionId, {
      stopLoss: '',
      takeProfit: '',
      error: null,
      success: null,
    });
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
      <h2 style={{ marginTop: 0 }}>Open Positions</h2>

      {isLoading ? <p>Loading positions...</p> : null}

      {!isLoading && (!data || data.positions.length === 0) ? (
        <p>No open positions</p>
      ) : null}

      <div style={{ display: 'grid', gap: 12 }}>
        {data?.positions.map((position) => {
          const draft = drafts[position.id] ?? {
            stopLoss: position.stopLoss ?? '',
            takeProfit: position.takeProfit ?? '',
            isSaving: false,
            error: null,
            success: null,
          };

          const metrics = calculateLiveMetrics(
            position,
            livePrices[position.symbol],
          );

          return (
            <div
              key={position.id}
              style={{
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: 12,
                background: '#171717',
              }}
            >
              <strong>{position.symbol}</strong>
              <p style={{ margin: '6px 0' }}>Quantity: {position.quantity}</p>
              <p style={{ margin: '6px 0' }}>
                Avg entry: {position.averageEntryPrice}
              </p>

              <p style={{ margin: '6px 0' }}>
                Current price: {metrics.currentPrice ?? '—'}{' '}
                {metrics.isLive ? (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 8,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(37, 99, 235, 0.18)',
                      color: '#93c5fd',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                    }}
                  >
                    LIVE
                  </span>
                ) : null}
              </p>

              <p style={{ margin: '6px 0' }}>
                Current value: {metrics.currentValue ?? '—'}
              </p>

              <p
                style={{
                  margin: '6px 0',
                  color: pnlColor(metrics.unrealizedPnl),
                }}
              >
                Unrealized PnL: {metrics.unrealizedPnl ?? '—'}
              </p>

              <p
                style={{
                  margin: '6px 0',
                  color: pnlColor(metrics.pnlPercent),
                }}
              >
                PnL %: {metrics.pnlPercent ?? '—'}
              </p>

              <p style={{ margin: '6px 0' }}>
                Current SL: {position.stopLoss ?? '—'}
              </p>
              <p style={{ margin: '6px 0 12px 0' }}>
                Current TP: {position.takeProfit ?? '—'}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <label
                    htmlFor={`sl-${position.id}`}
                    style={{ display: 'block', marginBottom: 6 }}
                  >
                    Stop Loss
                  </label>
                  <input
                    id={`sl-${position.id}`}
                    value={draft.stopLoss}
                    onChange={(event) =>
                      updateDraft(position.id, {
                        stopLoss: event.target.value,
                        error: null,
                        success: null,
                      })
                    }
                    placeholder="Empty = clear"
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #2a2a2a',
                      background: '#111',
                      color: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`tp-${position.id}`}
                    style={{ display: 'block', marginBottom: 6 }}
                  >
                    Take Profit
                  </label>
                  <input
                    id={`tp-${position.id}`}
                    value={draft.takeProfit}
                    onChange={(event) =>
                      updateDraft(position.id, {
                        takeProfit: event.target.value,
                        error: null,
                        success: null,
                      })
                    }
                    placeholder="Empty = clear"
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid #2a2a2a',
                      background: '#111',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              {draft.error ? (
                <p style={{ color: '#ff6b6b', margin: '6px 0' }}>{draft.error}</p>
              ) : null}

              {draft.success ? (
                <p style={{ color: '#51cf66', margin: '6px 0' }}>{draft.success}</p>
              ) : null}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => void handleSave(position.id)}
                  disabled={draft.isSaving}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #2a2a2a',
                    background: '#2563eb',
                    color: '#fff',
                    cursor: draft.isSaving ? 'not-allowed' : 'pointer',
                    opacity: draft.isSaving ? 0.6 : 1,
                  }}
                >
                  {draft.isSaving ? 'Saving...' : 'Save risk'}
                </button>

                <button
                  type="button"
                  onClick={() => handleClear(position.id)}
                  disabled={draft.isSaving}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #2a2a2a',
                    background: '#111',
                    color: '#fff',
                    cursor: draft.isSaving ? 'not-allowed' : 'pointer',
                    opacity: draft.isSaving ? 0.6 : 1,
                  }}
                >
                  Clear inputs
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}