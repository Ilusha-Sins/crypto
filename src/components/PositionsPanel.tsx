import { useEffect, useMemo, useState } from 'react';
import {
  getClosedPositions,
  getPositionById,
  updatePositionRisk,
} from '../api/positions.api';
import type {
  ClosedPositionItem,
  ClosedPositionsResponse,
  OpenPositionItem,
  OpenPositionsResponse,
  PositionDetailsResponse,
} from '../types/api';

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

type DetailsState = Record<
  string,
  {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    data: PositionDetailsResponse | null;
  }
>;

type Tab = 'open' | 'closed';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function pnlColor(value: string | null | undefined) {
  if (!value) return '#fff';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '#fff';
  if (numeric > 0) return '#51cf66';
  if (numeric < 0) return '#ff6b6b';
  return '#fff';
}

export default function PositionsPanel({
  data,
  isLoading = false,
  onPositionUpdated,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('open');
  const [drafts, setDrafts] = useState<DraftState>({});
  const [closedData, setClosedData] = useState<ClosedPositionsResponse | null>(null);
  const [isClosedLoading, setIsClosedLoading] = useState(false);
  const [closedError, setClosedError] = useState<string | null>(null);
  const [details, setDetails] = useState<DetailsState>({});

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
    void loadClosedPositions();
  }, [data]);

  async function loadClosedPositions() {
    setIsClosedLoading(true);
    setClosedError(null);

    try {
      const response = await getClosedPositions();
      setClosedData(response);
    } catch (err) {
      setClosedError(
        err instanceof Error ? err.message : 'Failed to load closed positions',
      );
    } finally {
      setIsClosedLoading(false);
    }
  }

  function updateDraft(positionId: string, patch: Partial<DraftState[string]>) {
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
      await loadClosedPositions();
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

  async function toggleDetails(positionId: string) {
    const existing = details[positionId];

    if (existing?.isOpen) {
      setDetails((prev) => ({
        ...prev,
        [positionId]: {
          ...prev[positionId],
          isOpen: false,
        },
      }));
      return;
    }

    if (existing?.data) {
      setDetails((prev) => ({
        ...prev,
        [positionId]: {
          ...prev[positionId],
          isOpen: true,
          error: null,
        },
      }));
      return;
    }

    setDetails((prev) => ({
      ...prev,
      [positionId]: {
        isOpen: true,
        isLoading: true,
        error: null,
        data: null,
      },
    }));

    try {
      const response = await getPositionById(positionId);

      setDetails((prev) => ({
        ...prev,
        [positionId]: {
          isOpen: true,
          isLoading: false,
          error: null,
          data: response,
        },
      }));
    } catch (err) {
      setDetails((prev) => ({
        ...prev,
        [positionId]: {
          isOpen: true,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load details',
          data: null,
        },
      }));
    }
  }

  const openPositions = useMemo(() => data?.positions ?? [], [data]);
  const closedPositions = useMemo(
    () => closedData?.positions ?? [],
    [closedData],
  );

  function renderDetails(positionId: string) {
    const detailState = details[positionId];

    if (!detailState?.isOpen) {
      return null;
    }

    return (
      <div
        style={{
          marginTop: 12,
          padding: 12,
          border: '1px solid #2a2a2a',
          borderRadius: 10,
          background: '#101010',
        }}
      >
        {detailState.isLoading ? <p>Loading details...</p> : null}
        {detailState.error ? (
          <p style={{ color: '#ff6b6b' }}>{detailState.error}</p>
        ) : null}

        {detailState.data ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div>
                <strong>Status</strong>
                <p>{detailState.data.status}</p>
              </div>
              <div>
                <strong>Opened</strong>
                <p>{formatDate(detailState.data.openedAt)}</p>
              </div>
              <div>
                <strong>Closed</strong>
                <p>{formatDate(detailState.data.closedAt)}</p>
              </div>
              <div>
                <strong>Invested</strong>
                <p>{detailState.data.investedValue}</p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div>
                <strong>Current price</strong>
                <p>{detailState.data.currentPrice ?? '—'}</p>
              </div>
              <div>
                <strong>Current value</strong>
                <p>{detailState.data.currentValue ?? '—'}</p>
              </div>
              <div>
                <strong>Unrealized PnL</strong>
                <p style={{ color: pnlColor(detailState.data.unrealizedPnl) }}>
                  {detailState.data.unrealizedPnl ?? '—'}
                </p>
              </div>
              <div>
                <strong>PnL %</strong>
                <p style={{ color: pnlColor(detailState.data.pnlPercent) }}>
                  {detailState.data.pnlPercent ?? '—'}
                </p>
              </div>
            </div>

            <div>
              <h4 style={{ marginTop: 0 }}>Trades</h4>

              {detailState.data.trades.length === 0 ? (
                <p>No trades for this position</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {detailState.data.trades.map((trade) => (
                    <div
                      key={trade.id}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background: '#171717',
                        border: '1px solid #242424',
                      }}
                    >
                      <strong>
                        {trade.side} · {trade.symbol}
                      </strong>
                      <p style={{ margin: '6px 0' }}>Qty: {trade.quantity}</p>
                      <p style={{ margin: '6px 0' }}>Price: {trade.price}</p>
                      <p
                        style={{
                          margin: '6px 0',
                          color: pnlColor(trade.realizedPnl),
                        }}
                      >
                        Realized PnL: {trade.realizedPnl ?? '—'}
                      </p>
                      <p style={{ margin: '6px 0 0 0', opacity: 0.75 }}>
                        {formatDate(trade.executedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  function renderOpenPosition(position: OpenPositionItem) {
    const draft = drafts[position.id] ?? {
      stopLoss: position.stopLoss ?? '',
      takeProfit: position.takeProfit ?? '',
      isSaving: false,
      error: null,
      success: null,
    };

    const detailState = details[position.id];

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'start',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong>{position.symbol}</strong>
            <p style={{ margin: '6px 0' }}>Quantity: {position.quantity}</p>
            <p style={{ margin: '6px 0' }}>
              Avg entry: {position.averageEntryPrice}
            </p>
            <p style={{ margin: '6px 0' }}>
              Current price: {position.currentPrice ?? '—'}
            </p>
            <p
              style={{
                margin: '6px 0',
                color: pnlColor(position.unrealizedPnl),
              }}
            >
              Unrealized PnL: {position.unrealizedPnl ?? '—'}
            </p>
            <p
              style={{
                margin: '6px 0',
                color: pnlColor(position.pnlPercent),
              }}
            >
              PnL %: {position.pnlPercent ?? '—'}
            </p>
            <p style={{ margin: '6px 0' }}>Current SL: {position.stopLoss ?? '—'}</p>
            <p style={{ margin: '6px 0 12px 0' }}>
              Current TP: {position.takeProfit ?? '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void toggleDetails(position.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2a2a2a',
              background: '#111',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {detailState?.isOpen ? 'Hide details' : 'View details'}
          </button>
        </div>

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

        {renderDetails(position.id)}
      </div>
    );
  }

  function renderClosedPosition(position: ClosedPositionItem) {
    const detailState = details[position.id];

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'start',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong>{position.symbol}</strong>
            <p style={{ margin: '6px 0' }}>Quantity: {position.quantity}</p>
            <p style={{ margin: '6px 0' }}>
              Avg entry: {position.averageEntryPrice}
            </p>
            <p style={{ margin: '6px 0' }}>Opened: {formatDate(position.openedAt)}</p>
            <p style={{ margin: '6px 0' }}>Closed: {formatDate(position.closedAt)}</p>
            <p style={{ margin: '6px 0' }}>Final SL: {position.stopLoss ?? '—'}</p>
            <p style={{ margin: '6px 0' }}>Final TP: {position.takeProfit ?? '—'}</p>
          </div>

          <button
            type="button"
            onClick={() => void toggleDetails(position.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2a2a2a',
              background: '#111',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {detailState?.isOpen ? 'Hide details' : 'View details'}
          </button>
        </div>

        {renderDetails(position.id)}
      </div>
    );
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>Positions</h2>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setActiveTab('open')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2a2a2a',
              background: activeTab === 'open' ? '#1f1f1f' : '#111',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Open ({data?.count ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('closed')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2a2a2a',
              background: activeTab === 'closed' ? '#1f1f1f' : '#111',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Closed ({closedData?.count ?? 0})
          </button>
        </div>
      </div>

      {activeTab === 'open' ? (
        <>
          {isLoading ? <p>Loading positions...</p> : null}

          {!isLoading && openPositions.length === 0 ? (
            <p>No open positions</p>
          ) : null}

          <div style={{ display: 'grid', gap: 12 }}>
            {openPositions.map(renderOpenPosition)}
          </div>
        </>
      ) : (
        <>
          {isClosedLoading ? <p>Loading closed positions...</p> : null}
          {closedError ? <p style={{ color: '#ff6b6b' }}>{closedError}</p> : null}

          {!isClosedLoading && !closedError && closedPositions.length === 0 ? (
            <p>No closed positions yet</p>
          ) : null}

          <div style={{ display: 'grid', gap: 12 }}>
            {closedPositions.map(renderClosedPosition)}
          </div>
        </>
      )}
    </div>
  );
}