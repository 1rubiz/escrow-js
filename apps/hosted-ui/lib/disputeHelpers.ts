/**
 * Dispute helper utilities
 */

export type DisputeReason =
  | 'Product not as described'
  | 'Product not delivered'
  | 'Quality issues'
  | 'Other';

export const DISPUTE_REASONS: DisputeReason[] = [
  'Product not as described',
  'Product not delivered',
  'Quality issues',
  'Other',
];

export interface DisputeMessage {
  id: string;
  sender: 'buyer' | 'seller' | 'admin';
  message: string;
  timestamp: string;
  senderName?: string;
}

export interface Dispute {
  disputeId: string;
  transactionId: string;
  status: 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  reason: DisputeReason;
  description: string;
  createdAt: string;
  resolvedAt?: string;
  outcome?: 'REFUNDED' | 'COMPLETED' | 'CANCELLED';
  messages?: DisputeMessage[];
}

/**
 * Format dispute status for display
 */
export function formatDisputeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    UNDER_REVIEW: 'Under Review',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };
  return statusMap[status] || status;
}

/**
 * Get dispute status color
 */
export function getDisputeStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    UNDER_REVIEW: 'text-yellow-600 bg-yellow-50',
    RESOLVED: 'text-green-600 bg-green-50',
    CLOSED: 'text-gray-600 bg-gray-50',
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
}

/**
 * Format dispute outcome for display
 */
export function formatDisputeOutcome(outcome?: string): string {
  if (!outcome) return 'Pending';
  
  const outcomeMap: Record<string, string> = {
    REFUNDED: 'Refunded to Buyer',
    COMPLETED: 'Released to Seller',
    CANCELLED: 'Dispute Cancelled',
  };
  return outcomeMap[outcome] || outcome;
}

/**
 * Get dispute outcome color
 */
export function getDisputeOutcomeColor(outcome?: string): string {
  if (!outcome) return 'text-gray-600';
  
  const colorMap: Record<string, string> = {
    REFUNDED: 'text-blue-600',
    COMPLETED: 'text-green-600',
    CANCELLED: 'text-gray-600',
  };
  return colorMap[outcome] || 'text-gray-600';
}

/**
 * Check if dispute can be opened for a transaction status
 */
export function canOpenDispute(status: string): boolean {
  const terminalStatuses = ['COMPLETED', 'REFUNDED', 'CANCELLED'];
  return !terminalStatuses.includes(status);
}

/**
 * Format sender name for display
 */
export function formatSenderName(sender: 'buyer' | 'seller' | 'admin'): string {
  const nameMap: Record<string, string> = {
    buyer: 'Buyer',
    seller: 'Seller',
    admin: 'Payluk Support',
  };
  return nameMap[sender] || sender;
}

/**
 * Get sender color for message display
 */
export function getSenderColor(sender: 'buyer' | 'seller' | 'admin'): string {
  const colorMap: Record<string, string> = {
    buyer: 'bg-blue-100 text-blue-900',
    seller: 'bg-green-100 text-green-900',
    admin: 'bg-purple-100 text-purple-900',
  };
  return colorMap[sender] || 'bg-gray-100 text-gray-900';
}

// Made with Bob
