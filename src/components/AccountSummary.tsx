import {
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  cardStyle,
  labelStyle,
  panelPaddedStyle,
  subtleTextStyle,
  withDisabled,
} from '../styles/ui';

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
    <div style={panelPaddedStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Account</h2>
          <p style={{ margin: '6px 0 0 0', ...subtleTextStyle }}>
            Demo account overview
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={cardStyle}>
          <div style={{ ...labelStyle, marginBottom: 4, opacity: 0.75 }}>User</div>
          <div style={{ fontWeight: 700 }}>{userEmail ?? '—'}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...labelStyle, marginBottom: 4, opacity: 0.75 }}>
            Reset count
          </div>
          <div style={{ fontWeight: 700 }}>{resetCount ?? 0}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...labelStyle, marginBottom: 4, opacity: 0.75 }}>
            Cash balance
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#93c5fd' }}>
            {cashBalance ?? '—'} USDT
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...labelStyle, marginBottom: 4, opacity: 0.75 }}>
            Initial balance
          </div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>
            {initialBalance ?? '—'} USDT
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={withDisabled(buttonSecondaryStyle, isLoading)}
        >
          Refresh
        </button>

        <button
          onClick={onReset}
          disabled={isLoading}
          style={withDisabled(buttonPrimaryStyle, isLoading)}
        >
          Reset account
        </button>

        <button
          onClick={onLogout}
          disabled={isLoading}
          style={withDisabled(buttonSecondaryStyle, isLoading)}
        >
          Logout
        </button>
      </div>
    </div>
  );
}