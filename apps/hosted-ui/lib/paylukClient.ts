/**
 * Payluk API Client
 *
 * This module provides a client for interacting with the Payluk API.
 * All requests are authenticated using the Payluk secret key from environment variables.
 *
 * PAYMENT OPTIONS:
 * For buyer payments, there are two options:
 *
 * 1. API Route (makeEscrowPayment):
 *    POST https://staging.api.payluk.ng/v1/payment/escrow
 *    - Supports card and wallet gateways
 *    - Requires customer-id header
 *
 * 2. SDK Method (Recommended - Cleaner):
 *    import { useEscrowCheckout } from 'payluk-escrow-inline-checkout/react';
 *    const { pay } = useEscrowCheckout();
 *    await pay({
 *      paymentToken,
 *      reference,
 *      redirectUrl: window.location.href,
 *      brand: 'YourBrand',
 *      customerId: paylukCustomerId, // optional for business escrows
 *      callback: (result) => { ... },
 *      onClose: () => { ... }
 *    });
 */

const PAYLUK_API_URL = process.env.PAYLUK_API_URL || 'https://staging.api.payluk.ng/v1';
const PAYLUK_SECRET_KEY = process.env.PAYLUK_SECRET_KEY;

interface PaylukRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: any;
  customerId?: string;
}

// Type definitions for API responses
export interface PaylukCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export interface PaylukEscrow {
  id: string;
  paymentToken: string;
  amount: number;
  purpose: string;
  status: string;
  [key: string]: any;
}

export interface PaylukWallet {
  available: number;
  pending: number;
  currency: string;
}

export interface PaylukPaymentResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    amount: number;
  };
}

export interface PaylukDispute {
  id: string;
  purpose: string;
  amount: number;
  status: string;
  dispute: Array<{
    name: string;
    type: 'buyer' | 'seller';
    message: string;
    proofUrl?: string;
  }>;
}

/**
 * Make an authenticated request to the Payluk API
 */
