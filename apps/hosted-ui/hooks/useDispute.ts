import { useState, useCallback } from 'react';
import { Dispute, DisputeReason } from '@/lib/disputeHelpers';
import { sendPostMessage } from '@/lib/postMessage';

interface UseDisputeOptions {
  transactionId: string;
  onSuccess?: (dispute: Dispute) => void;
  onError?: (error: Error) => void;
}

interface CreateDisputeParams {
  reason: DisputeReason;
  description: string;
  evidence?: string[];
}

export function useDispute({ transactionId, onSuccess, onError }: UseDisputeOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);

  /**
   * Create a new dispute
   */
  const createDispute = useCallback(
    async (params: CreateDisputeParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/payluk/dispute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId,
            ...params,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create dispute');
        }

        const data = await response.json();
        const newDispute: Dispute = {
          disputeId: data.disputeId,
          transactionId: data.transactionId,
          status: data.status,
          reason: params.reason,
          description: params.description,
          createdAt: data.createdAt,
        };

        setDispute(newDispute);

        // Send postMessage to parent
        sendPostMessage({
          type: 'DISPUTE_OPENED',
          transactionId,
          disputeId: data.disputeId,
        });

        onSuccess?.(newDispute);
        return newDispute;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [transactionId, onSuccess, onError]
  );

  /**
   * Fetch dispute details
   */
  const fetchDispute = useCallback(
    async (disputeId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/payluk/dispute/${disputeId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch dispute');
        }

        const data = await response.json();
        setDispute(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [onError]
  );

  /**
   * Send a message in the dispute thread
   */
  const sendMessage = useCallback(
    async (disputeId: string, message: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/payluk/dispute/${disputeId}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [onError]
  );

  /**
   * Reset dispute state
   */
  const reset = useCallback(() => {
    setDispute(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    dispute,
    isLoading,
    error,
    createDispute,
    fetchDispute,
    sendMessage,
    reset,
  };
}

// Made with Bob
