// frontend/lib/hooks/useActivity.ts
import { useState, useEffect, useCallback } from 'react';
import api, { Activity } from '@/lib/api';

export function useActivity(pollInterval: number = 10000) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      const data = await api.getRecentActivity(20);
      setActivities(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    
    const interval = setInterval(fetchActivities, pollInterval);
    return () => clearInterval(interval);
  }, [fetchActivities, pollInterval]);

  return { activities, isLoading, error, refresh: fetchActivities };
}
