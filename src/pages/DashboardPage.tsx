import { useEffect, useMemo, useState } from 'react';
import CandlestickChart from '../components/CandlestickChart';
import TradingPanel from '../components/TradingPanel';
import AccountSummary from '../components/AccountSummary';
import PositionsPanel from '../components/PositionsPanel';
import HistoryPanel from '../components/HistoryPanel';
import AnalysisPanel from '../components/AnalysisPanel';
import OrderBookPanel from '../components/OrderBookPanel';
import RiskCalculatorPanel from '../components/RiskCalculatorPanel';
import TechnicalAnalysis from '../components/TechnicalAnalysis';
import { getMyAccount, resetMyAccount } from '../api/account.api';
import { getOpenPositions } from '../api/positions.api';
import type { DemoAccount, OpenPositionsResponse, StoredUser } from '../types/api';
import { panelStyle } from '../styles/ui';

type Props = {
  user: StoredUser | null;
  onLogout: () => void;
};

type MarketSnapshot = {
  symbol: string;
  interval: string;
  candles: any[];
  currentPrice: number;
  isLoading: boolean;
  errorMsg: string | null;
};

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          color: '#f9fafb',
        }}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          style={{
            margin: '6px 0 0 0',
            fontSize: 14,
            color: '#9ca3af',
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function StatChip({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'accent' | 'success' | 'danger';
}) {
  const color =
    tone === 'accent'
      ? '#93c5fd'
      : tone === 'success'
        ? '#86efac'
        : tone === 'danger'
          ? '#fca5a5'
          : '#e5e7eb';

  const background =
    tone === 'accent'
      ? 'rgba(37, 99, 235, 0.12)'
      : tone === 'success'
        ? 'rgba(22, 163, 74, 0.12)'
        : tone === 'danger'
          ? 'rgba(220, 38, 38, 0.12)'
          : '#171717';

  const borderColor =
    tone === 'accent'
      ? 'rgba(37, 99, 235, 0.28)'
      : tone === 'success'
        ? 'rgba(22, 163, 74, 0.28)'
        : tone === 'danger'
          ? 'rgba(220, 38, 38, 0.28)'
          : '#2a2a2a';

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background,
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage({ user, onLogout }: Props) {
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [positions, setPositions] = useState<OpenPositionsResponse | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [analysisRefreshKey, setAnalysisRefreshKey] = useState(0);
  const [marketSnapshot, setMarketSnapshot] = useState<MarketSnapshot>({
    symbol: 'BTC',
    interval: '1m',
    candles: [],
    currentPrice: 0,
    isLoading: true,
    errorMsg: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedSymbolFull = useMemo(
    () => `${selectedSymbol.toUpperCase()}USDT`,
    [selectedSymbol],
  );

  const openPositionsCount = positions?.count ?? 0;
  const currentPriceLabel =
    marketSnapshot.currentPrice > 0 ? String(marketSnapshot.currentPrice) : '—';

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
        background:
          'radial-gradient(circle at top, rgba(37,99,235,0.08), transparent 28%), #090909',
        color: '#fff',
        padding: '20px 16px 40px',
      }}
    >
      <div
        style={{
          maxWidth: 1680,
          margin: '0 auto',
          display: 'grid',
          gap: 20,
        }}
      >
        <header
          style={{
            ...panelStyle,
            padding: 20,
            background:
              'linear-gradient(180deg, rgba(17,17,17,0.98), rgba(11,11,11,0.98))',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: 'rgba(37, 99, 235, 0.14)',
                  border: '1px solid rgba(37, 99, 235, 0.22)',
                  color: '#93c5fd',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  marginBottom: 12,
                }}
              >
                LIVE DEMO
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.1,
                  fontWeight: 900,
                  letterSpacing: -0.6,
                  color: '#f9fafb',
                }}
              >
                Crypto Demo Trading Dashboard
              </h1>

              <p
                style={{
                  margin: '10px 0 0 0',
                  color: '#9ca3af',
                  fontSize: 15,
                  maxWidth: 760,
                  lineHeight: 1.6,
                }}
              >
                Unified trading workspace with charting, order flow, live pricing,
                positions, AI analysis and trading history.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'stretch',
              }}
            >
              <StatChip
                label="Shared Symbol"
                value={selectedSymbolFull}
                tone="accent"
              />
              <StatChip
                label="Current Price"
                value={currentPriceLabel}
                tone="neutral"
              />
              <StatChip
                label="Open Positions"
                value={String(openPositionsCount)}
                tone={openPositionsCount > 0 ? 'success' : 'neutral'}
              />
              <StatChip
                label="Chart Interval"
                value={marketSnapshot.interval || '—'}
                tone="neutral"
              />
            </div>
          </div>
        </header>

        {error ? (
          <div
            style={{
              ...panelStyle,
              padding: 14,
              background: '#1a1111',
              borderColor: '#3f1d1d',
              color: '#fca5a5',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 20,
              minWidth: 0,
            }}
          >
            <div>
              <SectionTitle
                title="Market Chart"
                subtitle="Live candlestick chart, overlays, drawing tools and volume profile."
              />
              <div
                style={{
                  ...panelStyle,
                  overflow: 'hidden',
                  minHeight: 760,
                  background:
                    'linear-gradient(180deg, rgba(17,17,17,1), rgba(10,10,10,1))',
                }}
              >
                <CandlestickChart
                  selectedSymbol={selectedSymbol}
                  onSymbolChange={setSelectedSymbol}
                  onMarketDataChange={setMarketSnapshot}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                alignItems: 'start',
              }}
            >
              <div>
                <SectionTitle
                  title="Risk & Planning"
                  subtitle="Position sizing and live price context for the active symbol."
                />
                <RiskCalculatorPanel
                  selectedSymbolFull={selectedSymbolFull}
                  fallbackPrice={marketSnapshot.currentPrice}
                />
              </div>

              <div>
                <SectionTitle
                  title="Order Book"
                  subtitle="Market depth for the shared trading symbol."
                />
                <OrderBookPanel selectedSymbol={selectedSymbol} />
              </div>
            </div>

            <div>
              <SectionTitle
                title="Technical Analysis"
                subtitle="Local indicator stack and pivot interpretation for the current chart data."
              />
              <TechnicalAnalysis
                candles={marketSnapshot.candles}
                symbol={selectedSymbol}
                interval={marketSnapshot.interval}
              />
            </div>
          </div>

          <aside
            style={{
              display: 'grid',
              gap: 20,
              position: 'sticky',
              top: 16,
            }}
          >
            <div>
              <SectionTitle
                title="Account"
                subtitle="User balance, reset controls and demo account state."
              />
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
            </div>

            <div>
              <SectionTitle
                title="Trading"
                subtitle="Create market orders using the shared symbol context."
              />
              <TradingPanel
                selectedSymbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
                onOrderCreated={handleOrderCreated}
              />
            </div>

            <div>
              <SectionTitle
                title="Positions"
                subtitle="Open positions with live PnL and editable risk parameters."
              />
              <PositionsPanel
                data={positions}
                isLoading={isLoading}
                onPositionUpdated={handlePositionUpdated}
              />
            </div>
          </aside>
        </section>

        <section
          style={{
            display: 'grid',
            gap: 20,
          }}
        >
          <div>
            <SectionTitle
              title="History"
              subtitle="Executed trades and rejected orders for the selected symbol."
            />
            <HistoryPanel
              selectedSymbolFull={selectedSymbolFull}
              refreshKey={historyRefreshKey}
            />
          </div>

          <div>
            <SectionTitle
              title="AI Insights"
              subtitle="Run and review saved AI analyses for the active instrument."
            />
            <AnalysisPanel
              selectedSymbolFull={selectedSymbolFull}
              refreshKey={analysisRefreshKey}
            />
          </div>
        </section>
      </div>
    </div>
  );
}