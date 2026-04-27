import { useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { PatternResult } from '../components/indicators';
import type { Candle, DrawingObject } from '../types';

interface UseChartPluginsProps {
  data: Candle[];
  patterns: PatternResult[];
  overlays: { patterns: boolean };
  drawTool: 'cursor' | 'line' | 'rect' | 'text' | 'fib';
  drawings: DrawingObject[];
  setDrawings: Dispatch<SetStateAction<DrawingObject[]>>;
  drawingInProgress: MutableRefObject<DrawingObject | null>;
  interval: string;
}

function formatPriceLabel(value: number) {
  if (value < 1) return value.toFixed(4);
  if (value < 10) return value.toFixed(3);
  return value.toFixed(2);
}

export const useChartPlugins = ({
  data,
  patterns,
  overlays,
  drawTool,
  drawings,
  setDrawings,
  drawingInProgress,
  interval,
}: UseChartPluginsProps) => {
  return useMemo(() => {
    const crosshairPlugin = {
      id: 'crosshair',
      afterInit: (chart: any) => {
        chart.crosshair = { x: 0, y: 0, draw: false };
      },
      afterEvent: (chart: any, args: any) => {
        const { inChartArea } = args;
        const { x, y } = args.event;
        chart.crosshair = { x, y, draw: inChartArea };
        args.changed = true;
      },
      afterDraw: (chart: any) => {
        if (!chart.crosshair?.draw || drawTool !== 'cursor') return;

        const { ctx, chartArea, scales } = chart;
        const { x, y } = chart.crosshair;
        const { top, bottom, left, right } = chartArea;

        ctx.save();

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.setLineDash([5, 5]);

        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);

        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();

        ctx.setLineDash([]);

        const yValue = scales.y.getValueForPixel(y);
        let yLabel = yValue.toFixed(2);
        if (yValue < 1) yLabel = yValue.toFixed(4);
        else if (yValue < 10) yLabel = yValue.toFixed(3);

        const labelPadding = 5;
        const fontSize = 11;
        ctx.font = `${fontSize}px sans-serif`;

        const yTextWidth = ctx.measureText(yLabel).width;
        const yBoxHeight = fontSize + labelPadding * 2;
        const yBoxWidth = yTextWidth + labelPadding * 2;

        ctx.fillStyle = '#111827';
        ctx.fillRect(right, y - yBoxHeight / 2, yBoxWidth, yBoxHeight);

        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.strokeRect(right, y - yBoxHeight / 2, yBoxWidth, yBoxHeight);

        ctx.fillStyle = '#f9fafb';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(yLabel, right + labelPadding, y);

        const xValue = scales.x.getValueForPixel(x);
        const date = new Date(xValue);
        const xLabel = date.toLocaleString('uk-UA', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const xTextWidth = ctx.measureText(xLabel).width;
        const xBoxWidth = xTextWidth + labelPadding * 2;

        ctx.fillStyle = '#111827';
        ctx.fillRect(x - xBoxWidth / 2, bottom, xBoxWidth, yBoxHeight);

        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - xBoxWidth / 2, bottom, xBoxWidth, yBoxHeight);

        ctx.fillStyle = '#f9fafb';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(xLabel, x, bottom + labelPadding);

        ctx.restore();
      },
    };

    const patternsPlugin = {
      id: 'patterns',
      afterDatasetsDraw: (chart: any) => {
        if (!overlays.patterns) return;

        const {
          ctx,
          scales: { x: xScale, y: yScale },
        } = chart;

        ctx.save();
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        patterns.forEach((pattern: PatternResult) => {
          const candle = data.find((item) => item.x === pattern.x);
          if (!candle) return;

          const xPos = xScale.getPixelForValue(pattern.x);
          if (xPos < xScale.left || xPos > xScale.right) return;

          const isBearish = pattern.type === 'bearish';
          const isNeutral = pattern.type === 'neutral';

          const yBase = yScale.getPixelForValue(isBearish ? candle.h : candle.l);
          const offset = 15;
          const yPos = yBase + (isBearish ? -offset : offset);

          let bgColor = 'rgba(239, 68, 68, 0.18)';
          let borderColor = '#ef4444';
          let textColor = '#fecaca';

          if (pattern.type === 'bullish') {
            bgColor = 'rgba(34, 197, 94, 0.18)';
            borderColor = '#22c55e';
            textColor = '#bbf7d0';
          } else if (isNeutral) {
            bgColor = 'rgba(148, 163, 184, 0.16)';
            borderColor = '#94a3b8';
            textColor = '#e5e7eb';
          }

          ctx.beginPath();
          ctx.moveTo(xPos, yBase);
          ctx.lineTo(xPos, yPos + (isBearish ? 10 : -10));
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.stroke();

          const size = 22;
          const boxX = xPos - size / 2;
          const boxY = yPos - size / 2;

          ctx.fillStyle = '#111827';
          ctx.fillRect(boxX, boxY, size, size);

          ctx.fillStyle = bgColor;
          ctx.fillRect(boxX, boxY, size, size);

          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(boxX, boxY, size, size);

          ctx.fillStyle = textColor;
          ctx.fillText(pattern.label, xPos, yPos);
        });

        ctx.restore();
      },
    };

    const drawingPlugin = {
      id: 'drawing',
      afterDraw: (chart: any) => {
        const {
          ctx,
          chartArea,
          scales: { x: xScale, y: yScale },
        } = chart;

        ctx.save();

        const fibRatios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];

        const drawShape = (drawing: DrawingObject) => {
          const x1 = xScale.getPixelForValue(drawing.startX);
          const y1 = yScale.getPixelForValue(drawing.startY);
          const x2 = xScale.getPixelForValue(drawing.endX);
          const y2 = yScale.getPixelForValue(drawing.endY);

          if (drawing.type === 'line') {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#60a5fa';
            ctx.stroke();

            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.arc(x1, y1, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x2, y2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (drawing.type === 'rect') {
            const width = x2 - x1;
            const height = y2 - y1;

            ctx.fillStyle = 'rgba(96, 165, 250, 0.14)';
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.fillRect(x1, y1, width, height);
            ctx.strokeRect(x1, y1, width, height);
          } else if (drawing.type === 'fib') {
            const priceDiff = drawing.startY - drawing.endY;

            ctx.lineWidth = 1;
            ctx.font = '10px sans-serif';

            fibRatios.forEach((ratio) => {
              const levelPrice = drawing.startY - priceDiff * ratio;
              const py = yScale.getPixelForValue(levelPrice);

              ctx.beginPath();
              ctx.setLineDash([5, 2]);
              ctx.strokeStyle = ratio === 0.618 ? '#f87171' : '#94a3b8';
              ctx.moveTo(chartArea.left, py);
              ctx.lineTo(chartArea.right, py);
              ctx.stroke();
              ctx.setLineDash([]);

              const label = `${(ratio * 100).toFixed(1)}% (${formatPriceLabel(levelPrice)})`;
              const paddingX = 4;
              const paddingY = 2;
              const textWidth = ctx.measureText(label).width;
              const boxWidth = textWidth + paddingX * 2;
              const boxHeight = 14;

              ctx.fillStyle = '#111827';
              ctx.fillRect(chartArea.left + 4, py - boxHeight + 2, boxWidth, boxHeight);

              ctx.strokeStyle = '#374151';
              ctx.lineWidth = 1;
              ctx.strokeRect(chartArea.left + 4, py - boxHeight + 2, boxWidth, boxHeight);

              ctx.fillStyle = ratio === 0.618 ? '#fca5a5' : '#cbd5e1';
              ctx.fillText(label, chartArea.left + 4 + paddingX, py - 3);
            });

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
            ctx.setLineDash([2, 2]);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (drawing.type === 'text' && drawing.textValue) {
            ctx.font = 'bold 14px sans-serif';

            const text = drawing.textValue;
            const paddingX = 6;
            const paddingY = 4;
            const textWidth = ctx.measureText(text).width;
            const boxWidth = textWidth + paddingX * 2;
            const boxHeight = 22;

            ctx.fillStyle = 'rgba(17, 24, 39, 0.92)';
            ctx.fillRect(x1 - 4, y1 - boxHeight + 4, boxWidth, boxHeight);

            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1 - 4, y1 - boxHeight + 4, boxWidth, boxHeight);

            ctx.fillStyle = '#f9fafb';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x1 + paddingX - 4, y1 - boxHeight / 2 + 4);
          }
        };

        drawings.forEach((drawing) => drawShape(drawing));
        if (drawingInProgress.current) {
          drawShape(drawingInProgress.current);
        }

        ctx.restore();
      },

      afterEvent: (chart: any, args: any) => {
        if (drawTool === 'cursor') return;

        const { event } = args;
        const xVal = chart.scales.x.getValueForPixel(event.x);
        const yVal = chart.scales.y.getValueForPixel(event.y);

        if (event.type === 'mousedown' || event.type === 'touchstart') {
          drawingInProgress.current = {
            id: Date.now().toString(),
            type: drawTool,
            startX: xVal,
            startY: yVal,
            endX: xVal,
            endY: yVal,
          };
          args.changed = true;
        } else if (event.type === 'mousemove' || event.type === 'touchmove') {
          if (drawingInProgress.current) {
            drawingInProgress.current.endX = xVal;
            drawingInProgress.current.endY = yVal;
            args.changed = true;
          }
        } else if (event.type === 'mouseup' || event.type === 'touchend') {
          if (drawingInProgress.current) {
            if (xVal !== undefined && !Number.isNaN(xVal)) {
              drawingInProgress.current.endX = xVal;
              drawingInProgress.current.endY = yVal;
            }

            if (drawTool === 'text') {
              const value = window.prompt('Введіть текст:');
              if (value) {
                drawingInProgress.current.textValue = value;
              } else {
                drawingInProgress.current = null;
                args.changed = true;
                return;
              }
            }

            const newDrawing = { ...drawingInProgress.current };
            setDrawings((prev) => [...prev, newDrawing]);
            drawingInProgress.current = null;
            args.changed = true;
          }
        }
      },
    };

    return [crosshairPlugin, patternsPlugin, drawingPlugin];
  }, [
    data,
    patterns,
    overlays.patterns,
    drawTool,
    drawings,
    setDrawings,
    drawingInProgress,
    interval,
  ]);
};