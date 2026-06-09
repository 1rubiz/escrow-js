/**
 * Ruby Escrow SDK API Client
 * Handles HTTP requests to the hosted UI API with authentication
 */

import { configManager } from '../config';
import {
  EscrowError,
  CreateCustomerData,
  CreateCustomerResponse,
  SessionTokenData,
  SessionTokenResponse,
} from '../types';

/**
 * Generate a random nonce for API authentication
 */
function generateNonce(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Make an authenticated API request
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = configManager.requireConfig();
  const nonce = generateNonce();

  const url = `${config.baseUrl}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Key': config.apiKey,
    'X-Nonce': nonce,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse response
    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new EscrowError(
        'Failed to parse API response',
        'PARSE_ERROR',
        { status: response.status, statusText: response.statusText }
      );
    }

    console.log('API Response:', response.status, data);

    // Handle error responses
    if (!response.ok) {
      // Check if response has error structure
      const error = data.error || data;
      const errorMessage = error.message || response.statusText || 'Unknown error occurred';
      const errorCode = error.code || 'API_ERROR';
      
      throw new EscrowError(
        errorMessage,
        errorCode,
        error.details
      );
    }

    // Return data directly if it's not wrapped in ApiResponse format
    // This handles both { success: true, data: {...} } and direct responses like { token, expiresIn }
    if (data.success !== undefined && data.data !== undefined) {
      return data.data as T;
    }
    
    return data as T;
  } catch (error) {
    // Re-throw EscrowError as-is
    if (error instanceof EscrowError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new EscrowError(
        'Network error: Unable to connect to API',
        'NETWORK_ERROR',
        { originalError: error.message }
      );
    }

    // Handle other errors
    throw new EscrowError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * API Client methods
 */
export const apiClient = {
  /**
   * Create a new customer
   */
  async createCustomer(
    customerData: CreateCustomerData
  ): Promise<CreateCustomerResponse> {
    return makeRequest<CreateCustomerResponse>('/api/payluk/create-customer', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  },

  /**
   * Generate a session token for escrow initialization
   */
  async generateSessionToken(
    sessionData: SessionTokenData
  ): Promise<SessionTokenResponse> {
    return makeRequest<SessionTokenResponse>('/api/payluk/generate-session-token', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  /**
   * Validate a session token
   */
  async validateSessionToken(token: string): Promise<boolean> {
    try {
      const result = await makeRequest<{ valid: boolean }>(
        '/api/payluk/validate-session-token',
        {
          method: 'POST',
          body: JSON.stringify({ token }),
        }
      );
      return result.valid;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get wallet information for a customer
   */
  async getWallet(customerId: string): Promise<any> {
    return makeRequest(`/api/payluk/wallet/${customerId}`, {
      method: 'GET',
    });
  },

  /**
   * Get escrow transaction status
   */
  async getEscrowStatus(transactionId: string): Promise<any> {
    return makeRequest(`/api/payluk/escrow-status/${transactionId}`, {
      method: 'GET',
    });
  },

  /**
   * Create a payment
   */
  async createPayment(paymentData: any): Promise<any> {
    return makeRequest('/api/payluk/payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  /**
   * Create a dispute
   */
  async createDispute(disputeData: any): Promise<any> {
    return makeRequest('/api/payluk/dispute', {
      method: 'POST',
      body: JSON.stringify(disputeData),
    });
  },
};

// Made with Bob
