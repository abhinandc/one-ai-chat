import { useState, useEffect } from 'react';
import { analyticsService, UsageMetrics, ActivityEvent } from '../services/analyticsService';
import { logger } from '@/lib/logger';

export function useAnalytics(userEmail?: string) {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const [metricsData, activityData] = await Promise.all([
          analyticsService.getUsageMetrics(userEmail),
          analyticsService.getActivityFeed(userEmail, 10)
        ]);
        
        setMetrics(metricsData);
        setActivity(activityData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  const trackEvent = async (action: string, resourceType: string, resourceId: string, metadata?: any) => {
    if (!userEmail) return;
    
    try {
      await analyticsService.trackEvent({
        user_email: userEmail,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata: metadata || {}
      });
      
      // Refresh activity feed
      const activityData = await analyticsService.getActivityFeed(userEmail, 10);
      setActivity(activityData);
    } catch (error) {
      logger.error('Failed to track event', error);
    }
  };

  return {
    metrics,
    activity,
    loading,
    error,
    trackEvent,
    refetch: () => {
      if (userEmail) {
        const fetchData = async () => {
          const [metricsData, activityData] = await Promise.all([
            analyticsService.getUsageMetrics(userEmail),
            analyticsService.getActivityFeed(userEmail, 10)
          ]);
          setMetrics(metricsData);
          setActivity(activityData);
        };
        fetchData();
      }
    }
  };
}
