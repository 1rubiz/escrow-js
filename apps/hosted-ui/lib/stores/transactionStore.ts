/**
 * Transaction Store
 *
 * Zustand store to hold the currently selected transaction.
 * Use `useTransactionStore` in any component or page to read
 * or update the selection without prop-drilling.
 */

import { create } from 'zustand';
import { type PaylukEscrow } from '@/lib/paylukClient';

interface TransactionState {
  /** The full transaction object that was last selected by the user. */
  selectedTransaction: PaylukEscrow | null;

  /** Select a transaction — typically called on list-item click. */
  setSelectedTransaction: (transaction: PaylukEscrow) => void;

  /** Clear the selection (e.g. when navigating away or closing a detail panel). */
  clearSelectedTransaction: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  selectedTransaction: null,

  setSelectedTransaction: (transaction) =>
    set({ selectedTransaction: transaction }),

  clearSelectedTransaction: () =>
    set({ selectedTransaction: null }),
}));
