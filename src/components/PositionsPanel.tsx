import type { OpenPositionsResponse } from '../types/api';

type Props = {
  data: OpenPositionsResponse | null;
  isLoading?: boolean;
};

export default function PositionsPanel({ data, isLoading = false }: Props) {
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
        {data?.positions.map((position) => (
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
            <p style={{ margin: '6px 0' }}>SL: {position.stopLoss ?? '—'}</p>
            <p style={{ margin: '6px 0' }}>TP: {position.takeProfit ?? '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}