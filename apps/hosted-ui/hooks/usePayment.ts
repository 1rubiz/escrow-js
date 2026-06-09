/**
 * usePayment Hook
 * 
 * Handles payment initiation and processing for escrow transactions
 */

import { useState, useCallback } from 'react';
import { initiatePayment } from '@/lib/api';
import { sendPostMessage } from '@/lib/postMessage';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  description?: string;
  fees?: {
    fixed: number;
    percentage: number;
  };
}

interface UsePaymentOptions {
  transactionId: string;
  apiKey: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface UsePaymentReturn {
  initiatePaymentProcess: (paymentMethod: string, paymentDetails?: Record<string, any>) => Promise<void>;
  loading: boolean;
  error: string | null;
  paymentUrl: string | null;
  paymentStatus: string | null;
}

export function usePayment({
  transactionId,
  apiKey,
  onSuccess,
  onError,
}: UsePaymentOptions): UsePaymentReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  /**
   * Initiate payment process
   */
  const initiatePaymentProcess = useCallback(
    async (paymentMethod: string, paymentDetails?: Record<string, any>) => {
      if (!transactionId || !apiKey) {
        const errorMsg = 'Missing transaction ID or API key';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);
      setPaymentUrl(null);
      setPaymentStatus(null);

      try {
        const result = await initiatePayment(
          {
            transactionId,
            paymentMethod,
            paymentDetails: paymentDetails || {},
          },
          apiKey
        );

        if (result.error) {
          setError(result.error);
          onError?.(result.error);
          
          // Send error postMessage
          sendPostMessage({
            type: 'ERROR',
            error: result.error,
          });
          
          setLoading(false);
          return;
        }

        if (result.data) {
          setPaymentStatus(result.data.status);
          
          // If there's a payment URL, set it (for redirect-based payments)
          if (result.data.paymentUrl) {
            setPaymentUrl(result.data.paymentUrl);
          }

          // Send success postMessage
          sendPostMessage({
            type: 'PAYMENT_COMPLETED',
            transactionId,
            amount: 0, // Amount should come from transaction data
          });

          onSuccess?.(result.data);
        }

        setLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Payment initiation failed';
        console.error('Payment error:', err);
        setError(errorMsg);
        onError?.(errorMsg);
        
        // Send error postMessage
        sendPostMessage({
          type: 'ERROR',
          error: errorMsg,
        });
        
        setLoading(false);
      }
    },
    [transactionId, apiKey, onSuccess, onError]
  );

  return {
    initiatePaymentProcess,
    loading,
    error,
    paymentUrl,
    paymentStatus,
  };
}

/**
 * Mock payment methods (in real implementation, these would come from Payluk API)
 */
export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    description: 'Pay with Visa, Mastercard, or other cards',
    fees: {
      fixed: 0,
      percentage: 2.9,
    },
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'bank_transfer',
    description: 'Direct bank transfer',
    fees: {
      fixed: 1,
      percentage: 0,
    },
  },
  {
    id: 'wallet',
    name: 'Payluk Wallet',
    type: 'wallet',
    description: 'Pay from your Payluk wallet balance',
    fees: {
      fixed: 0,
      percentage: 0,
    },
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    type: 'crypto',
    description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies',
    fees: {
      fixed: 0,
      percentage: 1,
    },
  },
];

// Made with Bob