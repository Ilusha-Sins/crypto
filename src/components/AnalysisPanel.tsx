import { useEffect, useMemo, useState } from 'react';
import { getAnalysisHistory, runAnalysis } from '../api/analysis.api';
import type { AnalysisRunResult } from '../types/api';
import {
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  cardStyle,
  dangerTextStyle,
  inputStyle,
  labelStyle,
  panelPaddedStyle,
  selectStyle,
  subtleTextStyle,
  withDisabled,
} from '../styles/ui';

type Props = {
  selectedSymbolFull: string;
  refreshKey?: number;
};

type AnalysisHistoryItem = {
  id: string;
  symbol: string;
  interval: string;
  createdAt: string;
  response: {
    symbol?: string;
    interval?: string;
    generatedAt?: string;
    snapshot?: Record<string, unknown>;
    analysis?: AnalysisRunResult['analysis'];
  };
};

type AnalysisHistoryResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: AnalysisHistoryItem[];
};

const INTERVALS = ['15m', '1h', '4h', '1d'] as const;

function biasColor(value?: string) {
  if (value === 'bullish') return '#51cf66';
  if (value === 'bearish') return '#ff6b6b';
  return '#fff';
}

function confidenceColor(value?: string) {
  if (value === 'high') return '#51cf66';
  if (value === 'medium') return '#f59e0b';
  return '#9ca3af';
}

export default function AnalysisPanel({
  selectedSymbolFull,
  refreshKey = 0,
}: Props) {
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]>('1h');
  const [language, setLanguage] = useState<'uk' | 'en'>('uk');
  const [result, setResult] = useState<AnalysisRunResult | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRun = useMemo(() => Boolean(selectedSymbolFull), [selectedSymbolFull]);

  async function handleRunAnalysis() {
    if (!canRun) {
      return;
    }

    setError(null);
    setIsRunning(true);

    try {
      const response = await runAnalysis({
        symbol: selectedSymbolFull,
        interval,
        limit: 120,
        language,
      });

      setResult(response);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
    } finally {
      setIsRunning(false);
    }
  }

  async function loadHistory() {
    if (!selectedSymbolFull) {
      return;
    }

    setIsHistoryLoading(true);

    try {
      const response = (await getAnalysisHistory(
        `?symbol=${selectedSymbolFull}&page=1&limit=5`,
      )) as AnalysisHistoryResponse;

      setHistory(response.items ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load analysis history',
      );
    } finally {
      setIsHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, [selectedSymbolFull, refreshKey]);

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
          <h2 style={{ margin: 0 }}>AI Analysis</h2>
          <p style={{ margin: '6px 0 0 0', ...subtleTextStyle }}>
            Symbol: {selectedSymbolFull}
          </p>
        </div>

        <button
          onClick={() => void loadHistory()}
          disabled={isHistoryLoading}
          style={withDisabled(buttonSecondaryStyle, isHistoryLoading)}
        >
          Refresh history
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 12,
          marginBottom: 16,
          alignItems: 'end',
        }}
      >
        <div>
          <label htmlFor="analysis-interval" style={labelStyle}>
            Interval
          </label>
          <select
            id="analysis-interval"
            value={interval}
            onChange={(event) =>
              setInterval(event.target.value as (typeof INTERVALS)[number])
            }
            style={selectStyle}
          >
            {INTERVALS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="analysis-language" style={labelStyle}>
            Language
          </label>
          <select
            id="analysis-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'uk' | 'en')}
            style={selectStyle}
          >
            <option value="uk">Ukrainian</option>
            <option value="en">English</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button
            onClick={() => void handleRunAnalysis()}
            disabled={isRunning || !canRun}
            style={{
              ...withDisabled(buttonPrimaryStyle, isRunning || !canRun),
              width: '100%',
            }}
          >
            {isRunning ? 'Running...' : 'Run analysis'}
          </button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            ...cardStyle,
            marginBottom: 16,
            background: '#1a1111',
            borderColor: '#3f1d1d',
            ...dangerTextStyle,
          }}
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={cardStyle}>
              <strong>Bias</strong>
              <p style={{ margin: '6px 0 0 0', color: biasColor(result.analysis.bias) }}>
                {result.analysis.bias}
              </p>
            </div>
            <div style={cardStyle}>
              <strong>Confidence</strong>
              <p
                style={{
                  margin: '6px 0 0 0',
                  color: confidenceColor(result.analysis.confidence),
                }}
              >
                {result.analysis.confidence}
              </p>
            </div>
            <div style={cardStyle}>
              <strong>Provider</strong>
              <p style={{ margin: '6px 0 0 0' }}>{result.analysis.provider}</p>
            </div>
            <div style={cardStyle}>
              <strong>Interval</strong>
              <p style={{ margin: '6px 0 0 0' }}>{result.interval}</p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Summary</h3>
            <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
              {result.analysis.summary}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
            }}
          >
            <div style={cardStyle}>
              <h4 style={{ marginTop: 0 }}>Key signals</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.analysis.keySignals.map((item, index) => (
                  <li key={`${item}-${index}`} style={{ marginBottom: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={cardStyle}>
              <h4 style={{ marginTop: 0 }}>Risks</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.analysis.risks.map((item, index) => (
                  <li key={`${item}-${index}`} style={{ marginBottom: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={cardStyle}>
              <h4 style={{ marginTop: 0 }}>Action plan</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.analysis.actionPlan.map((item, index) => (
                  <li key={`${item}-${index}`} style={{ marginBottom: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h3 style={{ marginBottom: 12 }}>Recent analysis history</h3>

        {isHistoryLoading ? <p>Loading analysis history...</p> : null}

        {!isHistoryLoading && history.length === 0 ? (
          <p>No analysis history yet</p>
        ) : null}

        <div style={{ display: 'grid', gap: 12 }}>
          {history.map((item) => (
            <div key={item.id} style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 8,
                }}
              >
                <strong>
                  {item.symbol} · {item.interval}
                </strong>
                <span style={subtleTextStyle}>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              <p style={{ margin: '6px 0' }}>
                Bias:{' '}
                <span style={{ color: biasColor(item.response.analysis?.bias) }}>
                  {item.response.analysis?.bias ?? '—'}
                </span>{' '}
                · Confidence:{' '}
                <span
                  style={{
                    color: confidenceColor(item.response.analysis?.confidence),
                  }}
                >
                  {item.response.analysis?.confidence ?? '—'}
                </span>
              </p>

              <p style={{ margin: '6px 0 0 0', lineHeight: 1.5 }}>
                {item.response.analysis?.summary ?? 'No summary'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}