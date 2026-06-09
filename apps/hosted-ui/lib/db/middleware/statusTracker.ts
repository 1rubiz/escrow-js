/**
 * Status Tracking Middleware
 * 
 * Automatically tracks transaction status changes and syncs with database
 */

import {
  getTransactionByPaylukId,
  updateTransactionStatus,
  createTransaction,
  type EscrowStatus,
  type CreateTransactionData,
} from '../queries/transactions';
import { getOrCreateCustomer } from '../queries/customers';

/**
 * Sync transaction from Payluk to database
 */
export async function syncTransaction(paylukTransaction: any): Promise<void> {
  try {
    // Check if transaction exists
    const existing = await getTransactionByPaylukId(paylukTransaction.id);

    if (existing) {
      // Update if status changed
      if (existing.current_status !== paylukTransaction.status) {
        await updateTransactionStatus(
          existing.id,
          paylukTransaction.status as EscrowStatus,
          'system',
          'Synced from Payluk API',
          paylukTransaction
        );
      }
    } else {
      // Create new transaction record
      // First ensure seller exists
      const seller = await getOrCreateCustomer({
        paylukCustomerId: paylukTransaction.seller_id || paylukTransaction.sellerId,
        email: paylukTransaction.seller_email || 'unknown@example.com',
        name: paylukTransaction.seller_name || 'Unknown Seller',
      });

      // Create buyer if available
      let buyerId: string | undefined;
      if (paylukTransaction.buyer_id || paylukTransaction.buyerId) {
        const buyer = await getOrCreateCustomer({
          paylukCustomerId: paylukTransaction.buyer_id || paylukTransaction.buyerId,
          email: paylukTransaction.buyer_email || 'unknown@example.com',
          name: paylukTransaction.buyer_name || 'Unknown Buyer',
        });
        buyerId = buyer.id;
      }

      const transactionData: CreateTransactionData = {
        paylukEscrowId: paylukTransaction.id,
        paymentToken: paylukTransaction.paymentToken || paylukTransaction.payment_token,
        sellerId: seller.id,
        buyerId,
        amount: paylukTransaction.amount,
        currency: paylukTransaction.currency || 'NGN',
        purpose: paylukTransaction.purpose,
        description: paylukTransaction.description,
        whoPays: paylukTransaction.whoPays || paylukTransaction.who_pays || 'buyer',
        imageUrl: paylukTransaction.imageUrl || paylukTransaction.image_url,
        maxDelivery: paylukTransaction.maxDelivery || paylukTransaction.max_delivery,
        deliveryTimeline: paylukTransaction.deliveryTimeline || paylukTransaction.delivery_timeline,
        totalQuantity: paylukTransaction.totalQuantity || paylukTransaction.total_quantity,
        metadata: paylukTransaction,
      };

      const newTransaction = await createTransaction(transactionData);

      // Set initial status if different from PENDING
      if (paylukTransaction.status && paylukTransaction.status !== 'PENDING') {
        await updateTransactionStatus(
          newTransaction.id,
          paylukTransaction.status as EscrowStatus,
          'system',
          'Initial status from Payluk',
          paylukTransaction
        );
      }
    }
  } catch (error) {
    console.error('Failed to sync transaction:', error);
    // Don't throw - syncing should not break the application
  }
}

/**
 * Track status change
 */
export async function trackStatusChange(
  paylukEscrowId: string,
  newStatus: EscrowStatus,
  changedBy?: string,
  reason?: string,
  paylukResponse?: any
): Promise<void> {
  try {
    const transaction = await getTransactionByPaylukId(paylukEscrowId);

    if (!transaction) {
      console.warn(`Transaction not found for status update: ${paylukEscrowId}`);
      return;
    }

    // Only update if status actually changed
    if (transaction.current_status !== newStatus) {
      await updateTransactionStatus(
        transaction.id,
        newStatus,
        changedBy || 'system',
        reason,
        paylukResponse
      );
    }
  } catch (error) {
    console.error('Failed to track status change:', error);
  }
}

/**
 * Wrapper to automatically sync transaction after Payluk API call
 */
export async function withTransactionSync<T>(
  apiCall: () => Promise<T>,
  extractTransaction?: (result: T) => any
): Promise<T> {
  const result = await apiCall();

  // Sync transaction if extractor provided
  if (extractTransaction) {
    const transaction = extractTransaction(result);
    if (transaction) {
      // Sync asynchronously without blocking
      syncTransaction(transaction).catch((error) => {
        console.error('Transaction sync failed:', error);
      });
    }
  }

  return result;
}

/**
 * Batch sync multiple transactions
 */
export async function batchSyncTransactions(paylukTransactions: any[]): Promise<void> {
  const syncPromises = paylukTransactions.map((txn) => syncTransaction(txn));
  
  // Wait for all syncs to complete
  const results = await Promise.allSettled(syncPromises);
  
  // Log any failures
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`Failed to sync ${failures.length} transactions`);
  }
}

/**
 * Get status from Payluk response and track it
 */
export async function extractAndTrackStatus(
  paylukEscrowId: string,
  paylukResponse: any,
  changedBy?: string
): Promise<void> {
  const status = paylukResponse?.data?.status || paylukResponse?.status;
  
  if (status) {
    await trackStatusChange(
      paylukEscrowId,
      status as EscrowStatus,
      changedBy,
      'Status extracted from Payluk response',
      paylukResponse
    );
  }
}

// Made with Bob