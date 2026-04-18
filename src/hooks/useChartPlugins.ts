import { useMemo, MutableRefObject } from 'react';
import { Chart } from 'chart.js';
import { PatternResult } from '../components/indicators';
import { DrawingObject, Candle } from '../types';

interface UseChartPluginsProps {
  data: Candle[];
  patterns: PatternResult[];
  overlays: { patterns: boolean };
  drawTool: 'cursor' | 'line' | 'rect' | 'text' | 'fib';
  drawings: DrawingObject[];
  setDrawings: React.Dispatch<React.SetStateAction<DrawingObject[]>>;
  drawingInProgress: MutableRefObject<DrawingObject | null>;
  interval: string;
}

export const useChartPlugins = ({
  data,
  patterns,
  overlays,
  drawTool,
  drawings,
  setDrawings,
  drawingInProgress,
  interval
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
        ctx.strokeStyle = '#36393fff'; 
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

        const labelPadding = 4;
        const fontSize = 11;
        ctx.font = `${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(yLabel).width;
        const boxHeight = fontSize + labelPadding * 2;
        const boxWidth = textWidth + labelPadding * 2;

        ctx.fillStyle = '#374151';
        ctx.fillRect(right, y - boxHeight/2, boxWidth, boxHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(yLabel, right + labelPadding, y);

        const xValue = scales.x.getValueForPixel(x);
        const date = new Date(xValue);
        const xLabel = date.toLocaleString('uk-UA', { 
            month: 'numeric', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });

        const xTextWidth = ctx.measureText(xLabel).width;
        const xBoxWidth = xTextWidth + labelPadding * 2;
        
        ctx.fillStyle = '#374151';
        ctx.fillRect(x - xBoxWidth/2, bottom, xBoxWidth, boxHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(xLabel, x, bottom + labelPadding);

        ctx.restore();
      }
    };

    const patternsPlugin = {
      id: 'patterns',
      afterDatasetsDraw: (chart: any) => {
        if (!overlays.patterns) return;

        const { ctx, scales: { x: xScale, y: yScale } } = chart;
        
        ctx.save();
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        patterns.forEach((p: PatternResult) => {
            const candle = data.find(d => d.x === p.x);
            if (!candle) return;

            const xPos = xScale.getPixelForValue(p.x);
            if (xPos < xScale.left || xPos > xScale.right) return;

            const isBearish = p.type === 'bearish';
            const isNeutral = p.type === 'neutral';
            
            const yBase = yScale.getPixelForValue(isBearish ? candle.h : candle.l);
            const offset = 15;
            const yPos = yBase + (isBearish ? -offset : offset);
            
            let bgColor = 'rgba(239, 68, 68, 0.15)'; 
            let borderColor = '#dc2626'; 
            let textColor = '#991b1b'; 
            
            if (p.type === 'bullish') {
                bgColor = 'rgba(34, 197, 94, 0.15)'; 
                borderColor = '#16a34a'; 
                textColor = '#14532d'; 
            } else if (isNeutral) {
                bgColor = 'rgba(107, 114, 128, 0.15)'; 
                borderColor = '#6b7280'; 
                textColor = '#374151'; 
            }

            ctx.beginPath();
            ctx.moveTo(xPos, yBase);
            ctx.lineTo(xPos, yPos + (isBearish ? 10 : -10)); 
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.stroke();

            const size = 20;
            const boxX = xPos - size/2;
            const boxY = yPos - size/2;
            
            ctx.fillStyle = '#ffffff'; 
            ctx.fillRect(boxX, boxY, size, size);
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(boxX, boxY, size, size);
            
            ctx.lineWidth = 1.5;
            ctx.strokeRect(boxX, boxY, size, size);

            ctx.fillStyle = textColor;
            ctx.fillText(p.label, xPos, yPos);
        });

        ctx.restore();
      }
    };

    const drawingPlugin = {
        id: 'drawing',
        afterDraw: (chart: any) => {
            const { ctx, chartArea, scales: { x: xScale, y: yScale } } = chart;
            ctx.save();

            const fibRatios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];

            const drawShape = (d: DrawingObject) => {
                const x1 = xScale.getPixelForValue(d.startX);
                const y1 = yScale.getPixelForValue(d.startY);
                const x2 = xScale.getPixelForValue(d.endX);
                const y2 = yScale.getPixelForValue(d.endY);

                if (d.type === 'line') {
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#3b82f6';
                    ctx.stroke();
                    ctx.fillStyle = '#3b82f6';
                    ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(x2, y2, 3, 0, Math.PI * 2); ctx.fill();
                } else if (d.type === 'rect') {
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    const w = x2 - x1;
                    const h = y2 - y1;
                    ctx.fillRect(x1, y1, w, h);
                    ctx.strokeRect(x1, y1, w, h);
                } else if (d.type === 'fib') {
                    const priceDiff = d.startY - d.endY;
                    ctx.lineWidth = 1;
                    ctx.font = '10px sans-serif';
                    
                    fibRatios.forEach(ratio => {
                        const levelPrice = d.startY - (priceDiff * ratio);
                        const py = yScale.getPixelForValue(levelPrice);
                        ctx.beginPath();
                        ctx.setLineDash([5, 2]);
                        ctx.strokeStyle = ratio === 0.618 ? '#ef4444' : '#64748b';
                        ctx.moveTo(chartArea.left, py);
                        ctx.lineTo(chartArea.right, py);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.fillStyle = ratio === 0.618 ? '#ef4444' : '#64748b';
                        ctx.fillText(`${(ratio * 100).toFixed(1)}% (${levelPrice.toFixed(2)})`, chartArea.left + 5, py - 3);
                    });

                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
                    ctx.setLineDash([2, 2]);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else if (d.type === 'text' && d.textValue) {
                    ctx.font = 'bold 14px sans-serif';
                    ctx.fillStyle = '#1e293b';
                    ctx.fillText(d.textValue, x1, y1);
                }
            };

            drawings.forEach(d => drawShape(d));
            if (drawingInProgress.current) drawShape(drawingInProgress.current);

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
                    endY: yVal
                };
                args.changed = true;
            } 
            else if (event.type === 'mousemove' || event.type === 'touchmove') {
                if (drawingInProgress.current) {
                    drawingInProgress.current.endX = xVal;
                    drawingInProgress.current.endY = yVal;
                    args.changed = true;
                }
            } 
            else if (event.type === 'mouseup' || event.type === 'touchend') {
                 if (drawingInProgress.current) {
                    if (xVal !== undefined && !isNaN(xVal)) {
                        drawingInProgress.current.endX = xVal;
                        drawingInProgress.current.endY = yVal;
                    }

                    if (drawTool === 'text') {
                        const val = window.prompt("Введіть текст:");
                        if (val) {
                            drawingInProgress.current.textValue = val;
                        } else {
                            drawingInProgress.current = null;
                            args.changed = true;
                            return;
                        }
                    }

                    const newDrawing = { ...drawingInProgress.current };
                    setDrawings(prev => [...prev, newDrawing]);
                    drawingInProgress.current = null;
                    args.changed = true;
                }
            }
        }
    };

    return [crosshairPlugin, patternsPlugin, drawingPlugin];
  }, [data, patterns, overlays.patterns, drawTool, drawings, interval]);
};