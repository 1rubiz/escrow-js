'use client';

import {
  Dispute,
  formatDisputeStatus,
  getDisputeStatusColor,
  formatDisputeOutcome,
  getDisputeOutcomeColor,
} from '@/lib/disputeHelpers';

interface DisputeStatusProps {
  dispute: Dispute;
}

export default function DisputeStatus({ dispute }: DisputeStatusProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Dispute Status
      </h3>

      {/* Status Badge */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getDisputeStatusColor(
              dispute.status
            )}`}
          >
            {formatDisputeStatus(dispute.status)}
          </span>
          {dispute.outcome && (
            <span className={`text-sm font-medium ${getDisputeOutcomeColor(dispute.outcome)}`}>
              • {formatDisputeOutcome(dispute.outcome)}
            </span>
          )}
        </div>
      </div>

      {/* Dispute Details */}
      <div className="space-y-4">
        {/* Dispute ID */}
        <div>
          <p className="text-sm font-medium text-gray-700">Dispute ID</p>
          <p className="text-sm text-gray-900 mt-1 font-mono">{dispute.disputeId}</p>
        </div>

        {/* Reason */}
        <div>
          <p className="text-sm font-medium text-gray-700">Reason</p>
          <p className="text-sm text-gray-900 mt-1">{dispute.reason}</p>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm font-medium text-gray-700">Description</p>
          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
            {dispute.description}
          </p>
        </div>

        {/* Created Date */}
        <div>
          <p className="text-sm font-medium text-gray-700">Opened</p>
          <p className="text-sm text-gray-900 mt-1">
            {formatDate(dispute.createdAt)}
          </p>
        </div>

        {/* Resolved Date */}
        {dispute.resolvedAt && (
          <div>
            <p className="text-sm font-medium text-gray-700">Resolved</p>
            <p className="text-sm text-gray-900 mt-1">
              {formatDate(dispute.resolvedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        {dispute.status === 'UNDER_REVIEW' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Under Review
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Our support team is reviewing your dispute. You can continue to
                  communicate with the other party through the dispute thread.
                </p>
              </div>
            </div>
          </div>
        )}

        {dispute.status === 'RESOLVED' && dispute.outcome === 'REFUNDED' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Dispute Resolved - Refunded
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  The dispute has been resolved in your favor. The funds have been
                  refunded to the buyer.
                </p>
              </div>
            </div>
          </div>
        )}

        {dispute.status === 'RESOLVED' && dispute.outcome === 'COMPLETED' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-900">
                  Dispute Resolved - Released
                </p>
                <p className="text-sm text-green-700 mt-1">
                  The dispute has been resolved. The funds have been released to the
                  seller.
                </p>
              </div>
            </div>
          </div>
        )}

        {dispute.status === 'CLOSED' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Dispute Closed
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  This dispute has been closed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
