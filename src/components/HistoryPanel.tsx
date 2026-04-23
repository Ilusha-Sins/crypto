import { useEffect, useMemo, useState } from 'react';
import {
  getOrdersHistory,
  getTradesHistory,
  getTradingSummary,
} from '../api/history.api';
import type {
  OrdersHistoryResponse,
  TradesHistoryResponse,
  TradingSummary,
} from '../types/api';
import {
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  cardStyle,
  dangerTextStyle,
  inputStyle,
  labelStyle,
  makeTabButtonStyle,
  panelPaddedStyle,
  selectStyle,
  subtleTextStyle,
  withDisabled,
} from '../styles/ui';

type Props = {
  selectedSymbolFull: string;
  refreshKey?: number;
};

type SideFilter = '' | 'BUY' | 'SELL';
type ActiveTab = 'trades' | 'rejectedOrders';

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function pnlColor(value: string | null | undefined) {
  if (!value) return '#fff';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '#fff';
  if (numeric > 0) return '#51cf66';
  if (numeric < 0) return '#ff6b6b';
  return '#fff';
}

function PaginationControls({
  page,
  totalPages,
  isLoading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginTop: 16,
      }}
    >
      <button
        onClick={onPrev}
        disabled={isLoading || page <= 1}
        style={withDisabled(buttonSecondaryStyle, isLoading || page <= 1)}
      >
        Previous
      </button>

      <span style={{ opacity: 0.8 }}>
        Page {totalPages === 0 ? 0 : page} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={isLoading || totalPages === 0 || page >= totalPages}
        style={withDisabled(
          buttonSecondaryStyle,
          isLoading || totalPages === 0 || page >= totalPages,
        )}
      >
        Next
      </button>
    </div>
  );
}

