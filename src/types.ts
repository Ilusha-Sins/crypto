export interface Candle {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Volume {
  x: number;
  y: number;
}

export interface DrawingObject {
  id: string;
  type: 'line' | 'rect' | 'text' | 'fib';
  startX: number; // Time value
  startY: number; // Price value
  endX: number;
  endY: number;
  textValue?: string;
}

export type Interval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export const INTERVALS: Interval[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];