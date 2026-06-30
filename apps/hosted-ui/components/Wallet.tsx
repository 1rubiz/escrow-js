/**
 * Wallet Component
 *
 * Displays wallet balance and transaction list.
 */

"use client";

import { useState, useEffect } from "react";
import {
  getWallet,
  getTransactions,
  type TransactionsResponse,
} from "@/lib/api";
import TransactionList from "./TransactionList";
import { type PaylukEscrow } from "@/lib/paylukClient";

interface WalletProps {
  customerId: string;
  apiKey: string;
  onCreateTransaction?: () => void;
  onTransactionClick?: (transactionId: string) => void;
  onBack?: () => void;
}

interface WalletData {
  escrowBalance: number;
  mainBalance: number;
  currency: string;
  transactions: any[];
}

export default function Wallet({
  customerId,
  apiKey,
  onCreateTransaction,
  onTransactionClick,
  onBack,
}: WalletProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<
    TransactionsResponse["data"]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [transactionError, setTransactionsError] = useState<string | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [transactionType, setTransactionType] = useState<"sales" | "buy">(
    "sales",
  );
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const fetchWallet = async () => {
    try {
      const result = await getWallet(customerId, apiKey);

      if (result.error || !result.data) {
        setError(result.error || "Failed to load wallet");
        return;
      }

      console.log(result.data);

      setWalletData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTransactions = async (type: "sales" | "buy" = transactionType) => {
    setTransactionsLoading(true);
    try {
      console.log(`Fetching ${type} transactions...`);
      const result = await getTransactions(customerId, type, apiKey);
      console.log(result);

      if (result.error || !result.data) {
        setTransactionsError(result.error || "Failed to load transactions");
        return;
      }

      setTransactions(result.data.data);
      setTransactionsError(null);
    } catch (err) {
      setTransactionsError(
        err instanceof Error ? err.message : "An error occurred",
      );
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions("sales");
  }, [customerId, apiKey]);

  // Re-fetch whenever the toggle changes
  useEffect(() => {
    fetchTransactions(transactionType);
  }, [transactionType]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWallet();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={handleRefresh}
              className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
            >
              <span className="sr-only">Retry</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">
              Available Balance
            </p>
            <p className="mt-2 text-3xl font-bold">
              {walletData?.mainBalance.toFixed(2)} {walletData?.currency}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-100">Pending Balance</p>
            <p className="mt-2 text-3xl font-bold">
              {walletData?.escrowBalance.toFixed(2)} {walletData?.currency}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full bg-blue-400 hover:bg-blue-300 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg
              className={`h-6 w-6 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCreateTransaction}
          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Transaction
        </button>
      </div>

      {/* Transactions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Transactions</h2>

          {/* Sales / Purchases toggle */}
          <div className="flex items-center rounded-lg overflow-hidden border border-gray-200 text-sm font-medium">
            <button
              id="toggle-sales"
              onClick={() => setTransactionType("sales")}
              className={`px-4 py-1.5 transition-colors ${
                transactionType === "sales"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Sales
            </button>
            <button
              id="toggle-purchases"
              onClick={() => setTransactionType("buy")}
              className={`px-4 py-1.5 transition-colors ${
                transactionType === "buy"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Purchases
            </button>
          </div>
        </div>

        {/* Transaction list or loading skeleton */}
        {transactionsLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <TransactionList
            transactions={transactions || []}
            onTransactionClick={onTransactionClick}
          />
        )}
      </div>
    </div>
  );
}

// Made with Bob
