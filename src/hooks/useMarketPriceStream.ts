import { useEffect, useMemo, useState } from 'react';
import { createMarketStreamUrl, getMarketPrice } from '../api/market.api';

type UseMarketPriceStreamOptions = {
  initialPrice?: number | null;
  enabled?: boolean;
};

export function useMarketPriceStream(
  symbolFull: string,
  options: UseMarketPriceStreamOptions = {},
) {
  const normalizedSymbol = useMemo(
    () => symbolFull.trim().toUpperCase(),
    [symbolFull],
  );

  const [price, setPrice] = useState<number>(options.initialPrice ?? 0);
  const [isLoading, setIsLoading] = useState(Boolean(normalizedSymbol));
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.enabled && options.enabled !== undefined) {
      return;
    }

    if (!normalizedSymbol) {
      setPrice(0);
      setIsLoading(false);
      setIsLive(false);
      setError(null);
      return;
    }

    let isDisposed = false;
    const eventSource = new EventSource(
      createMarketStreamUrl(normalizedSymbol, '1m'),
    );

    setIsLoading(true);
    setIsLive(false);
    setError(null);
    setPrice(options.initialPrice ?? 0);

    void (async () => {
      try {
        const response = await getMarketPrice(normalizedSymbol);

        if (isDisposed) {
          return;
        }

        const initial = Number(response.price);

        if (!Number.isNaN(initial) && initial > 0) {
          setPrice(initial);
        }
      } catch (err) {
        if (isDisposed) {
          return;
        }

        setError(
          err instanceof Error ? err.message : 'Failed to load market price',
        );
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    })();

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          symbol: string;
          interval: string;
          candle: {
            openTime: number;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
            closeTime: number;
          };
        };

        const nextPrice = Number(payload.candle.close);

        if (Number.isNaN(nextPrice) || nextPrice <= 0) {
          return;
        }

        if (!isDisposed) {
          setPrice(nextPrice);
          setIsLive(true);
          setError(null);
          setIsLoading(false);
        }
      } catch {
        if (!isDisposed) {
          setError('Failed to parse live market payload');
        }
      }
    };

    eventSource.onerror = () => {
      if (!isDisposed) {
        setIsLive(false);
      }
    };

    return () => {
      isDisposed = true;
      eventSource.close();
    };
  }, [normalizedSymbol, options.enabled, options.initialPrice]);

  return {
    price,
    isLoading,
    isLive,
    error,
  };
}