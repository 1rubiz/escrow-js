/**
 * ActionButtons Component
 * 
 * Displays action buttons for buyer and seller based on transaction status
 */

'use client';

import { useState } from 'react';
import { EscrowStatus, getAvailableActions } from '@/lib/statusHelpers';
import { markAsDelivered, releasePayment } from '@/lib/api';
import { sendPostMessage } from '@/lib/postMessage';

interface ActionButtonsProps {
  transactionId: string;
  status: EscrowStatus;
  userRole: 'buyer' | 'seller' | 'unknown';
  apiKey: string;
  onActionComplete?: () => void;
  onOpenDispute?: () => void;
}

export default function ActionButtons({
  transactionId,
  status,
  userRole,
  apiKey,
  onActionComplete,
  onOpenDispute,
}: ActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeliveryNotes, setShowDeliveryNotes] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showConfirmRelease, setShowConfirmRelease] = useState(false);

  const availableActions = getAvailableActions(status, userRole);

  /**
   * Handle mark as delivered action
   */
  const handleMarkDelivered = async () => {
    setLoading('MARK_DELIVERED');
    setError(null);

    try {
      const result = await markAsDelivered(transactionId, deliveryNotes, apiKey);

      if (result.error) {
        setError(result.error);
        setLoading(null);
        return;
      }

      // Send postMessage
      sendPostMessage({
        type: 'ACTION_COMPLETED',
        action: 'MARK_DELIVERED',
        transactionId,
      });

      setShowDeliveryNotes(false);
      setDeliveryNotes('');
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as delivered');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Handle release payment action
   */
  const handleReleasePayment = async () => {
    setLoading('RELEASE_PAYMENT');
    setError(null);

    try {
      const result = await releasePayment(transactionId, apiKey);

      if (result.error) {
        setError(result.error);
        setLoading(null);
        return;
      }

      // Send postMessage
      sendPostMessage({
        type: 'ACTION_COMPLETED',
        action: 'RELEASE_PAYMENT',
        transactionId,
      });

      setShowConfirmRelease(false);
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release payment');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Handle open dispute action
   */
  const handleOpenDispute = () => {
    onOpenDispute?.();
  };

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {availableActions.map((action) => {
          const isLoading = loading === action.action;

          // Mark as Delivered
          if (action.action === 'MARK_DELIVERED') {
            return (
              <div key={action.action}>
                {!showDeliveryNotes ? (
                  <button
                    onClick={() => setShowDeliveryNotes(true)}
                    disabled={isLoading}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                      action.variant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : action.variant === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {action.label}
                  </button>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Notes (Optional)
                      </label>
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Add any notes about the delivery..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowDeliveryNotes(false);
                          setDeliveryNotes('');
                        }}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleMarkDelivered}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Confirming...' : 'Confirm Delivery'}
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-600">{action.description}</p>
              </div>
            );
          }

          // Release Payment
          if (action.action === 'RELEASE_PAYMENT') {
            return (
              <div key={action.action}>
                {!showConfirmRelease ? (
                  <button
                    onClick={() => setShowConfirmRelease(true)}
                    disabled={isLoading}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                      action.variant === 'primary'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {action.label}
                  </button>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                    <p className="text-sm text-green-800 font-medium">
                      ⚠️ Are you sure you want to release the payment?
                    </p>
                    <p className="text-sm text-gray-600">
                      This action cannot be undone. The funds will be transferred to the seller.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowConfirmRelease(false)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReleasePayment}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Releasing...' : 'Confirm Release'}
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-600">{action.description}</p>
              </div>
            );
          }

          // Open Dispute
          if (action.action === 'OPEN_DISPUTE') {
            return (
              <div key={action.action}>
                <button
                  onClick={handleOpenDispute}
                  disabled={isLoading}
                  className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                    action.variant === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {action.label}
                </button>
                <p className="mt-1 text-sm text-gray-600">{action.description}</p>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

// Made with Bob