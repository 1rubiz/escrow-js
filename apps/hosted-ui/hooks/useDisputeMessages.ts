import { useState, useEffect, useCallback, useRef } from 'react';
import { DisputeMessage } from '@/lib/disputeHelpers';

interface UseDisputeMessagesOptions {
  disputeId: string | null;
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
  onNewMessage?: (message: DisputeMessage) => void;
  onError?: (error: Error) => void;
}

export function useDisputeMessages({
  disputeId,
  enabled = true,
  pollingInterval = 5000, // 5 seconds default
  onNewMessage,
  onError,
}: UseDisputeMessagesOptions) {
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(0);

  /**
   * Fetch messages for a dispute
   */
  const fetchMessages = useCallback(async () => {
    if (!disputeId || !enabled) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/payluk/dispute/${disputeId}/messages`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch messages');
      }

      const data = await response.json();
      const newMessages: DisputeMessage[] = data.messages || [];

      // Check if there are new messages
      if (newMessages.length > lastMessageCountRef.current) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage) {
          onNewMessage?.(latestMessage);
        }
      }

      lastMessageCountRef.current = newMessages.length;
      setMessages(newMessages);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [disputeId, enabled, onNewMessage, onError]);

  /**
   * Start polling for messages
   */
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fetch immediately
    fetchMessages();

    // Then poll at interval
    intervalRef.current = setInterval(() => {
      fetchMessages();
    }, pollingInterval);
  }, [fetchMessages, pollingInterval]);

  /**
   * Stop polling for messages
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Manually refresh messages
   */
  const refresh = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  /**
   * Add a new message optimistically (before server confirmation)
   */
  const addOptimisticMessage = useCallback((message: DisputeMessage) => {
    setMessages((prev) => [...prev, message]);
    lastMessageCountRef.current += 1;
  }, []);

  // Start/stop polling based on enabled state and disputeId
  useEffect(() => {
    if (disputeId && enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [disputeId, enabled, startPolling, stopPolling]);

  // Reset when disputeId changes
  useEffect(() => {
    setMessages([]);
    lastMessageCountRef.current = 0;
    setError(null);
  }, [disputeId]);

  return {
    messages,
    isLoading,
    error,
    refresh,
    addOptimisticMessage,
    startPolling,
    stopPolling,
  };
}

// Made with Bob
