/**
 * Authentication Helpers
 * 
 * Provides API key validation and nonce management for SDK-to-API authentication.
 */

import { NextRequest } from 'next/server';

const API_KEY = process.env.API_KEY;

// In-memory nonce store (for MVP - should use Redis in production)
const usedNonces = new Set<string>();
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Clean up old nonces periodically
setInterval(() => {
  usedNonces.clear();
}, NONCE_EXPIRY_MS);

/**
 * Validate API key and nonce from request headers
 */
export function validateApiKey(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  if (!API_KEY) {
    return { valid: false, error: 'API_KEY not configured on server' };
  }

  const apiKey = request.headers.get('X-API-Key');
  const nonce = request.headers.get('X-Nonce');

  if (!apiKey) {
    console.log('missing api key:', apiKey)
    return { valid: false, error: 'Missing API key' };
  }

  if (apiKey !== API_KEY) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (!nonce) {
    return { valid: false, error: 'Missing nonce' };
  }

  // Check if nonce has been used
  if (usedNonces.has(nonce)) {
    return { valid: false, error: 'Nonce already used' };
  }

  // Mark nonce as used
  usedNonces.add(nonce);

  return { valid: true };
}

/**
 * Session token storage (in-memory for MVP)
 */
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
  createdAt: number;
}

const sessionTokens = new Map<string, SessionData>();
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of sessionTokens.entries()) {
    if (now - data.createdAt > SESSION_EXPIRY_MS) {
      sessionTokens.delete(token);
    }
  }
}, 60 * 1000); // Check every minute

/**
 * Generate a session token
 */
export function generateSessionToken(data: Omit<SessionData, 'createdAt'>): string {
  const token = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  sessionTokens.set(token, {
    ...data,
    createdAt: Date.now(),
  });

  return token;
}

/**
 * Validate and retrieve session data
 */
export function validateSessionToken(token: string): {
  valid: boolean;
  data?: SessionData;
  error?: string;
} {
  const sessionData = sessionTokens.get(token);

  if (!sessionData) {
    return { valid: false, error: 'Invalid or expired session token' };
  }

  const now = Date.now();
  if (now - sessionData.createdAt > SESSION_EXPIRY_MS) {
    sessionTokens.delete(token);
    return { valid: false, error: 'Session token expired' };
  }

  return { valid: true, data: sessionData };
}

/**
 * Delete a session token
 */
export function deleteSessionToken(token: string): void {
  sessionTokens.delete(token);
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status: number = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Made with Bob
