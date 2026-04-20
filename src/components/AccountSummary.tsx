type Props = {
  cashBalance?: string | null;
  initialBalance?: string | null;
  resetCount?: number;
  userEmail?: string | null;
  onRefresh?: () => void;
  onReset?: () => void;
  onLogout?: () => void;
  isLoading?: boolean;
};

export default function AccountSummary({
  cashBalance,
  initialBalance,
  resetCount,
  userEmail,
  onRefresh,
  onReset,
  onLogout,
  isLoading = false,
}: Props) {
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
      <h2 style={{ marginTop: 0 }}>Account</h2>

      <p style={{ margin: '6px 0' }}>User: {userEmail ?? '—'}</p>
      <p style={{ margin: '6px 0' }}>Cash balance: {cashBalance ?? '—'} USDT</p>
      <p style={{ margin: '6px 0' }}>Initial balance: {initialBalance ?? '—'} USDT</p>
      <p style={{ margin: '6px 0' }}>Reset count: {resetCount ?? 0}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button onClick={onRefresh} disabled={isLoading}>
          Refresh
        </button>
        <button onClick={onReset}>Reset account</button>
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}