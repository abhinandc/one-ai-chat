import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SparklineChart } from './SparklineChart';
import { cn } from '@/lib/utils';

/**
 * MetricCard - Dashboard metric display component
 *
 * Uses shadcn-ui Card with proper typography components
 * per hardUIrules.md MALA theme specification
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
  };
  sparklineData?: number[];
  sparklineColor?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  sparklineData,
  sparklineColor,
  loading = false,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="size-3" />;
    if (trend.value < 0) return <TrendingDown className="size-3" />;
    return <Minus className="size-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600 bg-green-500/10';
    if (trend.value < 0) return 'text-red-600 bg-red-500/10';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <Card
      variant="default"
      className={cn("hover:shadow-md transition-shadow", className)}
      data-testid="metric-card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center justify-center size-9 rounded-lg",
              iconColor === 'text-primary' ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Icon className={cn("size-4", iconColor)} />
            </div>
            <CardDescription className="text-sm font-medium">{title}</CardDescription>
          </div>
          {sparklineData && sparklineData.length > 0 && (
            <SparklineChart
              data={sparklineData}
              width={80}
              height={32}
              strokeColor={sparklineColor || 'hsl(var(--primary))'}
              fillColor={sparklineColor || 'hsl(var(--primary))'}
              strokeWidth={2}
              showArea
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <CardTitle as="h4" className="text-2xl font-bold tabular-nums tracking-tight">
            {value}
          </CardTitle>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {trend && (
            <Badge
              variant="secondary"
              className={cn("text-xs gap-1 px-1.5 py-0.5", getTrendColor())}
            >
              {getTrendIcon()}
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </Badge>
          )}
          {subtitle && (
            <CardDescription className="text-xs">{subtitle}</CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
