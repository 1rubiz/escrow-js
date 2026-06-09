/**
 * useEscrowStatus Hook
 * 
 * Polls the escrow status endpoint and provides real-time status updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getEscrowStatus } from '@/lib/api';
import { EscrowStatus, isTerminalStatus } from '@/lib/statusHelpers';
import { sendPostMessage } from '@/lib/postMessage';

interface EscrowStatusData {
  status: EscrowStatus;
  amount: number;
  currency?: string;
  buyer: any;
  seller: any;
  conditions: string[];
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

interface UseEscrowStatusOptions {
  transactionId: string;
  apiKey: string;
  pollingInterval?: number; // milliseconds, default 5000
  enabled?: boolean; // whether to start polling immediately
}

interface UseEscrowStatusReturn {
  data: EscrowStatusData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

export function useEscrowStatus({
  transactionId,
  apiKey,
  pollingInterval = 5000,
  enabled = true,
}: UseEscrowStatusOptions): UseEscrowStatusReturn {
  const [data, setData] = useState<EscrowStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<EscrowStatus | null>(null);

  /**
   * Fetch the current escrow status
   */
  const fetchStatus = useCallback(async () => {
    if (!transactionId || !apiKey) {
      return;
    }

    try {
      const result = await getEscrowStatus(transactionId, apiKey);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.data) {
        setData(result.data as EscrowStatusData);
        setError(null);

        // Send postMessage if status changed
        if (previousStatusRef.current && previousStatusRef.current !== result.data.status) {
          sendPostMessage({
            type: 'STATUS_UPDATED',
            status: result.data.status,
            transactionId,
          });
        }

        previousStatusRef.current = result.data.status as EscrowStatus;

        // Stop polling if terminal status reached
        if (isTerminalStatus(result.data.status as EscrowStatus)) {
          stopPolling();
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching escrow status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      setLoading(false);
    }
  }, [transactionId, apiKey]);

  /**
   * Start polling for status updates
   */
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      return; // Already polling
    }

    setIsPolling(true);
    
    // Fetch immediately
    fetchStatus();

    // Then poll at interval
    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, pollingInterval);
  }, [fetchStatus, pollingInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * Manual refetch
   */
  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchStatus();
  }, [fetchStatus]);

  /**
   * Start/stop polling based on enabled prop
   */
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    data,
    loading,
    error,
    refetch,
    startPolling,
    stopPolling,
    isPolling,
  };
}

// Made with Bob