/**
 * useSession Hook
 * 
 * Manages session state and validation for the hosted UI.
 */

'use client';

import { useState, useEffect } from 'react';
import { validateSessionToken } from '@/lib/api';
import { notifyError } from '@/lib/postMessage';

interface SessionData {
  customerId: string;
  participantId?: string;
  isSeller?: boolean;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  conditions?: string[];
  metadata?: Record<string, any>;
}

interface UseSessionResult {
  session: SessionData | null;
  loading: boolean;
  error: string | null;
  token: string | null;
}

/**
 * Hook to manage session state
 */
export function useSession(tokenFromUrl?: string): UseSessionResult {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function validateSession() {
      // Get token from URL parameter
      const urlToken = tokenFromUrl || new URLSearchParams(window.location.search).get('token');
      
      if (!urlToken) {
        const errorMsg = 'No session token provided';
        setError(errorMsg);
        setLoading(false);
        notifyError(errorMsg);
        return;
      }

      setToken(urlToken);

      // Validate token
      const result = await validateSessionToken(urlToken);

      if (result.error || !result.data) {
        const errorMsg = result.error || 'Failed to validate session';
        setError(errorMsg);
        setLoading(false);
        notifyError(errorMsg);
        return;
      }

      // Set session data
      setSession(result.data);
      setLoading(false);
    }

    validateSession();
  }, [tokenFromUrl]);

  return { session, loading, error, token };
}

// Made with Bob