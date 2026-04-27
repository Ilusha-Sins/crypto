import { useEffect, useMemo, useState } from 'react';
import {
  cardStyle,
  inputStyle,
  labelStyle,
  subtleTextStyle,
} from '../styles/ui';

interface RiskCalculatorProps {
  currentPrice: number;
}

function trimTrailingZeros(value: string) {
  return value.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');
}

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return trimTrailingZeros(value.toFixed(digits));
}

function resultColor(value: number) {
  if (value > 0) return '#51cf66';
  if (value < 0) return '#ff6b6b';
  return '#fff';
}

export default function RiskCalculator({ currentPrice }: RiskCalculatorProps) {
  const [balance, setBalance] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entryPrice, setEntryPrice] = useState(currentPrice);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [isLong, setIsLong] = useState(true);

  useEffect(() => {
    if (currentPrice === 0) {
      if (entryPrice !== 0) {
        setEntryPrice(0);
      }
      return;
    }

    if (currentPrice > 0 && entryPrice === 0) {
      setEntryPrice(currentPrice);

      if (isLong) {
        setStopLoss(currentPrice * 0.98);
        setTakeProfit(currentPrice * 1.04);
      } else {
        setStopLoss(currentPrice * 1.02);
        setTakeProfit(currentPrice * 0.96);
      }
    }
  }, [currentPrice, entryPrice, isLong]);

  const handleDirectionChange = (nextIsLong: boolean) => {
    setIsLong(nextIsLong);

    if (entryPrice > 0) {
      if (nextIsLong) {
        setStopLoss(entryPrice * 0.98);
        setTakeProfit(entryPrice * 1.04);
      } else {
        setStopLoss(entryPrice * 1.02);
        setTakeProfit(entryPrice * 0.96);
      }
    }
  };

  const results = useMemo(() => {
    const riskAmount = (balance * riskPercent) / 100;

    let priceDiff = 0;
    let rewardDiff = 0;

    if (isLong) {
      priceDiff = entryPrice - stopLoss;
      rewardDiff = takeProfit - entryPrice;
    } else {
      priceDiff = stopLoss - entryPrice;
      rewardDiff = entryPrice - takeProfit;
    }

    if (priceDiff <= 0 || entryPrice <= 0) {
      return {
        riskAmount,
        positionSize: 0,
        positionUsd: 0,
        rrRatio: 0,
        profit: 0,
      };
    }

    const positionSize = riskAmount / priceDiff;
    const positionUsd = positionSize * entryPrice;
    const profit = positionSize * rewardDiff;
    const rrRatio = priceDiff === 0 ? 0 : rewardDiff / priceDiff;

    return {
      riskAmount,
      positionSize: Number.isFinite(positionSize) ? positionSize : 0,
      positionUsd: Number.isFinite(positionUsd) ? positionUsd : 0,
      profit: Number.isFinite(profit) ? profit : 0,
      rrRatio: Number.isFinite(rrRatio) ? rrRatio : 0,
    };
  }, [balance, riskPercent, entryPrice, stopLoss, takeProfit, isLong]);

  const rrColor =
    results.rrRatio >= 2 ? '#51cf66' : results.rrRatio >= 1 ? '#f59e0b' : '#ff6b6b';

  return (
    <div
      style={{
        padding: 16,
        color: '#fff',
        background: 'transparent',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px 0',
          fontSize: 18,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: 'rgba(37, 99, 235, 0.18)',
            color: '#93c5fd',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          fx
        </span>
        Risk Calculator
      </h3>

      <div
        style={{
          display: 'flex',
          background: '#171717',
          padding: 4,
          borderRadius: 10,
          marginBottom: 16,
          border: '1px solid #2a2a2a',
        }}
      >
        <button
          type="button"
          onClick={() => handleDirectionChange(true)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            background: isLong ? '#16a34a' : 'transparent',
            color: isLong ? '#fff' : '#9ca3af',
          }}
        >
          Long
        </button>
        <button
          type="button"
          onClick={() => handleDirectionChange(false)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            background: !isLong ? '#dc2626' : 'transparent',
            color: !isLong ? '#fff' : '#9ca3af',
          }}
        >
          Short
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <label style={labelStyle}>Balance ($)</label>
          <input
            type="number"
            value={balance}
            onChange={(event) => setBalance(Number(event.target.value))}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Risk (%)</label>
          <input
            type="number"
            value={riskPercent}
            onChange={(event) => setRiskPercent(Number(event.target.value))}
            style={inputStyle}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Entry Price</label>
          <input
            type="number"
            value={entryPrice}
            onChange={(event) => setEntryPrice(Number(event.target.value))}
            style={inputStyle}
          />
          <div style={{ marginTop: 6, fontSize: 12, ...subtleTextStyle }}>
            Live reference price: {currentPrice > 0 ? currentPrice : '—'}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Stop Loss</label>
          <input
            type="number"
            value={stopLoss}
            onChange={(event) => setStopLoss(Number(event.target.value))}
            style={{
              ...inputStyle,
              borderColor: '#3f1d1d',
              background: '#1a1111',
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>Take Profit</label>
          <input
            type="number"
            value={takeProfit}
            onChange={(event) => setTakeProfit(Number(event.target.value))}
            style={{
              ...inputStyle,
              borderColor: '#183322',
              background: '#101a14',
            }}
          />
        </div>
      </div>

      <div
        style={{
          ...cardStyle,
          display: 'grid',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <span style={subtleTextStyle}>Risk ($)</span>
          <strong style={{ color: '#ff6b6b' }}>
            -${formatNumber(results.riskAmount, 2)}
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <span style={subtleTextStyle}>Potential Profit</span>
          <strong style={{ color: '#51cf66' }}>
            +${formatNumber(results.profit, 2)}
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            paddingTop: 10,
            borderTop: '1px solid #2a2a2a',
          }}
        >
          <span style={subtleTextStyle}>R:R Ratio</span>
          <strong style={{ color: rrColor }}>
            1 : {formatNumber(results.rrRatio, 2)}
          </strong>
        </div>

        <div
          style={{
            marginTop: 4,
            paddingTop: 10,
            borderTop: '1px solid #2a2a2a',
          }}
        >
          <div style={{ fontSize: 12, marginBottom: 6, ...subtleTextStyle }}>
            Recommended position size
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#93c5fd',
              marginBottom: 4,
            }}
          >
            {formatNumber(results.positionSize, 4)} coins
          </div>
          <div style={{ fontSize: 13, ...subtleTextStyle }}>
            ~${formatNumber(results.positionUsd, 2)}
          </div>
        </div>

        <div
          style={{
            marginTop: 4,
            paddingTop: 10,
            borderTop: '1px solid #2a2a2a',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 12, marginBottom: 4, ...subtleTextStyle }}>
              Entry vs SL
            </div>
            <div style={{ color: resultColor(entryPrice - stopLoss) }}>
              {formatNumber(Math.abs(entryPrice - stopLoss), 4)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, marginBottom: 4, ...subtleTextStyle }}>
              Entry vs TP
            </div>
            <div style={{ color: resultColor(takeProfit - entryPrice) }}>
              {formatNumber(Math.abs(takeProfit - entryPrice), 4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}