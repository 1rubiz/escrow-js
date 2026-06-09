/**
 * StatusMonitor Component
 * 
 * Real-time status monitoring with timeline and action buttons
 */

'use client';

import { useEscrowStatus } from '@/hooks/useEscrowStatus';
import { EscrowStatus, getStatusInfo, formatAmount } from '@/lib/statusHelpers';
import StatusTimeline from './StatusTimeline';
import ActionButtons from './ActionButtons';
import PaymentForm from './PaymentForm';
import { useTransactionStore } from '@/lib/stores/transactionStore';

interface StatusMonitorProps {
  transactionId: string;
  apiKey: string;
  userRole: 'buyer' | 'seller' | 'unknown';
  onOpenDispute?: () => void;
  onBack?: () => void;
}

export default function StatusMonitor({
  apiKey,
  userRole,
  onOpenDispute,
  onBack
}: StatusMonitorProps) {
  const selectedTransaction = useTransactionStore((s) => s.selectedTransaction);
  // if (!selectedTransaction) return null;
  // const transactionId = selectedTransaction.id;
  // const {
  //   data,
  //   loading,
  //   error,
  //   refetch,
  //   isPolling,
  //   startPolling,
  //   stopPolling,
  // } = useEscrowStatus({
  //   transactionId,
  //   apiKey,
  //   enabled: true,
  // });

  /**
   * Handle action completion - refetch status
   */
  const handleActionComplete = () => {
    // refetch();
  };

  const handleBack = () => {
    useTransactionStore.getState().clearSelectedTransaction();
    onBack?.();
  }

  // Loading state
  // if ( !data) {
  //   return (
  //     <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
  //       <div className="flex items-center justify-center">
  //         <svg
  //           className="animate-spin h-8 w-8 text-blue-600"
  //           fill="none"
  //           viewBox="0 0 24 24"
  //         >
  //           <circle
  //             className="opacity-25"
  //             cx="12"
  //             cy="12"
  //             r="10"
  //             stroke="currentColor"
  //             strokeWidth="4"
  //           />
  //           <path
  //             className="opacity-75"
  //             fill="currentColor"
  //             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  //           />
  //         </svg>
  //         <span className="ml-3 text-gray-600">Loading transaction status...</span>
  //       </div>
  //     </div>
  //   );
  // }

  // Error state
  if (!selectedTransaction) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="h-6 w-6 text-red-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              Failed to Load Transaction
            </h3>
            <p className="text-sm text-red-700 mb-3">Select a transaction to view its status</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to transactions
            </button>
          </div>
        </div>
      </div>
    );
  }


  const statusInfo = getStatusInfo(selectedTransaction.status as EscrowStatus);
  const currency = selectedTransaction.currency || 'NGN';

  return (
    <div className="space-y-6">
      {/* Transaction Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Transaction #{selectedTransaction.id.slice(-8)}
            </h2>
            <p className="text-gray-600">
              {selectedTransaction.isSeller ? 'You are the seller' : 'You are the buyer'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatAmount(selectedTransaction.amount, currency)}
            </div>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-3xl">{statusInfo.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              {/* {isPolling && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              )} */}
            </div>
            <p className="text-sm text-gray-600">{statusInfo.description}</p>
          </div>
          {/* <button
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh status"
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button> */}
        </div>

        {/* Conditions */}
        {/* {data.conditions && data.conditions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Escrow Conditions:</h4>
            <ul className="space-y-1">
              {data.conditions.map((condition, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )} */}
      </div>

      {/* Payment Form (if status is CREATED) */}
      {selectedTransaction.status === 'ONGOING' && selectedTransaction.payedAt === null && selectedTransaction.isSeller === false && (
        <PaymentForm
          transactionId={selectedTransaction.id}
          amount={selectedTransaction.amount}
          currency={currency}
          apiKey={apiKey}
          onSuccess={handleActionComplete}
        />
      )}

      {/* Status Timeline */}
      <StatusTimeline currentStatus={selectedTransaction.payedAt !== null ? "FUNDED" : selectedTransaction.status as EscrowStatus} />

      {/* Action Buttons */}
      {selectedTransaction.status !== 'CREATED' && (
        <ActionButtons
          transactionId={selectedTransaction.id}
          status={selectedTransaction.status as EscrowStatus}
          userRole={userRole}
          apiKey={apiKey}
          onActionComplete={handleActionComplete}
          onOpenDispute={onOpenDispute}
        />
      )}

      {/* Polling Controls (for debugging) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              Polling: {isPolling ? 'Active' : 'Inactive'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={startPolling}
                disabled={isPolling}
                className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
              >
                Start
              </button>
              <button
                onClick={stopPolling}
                disabled={!isPolling}
                className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

// Made with Bob