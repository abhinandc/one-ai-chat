import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  className?: string;
  showArea?: boolean;
}

export function SparklineChart({
  data,
  width = 100,
  height = 32,
  strokeColor = 'currentColor',
  fillColor,
  strokeWidth = 2,
  className,
  showArea = true,
}: SparklineChartProps) {
  const gradientId = useMemo(() => `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  const { path, areaPath } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', areaPath: '' };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding + (1 - (value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create smooth curve path using cardinal spline
    const linePath = points.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x},${point.y}`;
      }
      return `${acc} L ${point.x},${point.y}`;
    }, '');

    // Create area path for gradient fill
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaPathStr = `${linePath} L ${lastPoint.x},${height - padding} L ${firstPoint.x},${height - padding} Z`;

    return { path: linePath, areaPath: areaPathStr };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-text-tertiary text-xs", className)}
        style={{ width, height }}
      >
        No data
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {showArea && fillColor && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
          />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
