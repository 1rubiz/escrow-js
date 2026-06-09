'use client';

import { useEffect, useState } from 'react';
import { sendPostMessage } from '@/lib/postMessage';

interface SessionCompleteProps {
  status: string;
  transactionId?: string;
  amount?: number;
  outcome: 'success' | 'cancelled' | 'error';
  message?: string;
  autoCloseDelay?: number; // in milliseconds, 0 to disable
  onClose?: () => void;
}

export default function SessionComplete({
  status,
  transactionId,
  amount,
  outcome,
  message,
  autoCloseDelay = 3000,
  onClose,
}: SessionCompleteProps) {
  const [countdown, setCountdown] = useState(
    autoCloseDelay > 0 ? Math.ceil(autoCloseDelay / 1000) : 0
  );

  useEffect(() => {
    // Send completion message to parent
    sendPostMessage({
      type: 'SESSION_COMPLETE',
      result: {
        status,
        transactionId,
        amount,
        outcome,
      },
    });

    // Setup auto-close countdown
    if (autoCloseDelay > 0) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, transactionId, amount, outcome, autoCloseDelay]);

  const handleClose = () => {
    sendPostMessage({ type: 'CLOSE' });
    onClose?.();
  };

  const getIcon = () => {
    switch (outcome) {
      case 'success':
        return (
          <svg
            className="w-16 h-16 text-green-600 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'cancelled':
        return (
          <svg
            className="w-16 h-16 text-gray-600 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-16 h-16 text-red-600 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getTitle = () => {
    switch (outcome) {
      case 'success':
        if (status === 'COMPLETED') return 'Transaction Completed';
        if (status === 'REFUNDED') return 'Transaction Refunded';
        return 'Success';
      case 'cancelled':
        return 'Transaction Cancelled';
      case 'error':
        return 'Error Occurred';
    }
  };

  const getDescription = () => {
    if (message) return message;

    switch (outcome) {
      case 'success':
        if (status === 'COMPLETED') {
          return 'The funds have been successfully released to the seller.';
        }
        if (status === 'REFUNDED') {
          return 'The funds have been successfully refunded to the buyer.';
        }
        return 'The transaction has been completed successfully.';
      case 'cancelled':
        return 'The transaction has been cancelled.';
      case 'error':
        return 'An error occurred during the transaction process.';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">{getIcon()}</div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {getTitle()}
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6">{getDescription()}</p>

        {/* Transaction Details */}
        {transactionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Transaction ID</span>
              <span className="text-sm font-mono text-gray-900">
                {transactionId}
              </span>
            </div>
            {amount !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatAmount(amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium text-gray-900">
                {status}
              </span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {countdown > 0 ? `Close (${countdown}s)` : 'Close'}
        </button>

        {/* Auto-close notice */}
        {autoCloseDelay > 0 && countdown > 0 && (
          <p className="text-xs text-gray-500 mt-3">
            This window will close automatically in {countdown} seconds
          </p>
        )}
      </div>
    </div>
  );
}

// Made with Bob
