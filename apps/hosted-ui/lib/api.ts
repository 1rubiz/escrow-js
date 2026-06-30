/**
 * Client-side API Wrapper
 *
 * Provides functions for calling Next.js API routes from the hosted UI.
 * These functions run in the browser and communicate with the backend API routes.
 */

import { type PaylukEscrow } from "./paylukClient";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export interface TransactionsResponse {
  data: PaylukEscrow[];
  pagination: {
    count: number;
    pages: number;
    isLastPage: boolean;
    nextPage: string | null;
    previousPage: string | null;
  };
  report: {
    amount: {
      total: number;
      completed: number;
      ongoing: number;
      dispute: number;
    };
    dispute: number;
    ongoing: number;
    total: number;
  };
}

/**
 * Validate a session token
 */
export async function validateSessionToken(token: string): Promise<
  ApiResponse<{
    customerId: string;
    participantId?: string;
    isSeller?: boolean;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
    conditions?: string[];
    metadata?: Record<string, any>;
  }>
> {
  try {
    const response = await fetch("/api/payluk/validate-session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to validate session token" };
    }

    return { data: result.data };
  } catch (error) {
    console.error("Validate session token error:", error);
    return { error: "Network error" };
  }
}

/**
 * Get wallet information for a customer
 */
export async function getWallet(
  customerId: string,
  apiKey: string,
): Promise<
  ApiResponse<{
    escrowBalance: number;
    mainBalance: number;
    currency: string;
    transactions: any[];
  }>
> {
  try {
    const response = await fetch(`/api/payluk/wallet/${customerId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "x-nonce": `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to get wallet" };
    }

    return { data: result.data };
  } catch (error) {
    console.error("Get wallet error:", error);
    return { error: "Network error" };
  }
}

/**
 * Get wallet information for a customer
 */
export async function getTransactions(
  customerId: string,
  type: "sales" | "buy",
  apiKey: string,
): Promise<ApiResponse<TransactionsResponse>> {
  try {
    const response = await fetch(
      `/api/payluk/transactions/get/${customerId}/${type}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "x-nonce": `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to get wallet" };
    }

    return { data: result.data };
  } catch (error) {
    console.error("Get wallet error:", error);
    return { error: "Network error" };
  }
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  data: {
    customerId: string;
    amount: number;
    currency?: string;
    buyer: { id: string };
    seller: { id: string };
    conditions: string[];
    description?: string;
    metadata?: Record<string, any>;
  },
  apiKey: string,
): Promise<
  ApiResponse<{
    transactionId: string;
    status: string;
  }>
> {
  try {
    const response = await fetch("/api/payluk/create-transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-nonce": `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to create transaction" };
    }

    return { data: result };
  } catch (error) {
    console.error("Create transaction error:", error);
    return { error: "Network error" };
  }
}

/**
 * Get escrow status for a transaction
 */
export async function getEscrowStatus(
  transactionId: string,
  apiKey: string,
): Promise<
  ApiResponse<{
    status: string;
    amount: number;
    buyer: any;
    seller: any;
    conditions: string[];
  }>
> {
  try {
    const response = await fetch(`/api/payluk/escrow-status/${transactionId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "x-nonce": `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to get escrow status" };
    }

    return { data: result };
  } catch (error) {
    console.error("Get escrow status error:", error);
    return { error: "Network error" };
  }
}

/**
 * Initiate payment for a transaction
 */
export async function initiatePayment(
  data: {
    transactionId: string;
    paymentMethod: string;
    paymentDetails?: Record<string, any>;
  },
  apiKey: string,
): Promise<
  ApiResponse<{
    paymentUrl?: string;
    status: string;
  }>
> {
  try {
    const response = await fetch("/api/payluk/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-nonce": `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to initiate payment" };
    }

    return { data: result };
  } catch (error) {
    console.error("Initiate payment error:", error);
    return { error: "Network error" };
  }
}

/**
 * Create a dispute for a transaction
 */
export async function createDispute(
  data: {
    transactionId: string;
    reason: string;
    description: string;
    evidence?: string[];
  },
  apiKey: string,
): Promise<
  ApiResponse<{
    disputeId: string;
    status: string;
  }>
> {
  try {
    const response = await fetch("/api/payluk/dispute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-nonce": `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to create dispute" };
    }

    return { data: result };
  } catch (error) {
    console.error("Create dispute error:", error);
    return { error: "Network error" };
  }
}

/**
 * Mark transaction as delivered (seller action)
 */
export async function markAsDelivered(
  transactionId: string,
  notes: string,
  apiKey: string,
): Promise<
  ApiResponse<{
    status: string;
  }>
> {
  try {
    const response = await fetch(
      `/api/payluk/transactions/${transactionId}/deliver`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-nonce": `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        },
        body: JSON.stringify({ notes }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to mark as delivered" };
    }

    return { data: result };
  } catch (error) {
    console.error("Mark as delivered error:", error);
    return { error: "Network error" };
  }
}

/**
 * Release payment to seller (buyer action)
 */
export async function releasePayment(
  transactionId: string,
  apiKey: string,
): Promise<
  ApiResponse<{
    status: string;
  }>
> {
  try {
    const response = await fetch(
      `/api/payluk/transactions/${transactionId}/release`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-nonce": `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        },
        body: JSON.stringify({}),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Failed to release payment" };
    }

    return { data: result };
  } catch (error) {
    console.error("Release payment error:", error);
    return { error: "Network error" };
  }
}

// Made with Bob
