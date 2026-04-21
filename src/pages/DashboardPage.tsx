import { useEffect, useMemo, useState } from 'react';
import CandlestickChart from '../components/CandlestickChart';
import TradingPanel from '../components/TradingPanel';
import AccountSummary from '../components/AccountSummary';
import PositionsPanel from '../components/PositionsPanel';
import HistoryPanel from '../components/HistoryPanel';
import AnalysisPanel from '../components/AnalysisPanel';
import OrderBookPanel from '../components/OrderBookPanel';
import RiskCalculatorPanel from '../components/RiskCalculatorPanel';
import { getMyAccount, resetMyAccount } from '../api/account.api';
import { getOpenPositions } from '../api/positions.api';
import type { DemoAccount, OpenPositionsResponse, StoredUser } from '../types/api';

type Props = {
  user: StoredUser | null;
  onLogout: () => void;
};

export default function DashboardPage({ user, onLogout }: Props) {
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [positions, setPositions] = useState<OpenPositionsResponse | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [analysisRefreshKey, setAnalysisRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedSymbolFull = useMemo(
    () => `${selectedSymbol.toUpperCase()}USDT`,
    [selectedSymbol],
  );

  async function loadDashboard() {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }

  async function handleReset() {
    setError(null);

    try {
      await resetMyAccount();
      await loadDashboard();
      setHistoryRefreshKey((prev) => prev + 1);
      setAnalysisRefreshKey((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset account');
    }
  }

  async function handleOrderCreated() {
    await loadDashboard();
    setHistoryRefreshKey((prev) => prev + 1);
    setAnalysisRefreshKey((prev) => prev + 1);
  }

  async function handlePositionUpdated() {
    await loadDashboard();
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b0b0b',
        color: '#fff',
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ marginBottom: 8 }}>Crypto Demo Trading Dashboard</h1>
          <p style={{ opacity: 0.8, margin: 0 }}>
            Shared symbol: {selectedSymbolFull}
          </p>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              background: '#3a1212',
              border: '1px solid #6b1f1f',
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: 16,
            alignItems: 'start',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              border: '1px solid #2a2a2a',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#111',
              minHeight: 700,
            }}
          >
            <CandlestickChart
              selectedSymbol={selectedSymbol}
              onSymbolChange={setSelectedSymbol}
            />
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <AccountSummary
              userEmail={user?.email ?? null}
              cashBalance={account?.cashBalance ?? null}
              initialBalance={account?.initialBalance ?? null}
              resetCount={account?.resetCount ?? 0}
              onRefresh={() => void loadDashboard()}
              onReset={() => void handleReset()}
              onLogout={onLogout}
              isLoading={isLoading}
            />

            <TradingPanel
              selectedSymbol={selectedSymbol}
              onSymbolChange={setSelectedSymbol}
              onOrderCreated={handleOrderCreated}
            />

            <PositionsPanel
              data={positions}
              isLoading={isLoading}
              onPositionUpdated={handlePositionUpdated}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <RiskCalculatorPanel selectedSymbolFull={selectedSymbolFull} />
          <OrderBookPanel selectedSymbol={selectedSymbol} />
        </div>

        <HistoryPanel
          selectedSymbolFull={selectedSymbolFull}
          refreshKey={historyRefreshKey}
        />

        <div style={{ marginTop: 16 }}>
          <AnalysisPanel
            selectedSymbolFull={selectedSymbolFull}
            refreshKey={analysisRefreshKey}
          />
        </div>
      </div>
    </div>
  );
}