export default function HistoryPanel({
  selectedSymbolFull,
  refreshKey = 0,
}: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('trades');

  const [orders, setOrders] = useState<OrdersHistoryResponse | null>(null);
  const [trades, setTrades] = useState<TradesHistoryResponse | null>(null);
  const [summary, setSummary] = useState<TradingSummary | null>(null);

  const [draftSymbol, setDraftSymbol] = useState(selectedSymbolFull);
  const [draftSide, setDraftSide] = useState<SideFilter>('');

  const [appliedSymbol, setAppliedSymbol] = useState(selectedSymbolFull);
  const [appliedSide, setAppliedSide] = useState<SideFilter>('');

  const [ordersPage, setOrdersPage] = useState(1);
  const [tradesPage, setTradesPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(10);
  const [tradesLimit, setTradesLimit] = useState(10);

  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isTradesLoading, setIsTradesLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    setDraftSymbol(selectedSymbolFull);
    setAppliedSymbol(selectedSymbolFull);
    setDraftSide('');
    setAppliedSide('');
    setOrdersPage(1);
    setTradesPage(1);
    setActiveTab('trades');
  }, [selectedSymbolFull]);

  const rejectedOrdersQuery = useMemo(
    () =>
      buildQuery({
        symbol: appliedSymbol.trim().toUpperCase(),
        side: appliedSide,
        status: 'REJECTED',
        page: ordersPage,
        limit: ordersLimit,
      }),
    [appliedSymbol, appliedSide, ordersPage, ordersLimit],
  );

  const tradesQuery = useMemo(
    () =>
      buildQuery({
        symbol: appliedSymbol.trim().toUpperCase(),
        side: appliedSide,
        page: tradesPage,
        limit: tradesLimit,
      }),
    [appliedSymbol, appliedSide, tradesPage, tradesLimit],
  );

  async function loadRejectedOrders() {
    setIsOrdersLoading(true);
    setOrdersError(null);

    try {
      const result = await getOrdersHistory(rejectedOrdersQuery);
      setOrders(result);
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : 'Failed to load rejected orders',
      );
    } finally {
      setIsOrdersLoading(false);
    }
  }

  async function loadTrades() {
    setIsTradesLoading(true);
    setTradesError(null);

    try {
      const result = await getTradesHistory(tradesQuery);
      setTrades(result);
    } catch (err) {
      setTradesError(
        err instanceof Error ? err.message : 'Failed to load trades history',
      );
    } finally {
      setIsTradesLoading(false);
    }
  }

  async function loadSummary() {
    setIsSummaryLoading(true);
    setSummaryError(null);

    try {
      const result = await getTradingSummary();
      setSummary(result);
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : 'Failed to load trading summary',
      );
    } finally {
      setIsSummaryLoading(false);
    }
  }

  async function handleRefreshAll() {
    await Promise.all([loadRejectedOrders(), loadTrades(), loadSummary()]);
  }

  function handleApplyFilters() {
    setAppliedSymbol(draftSymbol.trim().toUpperCase());
    setAppliedSide(draftSide);
    setOrdersPage(1);
    setTradesPage(1);
  }

  function handleClearFilters() {
    setDraftSymbol('');
    setDraftSide('');
    setAppliedSymbol('');
    setAppliedSide('');
    setOrdersPage(1);
    setTradesPage(1);
  }

  useEffect(() => {
    void loadRejectedOrders();
  }, [rejectedOrdersQuery, refreshKey]);

  useEffect(() => {
    void loadTrades();
  }, [tradesQuery, refreshKey]);

  useEffect(() => {
    void loadSummary();
  }, [refreshKey]);

  const tabButtonStyle = (tab: ActiveTab) =>
    makeTabButtonStyle(activeTab === tab);

  return (
    <div style={panelPaddedStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>History</h2>
          <p style={{ margin: '6px 0 0 0', ...subtleTextStyle }}>
            Trades = executed actions, Rejected Orders = failed submissions
          </p>
        </div>

        <button
          onClick={() => void handleRefreshAll()}
          disabled={isOrdersLoading || isTradesLoading || isSummaryLoading}
          style={withDisabled(
            buttonSecondaryStyle,
            isOrdersLoading || isTradesLoading || isSummaryLoading,
          )}
        >
          Refresh history
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr auto auto',
          gap: 12,
          marginBottom: 20,
          alignItems: 'end',
        }}
      >
        <div>
          <label htmlFor="history-symbol" style={labelStyle}>
            Symbol
          </label>
          <input
            id="history-symbol"
            value={draftSymbol}
            onChange={(event) => setDraftSymbol(event.target.value)}
            placeholder="BTCUSDT or empty = all"
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="history-side" style={labelStyle}>
            Side
          </label>
          <select
            id="history-side"
            value={draftSide}
            onChange={(event) => setDraftSide(event.target.value as SideFilter)}
            style={selectStyle}
          >
            <option value="">All</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleApplyFilters}
          style={buttonPrimaryStyle}
        >
          Apply
        </button>

        <button
          type="button"
          onClick={handleClearFilters}
          style={buttonSecondaryStyle}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={cardStyle}>
          <strong>Total trades</strong>
          <p>{summary?.totalTrades ?? '—'}</p>
        </div>
        <div style={cardStyle}>
          <strong>Closed trades</strong>
          <p>{summary?.closedTrades ?? '—'}</p>
        </div>
        <div style={cardStyle}>
          <strong>Realized PnL</strong>
          <p style={{ color: pnlColor(summary?.totalRealizedPnl) }}>
            {summary?.totalRealizedPnl ?? '—'}
          </p>
        </div>
        <div style={cardStyle}>
          <strong>Win rate</strong>
          <p>{summary?.winRate ?? '—'}%</p>
        </div>
      </div>

      {summaryError ? (
        <p style={{ ...dangerTextStyle, marginBottom: 16 }}>{summaryError}</p>
      ) : null}

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('trades')}
          style={tabButtonStyle('trades')}
        >
          Trades ({trades?.total ?? 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejectedOrders')}
          style={tabButtonStyle('rejectedOrders')}
        >
          Rejected Orders ({orders?.total ?? 0})
        </button>
      </div>

      {activeTab === 'trades' ? (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              flexWrap: 'wrap',
            }}
          >
            <h3 style={{ margin: 0 }}>Trades</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="trades-limit">Per page</label>
              <select
                id="trades-limit"
                value={tradesLimit}
                onChange={(event) => {
                  setTradesLimit(Number(event.target.value));
                  setTradesPage(1);
                }}
                style={{
                  ...selectStyle,
                  width: 92,
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {tradesError ? <p style={dangerTextStyle}>{tradesError}</p> : null}
          {isTradesLoading ? <p>Loading trades...</p> : null}

          {!isTradesLoading && !tradesError && !trades?.items?.length ? (
            <p>No trades</p>
          ) : null}

          {trades?.items?.length ? (
            <>
              <div style={{ display: 'grid', gap: 10 }}>
                {trades.items.map((item) => (
                  <div key={item.id} style={cardStyle}>
                    <strong>{item.symbol}</strong>
                    <p style={{ margin: '6px 0' }}>Side: {item.side}</p>
                    <p style={{ margin: '6px 0' }}>Qty: {item.quantity}</p>
                    <p style={{ margin: '6px 0' }}>Price: {item.price}</p>
                    <p
                      style={{
                        margin: '6px 0',
                        color: pnlColor(item.realizedPnl),
                      }}
                    >
                      Realized PnL: {item.realizedPnl ?? '—'}
                    </p>
                    <p style={{ margin: '6px 0 0 0', opacity: 0.7 }}>
                      {new Date(item.executedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <PaginationControls
                page={trades.page}
                totalPages={trades.totalPages}
                isLoading={isTradesLoading}
                onPrev={() => setTradesPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setTradesPage((prev) => prev + 1)}
              />
            </>
          ) : null}
        </div>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              flexWrap: 'wrap',
            }}
          >
            <h3 style={{ margin: 0 }}>Rejected Orders</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="orders-limit">Per page</label>
              <select
                id="orders-limit"
                value={ordersLimit}
                onChange={(event) => {
                  setOrdersLimit(Number(event.target.value));
                  setOrdersPage(1);
                }}
                style={{
                  ...selectStyle,
                  width: 92,
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {ordersError ? <p style={dangerTextStyle}>{ordersError}</p> : null}
          {isOrdersLoading ? <p>Loading rejected orders...</p> : null}

          {!isOrdersLoading && !ordersError && !orders?.items?.length ? (
            <p>No rejected orders</p>
          ) : null}

          {orders?.items?.length ? (
            <>
              <div style={{ display: 'grid', gap: 10 }}>
                {orders.items.map((item) => (
                  <div key={item.id} style={cardStyle}>
                    <strong>{item.symbol}</strong>
                    <p style={{ margin: '6px 0' }}>Side: {item.side}</p>
                    <p style={{ margin: '6px 0' }}>Qty: {item.quantity}</p>
                    <p style={{ margin: '6px 0' }}>
                      Price: {item.executionPrice ?? '—'}
                    </p>
                    <p style={{ margin: '6px 0' }}>Status: {item.status}</p>
                    {item.rejectionReason ? (
                      <p style={{ margin: '6px 0', ...dangerTextStyle }}>
                        Reason: {item.rejectionReason}
                      </p>
                    ) : null}
                    <p style={{ margin: '6px 0 0 0', opacity: 0.7 }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <PaginationControls
                page={orders.page}
                totalPages={orders.totalPages}
                isLoading={isOrdersLoading}
                onPrev={() => setOrdersPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setOrdersPage((prev) => prev + 1)}
              />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}