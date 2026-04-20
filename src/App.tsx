import { useEffect, useState } from 'react';
import { getMyAccount, resetMyAccount } from './api/account.api';
import { useAuth } from './auth/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import type { DemoAccount } from './types/api';

type Screen = 'login' | 'register';

export default function App() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);

  async function loadAccount() {
    setIsAccountLoading(true);
    setError(null);

    try {
      const result = await getMyAccount();
      setAccount(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setIsAccountLoading(false);
    }
  }

  async function handleReset() {
    try {
      const result = await resetMyAccount();
      setAccount(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset account');
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadAccount();
    } else {
      setAccount(null);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading auth...</div>;
  }

  if (!isAuthenticated) {
    return screen === 'login' ? (
      <LoginPage
        onSuccess={() => void loadAccount()}
        onSwitchToRegister={() => setScreen('register')}
      />
    ) : (
      <RegisterPage
        onSuccess={() => void loadAccount()}
        onSwitchToLogin={() => setScreen('login')}
      />
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Crypto Demo Trading</h1>
      <p>Logged in as: {user?.email}</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={() => void loadAccount()} disabled={isAccountLoading}>
          Refresh account
        </button>
        <button onClick={() => void handleReset()}>Reset demo account</button>
        <button onClick={logout}>Logout</button>
      </div>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      {isAccountLoading ? <p>Loading account...</p> : null}

      {account ? (
        <div>
          <h2>Demo Account</h2>
          <p>Cash balance: {account.cashBalance} USDT</p>
          <p>Initial balance: {account.initialBalance} USDT</p>
          <p>Reset count: {account.resetCount}</p>

          <h3>Open positions</h3>
          <pre>{JSON.stringify(account.positions, null, 2)}</pre>

          <h3>Recent orders</h3>
          <pre>{JSON.stringify(account.orders, null, 2)}</pre>

          <h3>Recent trades</h3>
          <pre>{JSON.stringify(account.trades, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}