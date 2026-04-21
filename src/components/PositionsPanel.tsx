import { useEffect, useState } from 'react';
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

export default function PositionsPanel({
  data,
  isLoading = false,
  onPositionUpdated,
}: Props) {
  const [drafts, setDrafts] = useState<DraftState>({});

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
              <p style={{ margin: '6px 0' }}>Avg entry: {position.averageEntryPrice}</p>
              <p style={{ margin: '6px 0' }}>Current price: {position.currentPrice ?? '—'}</p>
              <p style={{ margin: '6px 0' }}>Unrealized PnL: {position.unrealizedPnl ?? '—'}</p>
              <p style={{ margin: '6px 0' }}>PnL %: {position.pnlPercent ?? '—'}</p>
              <p style={{ margin: '6px 0' }}>Current SL: {position.stopLoss ?? '—'}</p>
              <p style={{ margin: '6px 0 12px 0' }}>Current TP: {position.takeProfit ?? '—'}</p>

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
                >
                  {draft.isSaving ? 'Saving...' : 'Save risk'}
                </button>

                <button
                  type="button"
                  onClick={() => handleClear(position.id)}
                  disabled={draft.isSaving}
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