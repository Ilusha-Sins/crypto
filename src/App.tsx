import { useEffect, useState } from 'react';
import { getMyAccount, resetMyAccount } from './api/account.api';
import { getOpenPositions } from './api/positions.api';
import { useAuth } from './auth/useAuth';
import TradingPanel from './components/TradingPanel';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import type { DemoAccount, OpenPositionsResponse } from './types/api';

type Screen = 'login' | 'register';

export default function App() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();

  const [screen, setScreen] = useState<Screen>('login');
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [positions, setPositions] = useState<OpenPositionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  async function loadDashboard() {
    setIsDashboardLoading(true);
    setError(null);

    try {
      const [accountResult, positionsResult] = await Promise.all([
        getMyAccount(),
        getOpenPositions(),
      ]);

      setAccount(accountResult);
      setPositions(positionsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsDashboardLoading(false);
    }
  }

  async function handleReset() {
    setError(null);

    try {
      await resetMyAccount();
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset account');
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadDashboard();
    } else {
      setAccount(null);
      setPositions(null);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading auth...</div>;
  }

  if (!isAuthenticated) {
    return screen === 'login' ? (
      <LoginPage
        onSuccess={() => void loadDashboard()}
        onSwitchToRegister={() => setScreen('register')}
      />
    ) : (
      <RegisterPage
        onSuccess={() => void loadDashboard()}
        onSwitchToLogin={() => setScreen('login')}
      />
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1>Crypto Demo Trading</h1>
      <p>Logged in as: {user?.email}</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => void loadDashboard()} disabled={isDashboardLoading}>
          Refresh dashboard
        </button>
        <button onClick={() => void handleReset()}>
          Reset demo account
        </button>
        <button onClick={logout}>Logout</button>
      </div>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      {isDashboardLoading ? <p>Loading dashboard...</p> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 420px) 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <TradingPanel onOrderCreated={loadDashboard} />

        <div>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <h2>Account</h2>
            <p>Cash balance: {account?.cashBalance ?? '—'} USDT</p>
            <p>Initial balance: {account?.initialBalance ?? '—'} USDT</p>
            <p>Reset count: {account?.resetCount ?? 0}</p>
          </div>

          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <h2>Open positions</h2>
            {positions?.positions?.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {positions.positions.map((position) => (
                  <div
                    key={position.id}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <strong>{position.symbol}</strong>
                    <p>Quantity: {position.quantity}</p>
                    <p>Avg entry: {position.averageEntryPrice}</p>
                    <p>Current price: {position.currentPrice ?? '—'}</p>
                    <p>Unrealized PnL: {position.unrealizedPnl ?? '—'}</p>
                    <p>PnL %: {position.pnlPercent ?? '—'}</p>
                    <p>SL: {position.stopLoss ?? '—'}</p>
                    <p>TP: {position.takeProfit ?? '—'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No open positions</p>
            )}
          </div>

          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2>Recent orders</h2>
            {account?.orders?.length ? (
              <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(account.orders, null, 2)}
              </pre>
            ) : (
              <p>No recent orders</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}