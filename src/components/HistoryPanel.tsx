import { useEffect, useState } from 'react';
import { getOrdersHistory, getTradesHistory, getTradingSummary } from '../api/history.api';
import type {
  OrdersHistoryResponse,
  TradesHistoryResponse,
  TradingSummary,
} from '../types/api';

type Props = {
  selectedSymbolFull: string;
  refreshKey?: number;
};

export default function HistoryPanel({
  selectedSymbolFull,
  refreshKey = 0,
}: Props) {
  const [orders, setOrders] = useState<OrdersHistoryResponse | null>(null);
  const [trades, setTrades] = useState<TradesHistoryResponse | null>(null);
  const [summary, setSummary] = useState<TradingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    setIsLoading(true);
    setError(null);

    try {
      const query = `?symbol=${selectedSymbolFull}&page=1&limit=10`;

      const [ordersResult, tradesResult, summaryResult] = await Promise.all([
        getOrdersHistory(query),
        getTradesHistory(query),
        getTradingSummary(),
      ]);

      setOrders(ordersResult);
      setTrades(tradesResult);
      setSummary(summaryResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, [selectedSymbolFull, refreshKey]);

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
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>History</h2>
        <button onClick={() => void loadHistory()} disabled={isLoading}>
          Refresh history
        </button>
      </div>

      <p style={{ opacity: 0.8 }}>Active symbol: {selectedSymbolFull}</p>

      {error ? <p style={{ color: '#ff6b6b' }}>{error}</p> : null}
      {isLoading ? <p>Loading history...</p> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ padding: 12, border: '1px solid #2a2a2a', borderRadius: 10 }}>
          <strong>Total trades</strong>
          <p>{summary?.totalTrades ?? '—'}</p>
        </div>
        <div style={{ padding: 12, border: '1px solid #2a2a2a', borderRadius: 10 }}>
          <strong>Closed trades</strong>
          <p>{summary?.closedTrades ?? '—'}</p>
        </div>
        <div style={{ padding: 12, border: '1px solid #2a2a2a', borderRadius: 10 }}>
          <strong>Realized PnL</strong>
          <p>{summary?.totalRealizedPnl ?? '—'}</p>
        </div>
        <div style={{ padding: 12, border: '1px solid #2a2a2a', borderRadius: 10 }}>
          <strong>Win rate</strong>
          <p>{summary?.winRate ?? '—'}%</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <div>
          <h3>Recent Orders</h3>
          {orders?.items?.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {orders.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    border: '1px solid #2a2a2a',
                    borderRadius: 10,
                    background: '#171717',
                  }}
                >
                  <strong>{item.symbol}</strong>
                  <p style={{ margin: '6px 0' }}>Side: {item.side}</p>
                  <p style={{ margin: '6px 0' }}>Qty: {item.quantity}</p>
                  <p style={{ margin: '6px 0' }}>Price: {item.executionPrice ?? '—'}</p>
                  <p style={{ margin: '6px 0' }}>Status: {item.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No orders</p>
          )}
        </div>

        <div>
          <h3>Recent Trades</h3>
          {trades?.items?.length ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {trades.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 12,
                    border: '1px solid #2a2a2a',
                    borderRadius: 10,
                    background: '#171717',
                  }}
                >
                  <strong>{item.symbol}</strong>
                  <p style={{ margin: '6px 0' }}>Side: {item.side}</p>
                  <p style={{ margin: '6px 0' }}>Qty: {item.quantity}</p>
                  <p style={{ margin: '6px 0' }}>Price: {item.price}</p>
                  <p style={{ margin: '6px 0' }}>Realized PnL: {item.realizedPnl ?? '—'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No trades</p>
          )}
        </div>
      </div>
    </div>
  );
}