import type { MouseEvent } from 'react';
import type { LossPoint, Point } from '../types';

interface ScatterPlotProps {
  points: Point[];
  slope: number;
  intercept: number;
  xLabel?: string;
  yLabel?: string;
  interactive?: boolean;
  onAddPoint?: (point: Point) => void;
  onRemovePoint?: (index: number) => void;
  height?: number;
}

export function ScatterPlot({
  points,
  slope,
  intercept,
  xLabel = 'X Input',
  yLabel = 'Y Target',
  interactive = false,
  onAddPoint,
  onRemovePoint,
  height = 300,
}: ScatterPlotProps) {
  const width = 540;
  const padLeft = 48;
  const padRight = 22;
  const padTop = 20;
  const padBottom = 40;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const rawMinX = xs.length ? Math.min(...xs) : 0;
  const rawMaxX = xs.length ? Math.max(...xs) : 10;
  const rawMinY = ys.length ? Math.min(...ys) : 0;
  const rawMaxY = ys.length ? Math.max(...ys) : 100;

  const xSpan = Math.max(2, rawMaxX - rawMinX);
  const ySpan = Math.max(10, rawMaxY - rawMinY);

  const minX = Math.floor(rawMinX - xSpan * 0.12);
  const maxX = Math.ceil(rawMaxX + xSpan * 0.12);
  const minY = Math.floor(rawMinY - ySpan * 0.15);
  const maxY = Math.ceil(rawMaxY + ySpan * 0.15);

  const toSvgX = (x: number) => padLeft + ((x - minX) / (maxX - minX || 1)) * plotW;
  const toSvgY = (y: number) => padTop + plotH - ((y - minY) / (maxY - minY || 1)) * plotH;

  const fromSvg = (svgX: number, svgY: number): Point => {
    const clampedX = Math.max(padLeft, Math.min(width - padRight, svgX));
    const clampedY = Math.max(padTop, Math.min(height - padBottom, svgY));
    const x = minX + ((clampedX - padLeft) / plotW) * (maxX - minX);
    const y = minY + ((padTop + plotH - clampedY) / plotH) * (maxY - minY);
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };
  };

  const handleSvgClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onAddPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    if (svgX < padLeft || svgX > width - padRight || svgY < padTop || svgY > height - padBottom) {
      return;
    }
    onAddPoint(fromSvg(svgX, svgY));
  };

  const lineY1 = slope * minX + intercept;
  const lineY2 = slope * maxX + intercept;

  const xTicks = 5;
  const yTicks = 4;

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        onClick={handleSvgClick}
        className={`w-full h-auto overflow-visible ${interactive ? 'cursor-crosshair' : ''}`}
        role="img"
        aria-label={`Scatter plot of ${xLabel} vs ${yLabel} with linear regression fit`}
      >
        <defs>
          <clipPath id="plot-clip">
            <rect x={padLeft} y={padTop} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, idx) => {
          const frac = idx / yTicks;
          const val = minY + frac * (maxY - minY);
          const yPos = toSvgY(val);
          return (
            <g key={`y-${idx}`}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={yPos}
                y2={yPos}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={yPos + 4}
                textAnchor="end"
                className="fill-slate-500 text-[10px] font-mono"
              >
                {val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {Array.from({ length: xTicks + 1 }).map((_, idx) => {
          const frac = idx / xTicks;
          const val = minX + frac * (maxX - minX);
          const xPos = toSvgX(val);
          return (
            <g key={`x-${idx}`}>
              <line
                x1={xPos}
                x2={xPos}
                y1={padTop}
                y2={height - padBottom}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <text
                x={xPos}
                y={height - padBottom + 16}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono"
              >
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={padLeft}
          x2={width - padRight}
          y1={height - padBottom}
          y2={height - padBottom}
          stroke="#CBD5E1"
          strokeWidth="1.25"
        />
        <line
          x1={padLeft}
          x2={padLeft}
          y1={padTop}
          y2={height - padBottom}
          stroke="#CBD5E1"
          strokeWidth="1.25"
        />

        {/* Residual lines + regression best-fit line */}
        <g clipPath="url(#plot-clip)">
          {points.map((pt, i) => {
            const px = toSvgX(pt.x);
            const py = toSvgY(pt.y);
            const predY = toSvgY(slope * pt.x + intercept);
            return (
              <line
                key={`res-${i}`}
                x1={px}
                x2={px}
                y1={py}
                y2={predY}
                stroke="#94A3B8"
                strokeOpacity="0.45"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            );
          })}

          <line
            x1={toSvgX(minX)}
            y1={toSvgY(lineY1)}
            x2={toSvgX(maxX)}
            y2={toSvgY(lineY2)}
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* Data points */}
        {points.map((pt, idx) => {
          const cx = toSvgX(pt.x);
          const cy = toSvgY(pt.y);
          return (
            <g
              key={`pt-${idx}`}
              onClick={(e) => {
                if (interactive && onRemovePoint && points.length > 2) {
                  e.stopPropagation();
                  onRemovePoint(idx);
                }
              }}
              className={interactive && points.length > 2 ? 'cursor-pointer' : ''}
            >
              <circle
                cx={cx}
                cy={cy}
                r={5.5}
                fill="#0F172A"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <title>{`(${pt.x}, ${pt.y})${interactive && points.length > 2 ? ' — Click to remove' : ''}`}</title>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={padLeft + plotW / 2}
          y={height - 6}
          textAnchor="middle"
          className="fill-slate-600 text-[11px] font-medium"
        >
          {xLabel}
        </text>
        <text
          x={14}
          y={padTop + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${padTop + plotH / 2})`}
          className="fill-slate-600 text-[11px] font-medium"
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
}

interface LossChartProps {
  history: LossPoint[];
}

export function LossChart({ history }: LossChartProps) {
  if (!history || history.length < 2) {
    return (
      <div className="h-[112px] flex items-center justify-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-slate-50">
        Closed-form OLS solves directly in a single analytical step.
      </div>
    );
  }

  const width = 360;
  const height = 112;
  const padX = 28;
  const padY = 14;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const minEpoch = history[0].epoch;
  const maxEpoch = history[history.length - 1].epoch;
  const losses = history.map((h) => h.mse);
  const minLoss = Math.min(...losses);
  const maxLoss = Math.max(...losses);
  const lossRange = maxLoss - minLoss || 1;

  const coords = history
    .map((pt) => {
      const x = padX + ((pt.epoch - minEpoch) / (maxEpoch - minEpoch || 1)) * plotW;
      const y = padY + plotH - ((pt.mse - minLoss) / lossRange) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[112px] border border-slate-200 rounded-xl bg-slate-50"
      role="img"
      aria-label="Gradient descent MSE loss convergence curve"
    >
      <polyline
        fill="none"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
      <text x={padX} y={height - 4} className="fill-slate-500 text-[9px] font-mono">
        Epoch {minEpoch} ({maxLoss.toFixed(1)})
      </text>
      <text x={width - padX} y={height - 4} textAnchor="end" className="fill-slate-500 text-[9px] font-mono">
        Epoch {maxEpoch} ({minLoss.toFixed(2)})
      </text>
    </svg>
  );
}
