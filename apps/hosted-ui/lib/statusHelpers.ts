/**
 * Status Helpers
 * 
 * Utilities for formatting and handling escrow transaction statuses
 */

export type EscrowStatus =
  | 'CREATED'
  | 'ONGOING'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'RESOLVED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface StatusInfo {
  label: string;
  description: string;
  color: string;
  icon: string;
  isTerminal: boolean;
}

/**
 * Get display information for a status
 */
export function getStatusInfo(status: EscrowStatus): StatusInfo {
  const statusMap: Record<EscrowStatus, StatusInfo> = {
    CREATED: {
      label: 'Created',
      description: 'Transaction created, awaiting payment',
      color: 'text-gray-600 bg-gray-100',
      icon: '📝',
      isTerminal: false,
    },
    ONGOING: {
      label: 'Ongoing',
      description: 'Transaction ongoing',
      color: 'text-gray-600 bg-gray-100',
      icon: '📝',
      isTerminal: false,
    },
    FUNDED: {
      label: 'Funded',
      description: 'Payment received, escrow active',
      color: 'text-blue-600 bg-blue-100',
      icon: '💰',
      isTerminal: false,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      description: 'Seller is working on delivery',
      color: 'text-yellow-600 bg-yellow-100',
      icon: '⚙️',
      isTerminal: false,
    },
    DELIVERED: {
      label: 'Delivered',
      description: 'Seller marked as delivered, awaiting buyer confirmation',
      color: 'text-purple-600 bg-purple-100',
      icon: '📦',
      isTerminal: false,
    },
    COMPLETED: {
      label: 'Completed',
      description: 'Payment released to seller',
      color: 'text-green-600 bg-green-100',
      icon: '✅',
      isTerminal: true,
    },
    DISPUTED: {
      label: 'Disputed',
      description: 'Dispute opened, under review',
      color: 'text-red-600 bg-red-100',
      icon: '⚠️',
      isTerminal: false,
    },
    RESOLVED: {
      label: 'Resolved',
      description: 'Dispute resolved',
      color: 'text-green-600 bg-green-100',
      icon: '✅',
      isTerminal: true,
    },
    REFUNDED: {
      label: 'Refunded',
      description: 'Payment refunded to buyer',
      color: 'text-orange-600 bg-orange-100',
      icon: '↩️',
      isTerminal: true,
    },
    CANCELLED: {
      label: 'Cancelled',
      description: 'Transaction cancelled',
      color: 'text-gray-600 bg-gray-100',
      icon: '❌',
      isTerminal: true,
    },
  };

  return statusMap[status] || {
    label: status,
    description: 'Unknown status',
    color: 'text-gray-600 bg-gray-100',
    icon: '❓',
    isTerminal: false,
  };
}

/**
 * Get the timeline stages for an escrow transaction
 */
export function getStatusTimeline(currentStatus: EscrowStatus): Array<{
  status: EscrowStatus;
  label: string;
  completed: boolean;
  current: boolean;
}> {
  const mainFlow: EscrowStatus[] = ['ONGOING', 'FUNDED', 'IN_PROGRESS', 'COMPLETED'];
  const currentIndex = mainFlow.indexOf(currentStatus);

  return mainFlow.map((status, index) => ({
    status,
    label: getStatusInfo(status).label,
    completed: index < currentIndex,
    current: status === currentStatus,
  }));
}

/**
 * Check if a status is terminal (no further actions possible)
 */
export function isTerminalStatus(status: EscrowStatus): boolean {
  return getStatusInfo(status).isTerminal;
}

/**
 * Get available actions for a user based on status and role
 */
export function getAvailableActions(
  status: EscrowStatus,
  userRole: 'buyer' | 'seller' | 'unknown'
): Array<{
  action: string;
  label: string;
  description: string;
  variant: 'primary' | 'secondary' | 'danger';
}> {
  const actions: Array<{
    action: string;
    label: string;
    description: string;
    variant: 'primary' | 'secondary' | 'danger';
  }> = [];

  if (userRole === 'seller') {
    if (status === 'FUNDED' || status === 'IN_PROGRESS') {
      actions.push({
        action: 'MARK_DELIVERED',
        label: 'Mark as Delivered',
        description: 'Confirm that you have delivered the goods/services',
        variant: 'primary',
      });
    }
  }

  if (userRole === 'buyer') {
    if (status === 'DELIVERED') {
      actions.push({
        action: 'RELEASE_PAYMENT',
        label: 'Release Payment',
        description: 'Confirm receipt and release payment to seller',
        variant: 'primary',
      });
    }

    if (status === 'FUNDED' || status === 'IN_PROGRESS' || status === 'DELIVERED') {
      actions.push({
        action: 'OPEN_DISPUTE',
        label: 'Open Dispute',
        description: 'Report an issue with this transaction',
        variant: 'danger',
      });
    }
  }

  return actions;
}

/**
 * Format amount with currency
 */
export function formatAmount(
  amount: number,
  currency: string = 'NGN'
): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date/time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

// Made with Bob