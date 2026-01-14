/**
 * Review Polling Hook
 * Polls review status for ASR and analysis completion
 */

import { useState, useEffect, useCallback } from 'react';
import { interviewAPI } from '@/api/interview';
import type { InterviewReview, ReviewStatus } from '@/types/interview';

interface UseReviewPollingOptions {
  enabled?: boolean;
  interval?: number; // Polling interval in ms
  maxAttempts?: number;
  onComplete?: (review: InterviewReview) => void;
  onError?: (error: Error) => void;
}

export const useReviewPolling = (
  reviewId: number | null,
  options: UseReviewPollingOptions = {}
) => {
  const {
    enabled = true,
    interval = 3000,
    maxAttempts = 100,
    onComplete,
    onError,
  } = options;

  const [review, setReview] = useState<InterviewReview | null>(null);
  const [status, setStatus] = useState<ReviewStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Check if status is terminal (no more polling needed)
  const isTerminalStatus = (status: ReviewStatus): boolean => {
    return status === 'completed' || status === 'failed' || status === 'timeout';
  };

  const fetchReview = useCallback(async () => {
    if (!reviewId) return;

    try {
      const data = await interviewAPI.getReview(reviewId);
      setReview(data);
      setStatus(data.metadata.status);
      setError(null);

      // Check if completed
      if (isTerminalStatus(data.metadata.status)) {
        setIsPolling(false);
        if (onComplete) {
          onComplete(data);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch review');
      setError(error);
      setIsPolling(false);
      if (onError) {
        onError(error);
      }
    }
  }, [reviewId, onComplete, onError]);

  // Start polling
  useEffect(() => {
    if (!reviewId || !enabled) {
      setIsPolling(false);
      return;
    }

    // Initial fetch
    fetchReview();

    // Don't start polling if status is already terminal
    if (status && isTerminalStatus(status)) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    setAttempts(0);

    const intervalId = setInterval(() => {
      setAttempts((prev) => {
        const nextAttempt = prev + 1;

        // Check max attempts
        if (nextAttempt >= maxAttempts) {
          clearInterval(intervalId);
          setIsPolling(false);
          const timeoutError = new Error('Polling timeout');
          setError(timeoutError);
          if (onError) {
            onError(timeoutError);
          }
          return nextAttempt;
        }

        fetchReview();
        return nextAttempt;
      });
    }, interval);

    return () => {
      clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [reviewId, enabled, status, interval, maxAttempts, fetchReview, onError]);

  /**
   * Manually trigger a refresh
   */
  const refresh = useCallback(() => {
    fetchReview();
  }, [fetchReview]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    review,
    status,
    isPolling,
    attempts,
    error,
    refresh,
    stopPolling,
  };
};
