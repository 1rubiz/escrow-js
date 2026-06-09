'use client';

import { useState } from 'react';
import { useDispute } from '@/hooks/useDispute';
import { DISPUTE_REASONS, DisputeReason } from '@/lib/disputeHelpers';

interface DisputeFormProps {
  transactionId: string;
  onSuccess?: (dispute: any) => void;
  onCancel?: () => void;
}

export default function DisputeForm({
  transactionId,
  onSuccess,
  onCancel,
}: DisputeFormProps) {
  const [reason, setReason] = useState<DisputeReason>('Product not as described');
  const [description, setDescription] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { createDispute, isLoading, error } = useDispute({
    transactionId,
    onSuccess: (dispute) => {
      onSuccess?.(dispute);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      await createDispute({
        reason,
        description: description.trim(),
      });
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to create dispute:', err);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    onCancel?.();
  };

  if (showConfirmation) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirm Dispute
        </h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to open a dispute for this transaction? This action
          will notify the other party and Payluk support will review your case.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Reason:</p>
          <p className="text-gray-900 mb-3">{reason}</p>
          <p className="text-sm font-medium text-gray-700 mb-2">Description:</p>
          <p className="text-gray-900">{description}</p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Opening Dispute...' : 'Confirm Dispute'}
          </button>
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Open a Dispute
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        If you have an issue with this transaction, you can open a dispute. Our
        support team will review your case and help resolve the issue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reason Selection */}
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Reason for Dispute <span className="text-red-500">*</span>
          </label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as DisputeReason)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {DISPUTE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Please provide details about the issue..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
            minLength={10}
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum 10 characters. Be as detailed as possible.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading || !description.trim() || description.length < 10}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Open Dispute
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Made with Bob
