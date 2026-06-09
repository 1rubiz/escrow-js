/**
 * postMessage Helpers
 * 
 * Utilities for communicating with the parent window (SDK) from the hosted UI iframe.
 */

export type PostMessageEvent =
  | {
      type: 'TRANSACTION_CREATED';
      transactionId: string;
      amount: number;
    }
  | {
      type: 'STATUS_UPDATED';
      status: string;
      transactionId: string;
    }
  | {
      type: 'PAYMENT_COMPLETED';
      transactionId: string;
      amount: number;
    }
  | {
      type: 'ACTION_COMPLETED';
      action: string;
      transactionId: string;
    }
  | {
      type: 'DISPUTE_OPENED';
      transactionId: string;
      disputeId: string;
    }
  | {
      type: 'DISPUTE_RESOLVED';
      transactionId: string;
      outcome: 'REFUNDED' | 'COMPLETED' | 'CANCELLED';
      amount: number;
    }
  | {
      type: 'SESSION_COMPLETE';
      result: {
        status: string;
        transactionId?: string;
        amount?: number;
        outcome: 'success' | 'cancelled' | 'error';
      };
    }
  | {
      type: 'ERROR';
      error: string;
    }
  | {
      type: 'READY';
    }
  | {
      type: 'CLOSE';
    };

/**
 * Send a message to the parent window
 */
export function sendToParent(event: PostMessageEvent): void {
  if (typeof window !== 'undefined' && window.parent) {
    window.parent.postMessage(event, '*');
  }
}

/**
 * Send transaction created event
 */
export function notifyTransactionCreated(transactionId: string, amount: number): void {
  sendToParent({
    type: 'TRANSACTION_CREATED',
    transactionId,
    amount,
  });
}

/**
 * Send error event
 */
export function notifyError(error: string): void {
  sendToParent({
    type: 'ERROR',
    error,
  });
}

/**
 * Send ready event (iframe loaded)
 */
export function notifyReady(): void {
  sendToParent({
    type: 'READY',
  });
}

/**
 * Send close event (user wants to close iframe)
 */
export function notifyClose(): void {
  sendToParent({
    type: 'CLOSE',
  });
}

/**
 * Generic function to send any postMessage event
 */
export function sendPostMessage(event: PostMessageEvent): void {
  sendToParent(event);
}

// Made with Bob