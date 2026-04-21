import { useEffect, useMemo, useState } from 'react';
import { getAnalysisHistory, runAnalysis } from '../api/analysis.api';
import type { AnalysisRunResult } from '../types/api';

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
      setError(err instanceof Error ? err.message : 'Failed to load analysis history');
    } finally {
      setIsHistoryLoading(false);
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
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>AI Analysis</h2>
          <p style={{ margin: '6px 0 0 0', opacity: 0.8 }}>
            Symbol: {selectedSymbolFull}
          </p>
        </div>

        <button onClick={() => void loadHistory()} disabled={isHistoryLoading}>
          Refresh history
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <label htmlFor="analysis-interval" style={{ display: 'block', marginBottom: 6 }}>
            Interval
          </label>
          <select
            id="analysis-interval"
            value={interval}
            onChange={(event) =>
              setInterval(event.target.value as (typeof INTERVALS)[number])
            }
            style={{ width: '100%', padding: 10, borderRadius: 8 }}
          >
            {INTERVALS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="analysis-language" style={{ display: 'block', marginBottom: 6 }}>
            Language
          </label>
          <select
            id="analysis-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'uk' | 'en')}
            style={{ width: '100%', padding: 10, borderRadius: 8 }}
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
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
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

      {result ? (
        <div
          style={{
            border: '1px solid #2a2a2a',
            borderRadius: 12,
            padding: 16,
            background: '#171717',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ padding: 12, border: '1px solid #2a2a2a', borderRadius: 10 }}>
              <strong>Bias</strong>
              <p style={{ margin: '6px 0 0 0' }}>{result.analysis.bias}</p>
            </div>
            <div style={{ padding: 12, border: '1px solid #2a2a2a', borderRadius: 10 }}>
              <strong>Confidence</strong>
              <p style={{ margin: '6px 0 0 0' }}>{result.analysis.confidence}</p>
            </div>
            <div style={{ padding: 12, border: '1px solid #2a2a2a', borderRadius: 10 }}>
              <strong>Provider</strong>
              <p style={{ margin: '6px 0 0 0' }}>{result.analysis.provider}</p>
            </div>
            <div style={{ padding: 12, border: '1px solid #2a2a2a', borderRadius: 10 }}>
              <strong>Interval</strong>
              <p style={{ margin: '6px 0 0 0' }}>{result.interval}</p>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Summary</h3>
            <p style={{ marginBottom: 0, lineHeight: 1.6 }}>{result.analysis.summary}</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <h4>Key signals</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.analysis.keySignals.map((item, index) => (
                  <li key={`${item}-${index}`} style={{ marginBottom: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Risks</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.analysis.risks.map((item, index) => (
                  <li key={`${item}-${index}`} style={{ marginBottom: 8 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Action plan</h4>
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
            <div
              key={item.id}
              style={{
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: 12,
                background: '#171717',
              }}
            >
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
                <span style={{ opacity: 0.7 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              <p style={{ margin: '6px 0' }}>
                Bias: {item.response.analysis?.bias ?? '—'} · Confidence:{' '}
                {item.response.analysis?.confidence ?? '—'}
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