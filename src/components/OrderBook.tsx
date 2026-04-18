import React, { useEffect, useState } from "react";
import axios from "axios";

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
        const res = await axios.get("https://api.binance.com/api/v3/depth", { params: { symbol: symbol + "USDT", limit: 12 } });
        const process = (rows: any[], color: string) => {
            const max = Math.max(...rows.map(r => parseFloat(r[1])));
            return rows.map(r => ({
                price: parseFloat(r[0]).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                amount: parseFloat(r[1]).toFixed(4),
                total: (parseFloat(r[1]) / max) * 100
            }));
        };
        setAsks(process(res.data.asks, 'red').reverse());
        setBids(process(res.data.bids, 'green'));
        setIsLoading(false);
      } catch (e) { console.error(e); }
    };

    fetchBook();
    intervalId = window.setInterval(fetchBook, 2000);
    return () => clearInterval(intervalId);
  }, [symbol]);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full" aria-labelledby="orderbook-title">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 id="orderbook-title" className="font-bold text-slate-700 text-sm uppercase tracking-wider">Книга ордерів</h3>
      </div>

      <div className="flex-1 overflow-hidden p-3 text-[11px] font-mono relative">
        {isLoading ? (
            <div className="absolute inset-0 skeleton flex items-center justify-center text-slate-400">Синхронізація...</div>
        ) : (
            <div className="grid grid-rows-[1fr_auto_1fr] h-full">
                <div className="flex flex-col-reverse justify-end overflow-hidden">
                    {asks.map((ask, i) => (
                        <div key={i} className="flex justify-between relative py-0.5 group">
                            <div className="absolute inset-y-0 right-0 bg-rose-50 transition-all duration-500" style={{ width: `${ask.total}%` }}></div>
                            <span className="text-rose-500 font-semibold z-10">{ask.price}</span>
                            <span className="text-slate-500 z-10">{ask.amount}</span>
                        </div>
                    ))}
                </div>
                <div className="py-2 my-1 border-y border-slate-100 text-center text-slate-400 font-bold bg-slate-50/30">СПРЕД</div>
                <div className="overflow-hidden">
                    {bids.map((bid, i) => (
                        <div key={i} className="flex justify-between relative py-0.5 group">
                            <div className="absolute inset-y-0 right-0 bg-emerald-50 transition-all duration-500" style={{ width: `${bid.total}%` }}></div>
                            <span className="text-emerald-600 font-semibold z-10">{bid.price}</span>
                            <span className="text-slate-500 z-10">{bid.amount}</span>
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