async function paylukRequest<T>({ method, endpoint, body, customerId }: PaylukRequestOptions): Promise<T> {
  if (!PAYLUK_SECRET_KEY) {
    throw new Error('PAYLUK_SECRET_KEY is not configured');
  }
  console.log('making a request to payluk api endpoint', `${PAYLUK_API_URL}${endpoint}`)

  const url = `${PAYLUK_API_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Authorization': `Bearer ${PAYLUK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  // Add customer-id header if provided
  if (customerId) {
    headers['customer-id'] = customerId;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Payluk API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Payluk API request failed:', error);
    throw error;
  }
}

/**
 * Create a new customer in Payluk
 */
export async function createCustomer(data: {
  email: string;
  name: string;
  phone?: string;
}): Promise<{ status: boolean; data: PaylukCustomer }> {
  return paylukRequest({
    method: 'POST',
    endpoint: '/customers',
    body: data,
  });
}

/**
 * Create a new escrow transaction
 * Returns paymentToken for buyer's SDK and payluk_escrow_id
 */
export async function createEscrow(data: {
  sellerId: string;
  amount: number;
  purpose: string;
  description?: string;
  whoPays?: 'buyer' | 'seller';
  imageUrl?: string;
  maxDelivery?: number;
  deliveryTimeline?: string;
  totalQuantity?: number;
}): Promise<{ status: boolean; paymentToken: string; payluk_escrow_id: string; data: PaylukEscrow }> {
  return paylukRequest({
    method: 'POST',
    endpoint: '/escrow/create',
    customerId: data.sellerId,
    body: {
      amount: data.amount,
      purpose: data.purpose,
      description: data.description || '',
      whoPays: data.whoPays || 'buyer',
      imageUrl: data.imageUrl || null,
      maxDelivery: data.maxDelivery || 20,
      deliveryTimeline: data.deliveryTimeline || 'minutes',
      totalQuantity: data.totalQuantity || 1,
    },
  });
}

/**
 * Get all escrow transactions for a customer
 */
export async function getTransactions(
  customerId: string,
  type: 'sales' | 'buy' = 'sales'
): Promise<{ status: boolean; data: PaylukEscrow[] }> {
  return paylukRequest({
    method: 'GET',
    endpoint: `/escrow/transactions?type=${type}`,
    customerId,
  });
}

/**
 * Get wallet information for a customer
 */
export async function getWallet(customerId: string): Promise<{ status: boolean; data: PaylukWallet }> {
  return paylukRequest({
    method: 'GET',
    endpoint: '/wallet',
    customerId,
  });
}

/**
 * Make escrow payment via API (alternative to SDK)
 * For buyer to pay for an escrow transaction
 *
 * Note: The SDK method (useEscrowCheckout) is recommended as it's cleaner
 */
export async function makeEscrowPayment(data: {
  customerId: string;
  amount: number;
  reference: string;
  gateway: 'card' | 'wallet';
  transactionType?: 'escrow';
  cardId?: string;
  escrowDetails: {
    paymentToken: string;
    [key: string]: any;
  };
}): Promise<PaylukPaymentResponse> {
  return paylukRequest({
    method: 'POST',
    endpoint: '/payment/escrow',
    customerId: data.customerId,
    body: {
      amount: data.amount,
      reference: data.reference,
      gateway: data.gateway,
      transactionType: data.transactionType || 'escrow',
      ...(data.cardId && { cardId: data.cardId }),
      escrowDetails: data.escrowDetails,
    },
  });
}

/**
 * Claim funds from escrow (seller action after buyer confirms)
 */
export async function claimFunds(
  paymentToken: string,
  customerId: string
): Promise<{ status: boolean; message: string; data: any }> {
  return paylukRequest({
    method: 'GET',
    endpoint: `/escrow/claim-funds/${paymentToken}`,
    customerId,
  });
}

/**
 * Confirm/release payment (buyer action)
 */
export async function confirmPayment(
  paylukEscrowId: string,
  customerId: string
): Promise<{ status: boolean; message: string; data: any }> {
  return paylukRequest({
    method: 'POST',
    endpoint: `/escrow/confirm-payment/${paylukEscrowId}`,
    customerId,
    body: {},
  });
}

/**
 * Lodge a dispute for an escrow transaction
 * Note: This endpoint uses multipart/form-data in the actual API
 */
export async function lodgeDispute(data: {
  paymentToken: string;
  customerId: string;
  message: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<{ status: boolean; message: string; data: PaylukEscrow }> {
  return paylukRequest({
    method: 'POST',
    endpoint: `/escrow/submit-dispute/${data.paymentToken}`,
    customerId: data.customerId,
    body: {
      message: data.message,
      ...(data.imageBase64 && {
        imageBase64: data.imageBase64,
        imageMimeType: data.imageMimeType,
      }),
    },
  });
}

/**
 * Get disputes for a customer
 */
export async function getDisputes(
  customerId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ status: boolean; data: { data: PaylukDispute[]; pagination: any } }> {
  return paylukRequest({
    method: 'GET',
    endpoint: `/escrow/dispute/get?page=${page}&limit=${limit}`,
    customerId,
  });
}

/**
 * Get specific dispute details
 */
export async function getDispute(
  disputeId: string,
  customerId: string
): Promise<{ status: boolean; data: PaylukDispute }> {
  return paylukRequest({
    method: 'GET',
    endpoint: `/escrow/dispute/${disputeId}`,
    customerId,
  });
}

/**
 * Resolve a dispute (admin action)
 */
export async function resolveDispute(data: {
  disputeId: string;
  customerId: string;
  resolution: string;
  winner: 'buyer' | 'seller';
}): Promise<{ status: boolean; message: string; data: any }> {
  return paylukRequest({
    method: 'POST',
    endpoint: `/escrow/dispute/${data.disputeId}/resolve`,
    customerId: data.customerId,
    body: {
      resolution: data.resolution,
      winner: data.winner,
    },
  });
}

export const paylukClient = {
  createCustomer,
  createEscrow,
  getTransactions,
  getWallet,
  makeEscrowPayment,
  claimFunds,
  confirmPayment,
  lodgeDispute,
  getDisputes,
  getDispute,
  resolveDispute,
};

// Made with Bob
