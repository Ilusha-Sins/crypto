import { useEffect, useState } from 'react';
import axios from 'axios';
import { cardStyle, panelHeaderStyle, subtleTextStyle } from '../styles/ui';

interface OrderBookRow {
  price: string;
  amount: string;
  total: number;
}

interface OrderBookProps {
  symbol: string;
}

const OrderBook = ({ symbol }: OrderBookProps) => {
  const [bids, setBids] = useState<OrderBookRow[]>([]);
  const [asks, setAsks] = useState<OrderBookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let intervalId: number;

    const fetchBook = async () => {
      try {
        const res = await axios.get('https://api.binance.com/api/v3/depth', {
          params: { symbol: `${symbol}USDT`, limit: 12 },
        });

        const process = (rows: any[]) => {
          const max = Math.max(...rows.map((row) => parseFloat(row[1])));

          return rows.map((row) => ({
            price: parseFloat(row[0]).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),
            amount: parseFloat(row[1]).toFixed(4),
            total: max === 0 ? 0 : (parseFloat(row[1]) / max) * 100,
          }));
        };

        setAsks(process(res.data.asks).reverse());
        setBids(process(res.data.bids));
        setIsLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    setIsLoading(true);
    void fetchBook();
    intervalId = window.setInterval(fetchBook, 2000);

    return () => clearInterval(intervalId);
  }, [symbol]);

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: '#fff',
      }}
      aria-labelledby="orderbook-title"
    >
      <div style={panelHeaderStyle}>
        <div>
          <h3 id="orderbook-title" style={{ margin: 0 }}>
            Order Book
          </h3>
          <p style={{ margin: '6px 0 0 0', ...subtleTextStyle }}>
            {symbol}USDT · top market depth
          </p>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: 12,
          fontFamily:
            'ui-monospace, SFMono-Regular, SFMono-Regular, Consolas, monospace',
          fontSize: 12,
          position: 'relative',
        }}
      >
        {isLoading ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
            }}
          >
            Syncing order book...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateRows: '1fr auto 1fr',
              height: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column-reverse',
                justifyContent: 'flex-end',
                overflow: 'hidden',
                ...cardStyle,
                padding: 8,
              }}
            >
              {asks.map((ask, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    position: 'relative',
                    padding: '4px 0',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: '0 0 0 auto',
                      background: 'rgba(220, 38, 38, 0.12)',
                      width: `${ask.total}%`,
                    }}
                  />
                  <span
                    style={{
                      color: '#f87171',
                      fontWeight: 700,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {ask.price}
                  </span>
                  <span
                    style={{
                      color: '#d1d5db',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {ask.amount}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                margin: '8px 0',
                padding: '10px 12px',
                borderTop: '1px solid #2a2a2a',
                borderBottom: '1px solid #2a2a2a',
                textAlign: 'center',
                color: '#9ca3af',
                fontWeight: 800,
                background: '#111',
              }}
            >
              SPREAD
            </div>

            <div
              style={{
                overflow: 'hidden',
                ...cardStyle,
                padding: 8,
              }}
            >
              {bids.map((bid, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    position: 'relative',
                    padding: '4px 0',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: '0 0 0 auto',
                      background: 'rgba(22, 163, 74, 0.12)',
                      width: `${bid.total}%`,
                    }}
                  />
                  <span
                    style={{
                      color: '#4ade80',
                      fontWeight: 700,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {bid.price}
                  </span>
                  <span
                    style={{
                      color: '#d1d5db',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {bid.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default OrderBook;