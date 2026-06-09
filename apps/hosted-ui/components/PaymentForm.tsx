/**
 * PaymentForm Component
 * 
 * Complete payment form with method selection and submission
 */

'use client';

import { useState } from 'react';
import PaymentMethodSelector from './PaymentMethodSelector';
import { usePayment, MOCK_PAYMENT_METHODS } from '@/hooks/usePayment';
import { formatAmount } from '@/lib/statusHelpers';

interface PaymentFormProps {
  transactionId: string;
  amount: number;
  currency?: string;
  apiKey: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({
  transactionId,
  amount,
  currency = 'USD',
  apiKey,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any>>({});

  const {
    initiatePaymentProcess,
    loading,
    error,
    paymentUrl,
    paymentStatus,
  } = usePayment({
    transactionId,
    apiKey,
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (err) => {
      console.error('Payment error:', err);
    },
  });

  /**
   * Handle payment submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMethod) {
      return;
    }

    await initiatePaymentProcess(selectedMethod, paymentDetails);
  };

  /**
   * Handle payment detail changes (for methods that need additional info)
   */
  const handleDetailChange = (key: string, value: string) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // If payment URL is provided, redirect or show link
  if (paymentUrl) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Redirecting to Payment Gateway
          </h3>
          <p className="text-gray-600 mb-4">
            You will be redirected to complete your payment securely.
          </p>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Payment
          </a>
        </div>
      </div>
    );
  }

  // If payment is successful
  if (paymentStatus === 'FUNDED' || paymentStatus === 'COMPLETED') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 mb-4">
            Your payment of {formatAmount(amount, currency)} has been processed successfully.
          </p>
          <button
            onClick={onSuccess}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Amount Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Transaction Amount</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatAmount(amount, currency)}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <PaymentMethodSelector
          methods={MOCK_PAYMENT_METHODS}
          selectedMethod={selectedMethod}
          onSelect={setSelectedMethod}
          amount={amount}
          currency={currency}
        />

        {/* Additional Payment Details (if needed) */}
        {selectedMethod === 'card' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900">Card Details</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => handleDetailChange('cardNumber', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => handleDetailChange('expiryDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => handleDetailChange('cvv', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'bank_transfer' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              You will receive bank transfer instructions after submitting this form.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!selectedMethod || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ${formatAmount(amount, currency)}`
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 Your payment is secured with industry-standard encryption</p>
        </div>
      </form>
    </div>
  );
}

// Made with Bob