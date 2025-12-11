// frontend/lib/hooks/useExcavation.ts
import { useState, useCallback } from 'react';
import api, { ExcavationJob } from '@/lib/api';

export function useExcavation() {
  const [job, setJob] = useState<ExcavationJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startExcavation = useCallback(async (repoUrl: string) => {
    setIsLoading(true);
    setError(null);
    setJob(null);

    try {
      const result = await api.startExcavation(repoUrl);
      
      // Poll for updates
      const completedJob = await api.pollExcavation(
        result.jobId,
        (updatedJob) => setJob(updatedJob)
      );
      
      setJob(completedJob);
      return completedJob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start excavation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setJob(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    job,
    isLoading,
    error,
    startExcavation,
    reset,
  };
}
