import { useState, useEffect, useRef, useCallback } from "react";
import { Candle, Volume, Interval } from "../types";
import { fetchKlines, fetchExchangeInfo } from "../services/binance";

export function useMarketData() {
  const [symbol, setSymbol] = useState("BTC");
  const [interval, setInterval] = useState<Interval>("1m");
  const [symbolsList, setSymbolsList] = useState<string[]>([]);
  
  const [candles, setCandles] = useState<Candle[]>([]);
  const [volumeData, setVolumeData] = useState<Volume[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const loadedRange = useRef<{ min: number | null; max: number | null }>({ min: null, max: null });

  // Load symbols list once
  useEffect(() => {
    fetchExchangeInfo().then(setSymbolsList);
  }, []);

  // Main data fetcher
  const loadData = useCallback(async (isHistory = false, endTime?: number) => {
    if (!isHistory) setIsLoading(true);
    setErrorMsg(null);

    try {
      const { candles: newCandles, volumes: newVolumes } = await fetchKlines(symbol, interval, 500, endTime);

      if (newCandles.length === 0 && !isHistory) {
         setErrorMsg("Дані відсутні");
         return;
      }

      setCandles((prev) => {
        const all = isHistory ? [...newCandles, ...prev] : newCandles;
        // Deduplicate
        const uniqueMap = new Map();
        for (const c of all) uniqueMap.set(c.x, c);
        const sorted = Array.from(uniqueMap.values()).sort((a: any, b: any) => a.x - b.x) as Candle[];
        
        if (sorted.length > 0) {
            loadedRange.current.min = sorted[0].x;
            loadedRange.current.max = sorted[sorted.length - 1].x;
        }
        return sorted;
      });

      setVolumeData((prev) => {
        const all = isHistory ? [...newVolumes, ...prev] : newVolumes;
        const uniqueMap = new Map();
        for (const v of all) uniqueMap.set(v.x, v);
        return Array.from(uniqueMap.values()).sort((a: any, b: any) => a.x - b.x) as Volume[];
      });

    } catch (err) {
      if (!isHistory) setErrorMsg("Помилка з'єднання з Binance API");
    } finally {
      setIsLoading(false);
    }
  }, [symbol, interval]);

  // Initial load effect
  useEffect(() => {
    setCandles([]);
    setVolumeData([]);
    loadedRange.current = { min: null, max: null };
    loadData();
  }, [loadData]);

  // WebSocket effect
  useEffect(() => {
    if (isLoading) return;
    const wsSymbol = symbol.toLowerCase();
    const wsUrl = `wss://stream.binance.com:9443/ws/${wsSymbol}usdt@kline_${interval}`;

    if (wsRef.current) wsRef.current.close();

    try {
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.e === "kline") {
            const k = message.k;
            const newCandle: Candle = {
              x: k.t,
              o: parseFloat(k.o),
              h: parseFloat(k.h),
              l: parseFloat(k.l),
              c: parseFloat(k.c),
              v: parseFloat(k.v),
            };
            const newVolume: Volume = { x: k.t, y: parseFloat(k.v) };
            
            setCandles(prev => upsert(prev, newCandle));
            setVolumeData(prev => upsert(prev, newVolume));
          }
        };
    } catch (e) { console.error(e); }

    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [symbol, interval, isLoading]);

  const loadMoreHistory = async () => {
     if (loadedRange.current.min) {
         await loadData(true, loadedRange.current.min - 1);
     }
  };

  return {
    symbol, setSymbol,
    interval, setInterval,
    symbolsList,
    candles, volumeData,
    isLoading, errorMsg,
    loadMoreHistory,
    refresh: () => loadData()
  };
}

function upsert(list: any[], item: any) {
    if (list.length === 0) return [item];
    const last = list[list.length - 1];
    if (last.x === item.x) {
        const newData = [...list];
        newData[newData.length - 1] = item;
        return newData;
    }
    return [...list, item];
}
