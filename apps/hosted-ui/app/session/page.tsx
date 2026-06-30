/**
 * Session Page
 *
 * Main entry point for the hosted UI iframe.
 * Validates session token and renders wallet or transaction creation form.
 *
 * Pre-seeded mode: when the session token carries participantId + isSeller + amount,
 * the page auto-navigates to create-transaction with participant info pre-filled.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { notifyReady } from "@/lib/postMessage";
import Navigation from "@/components/Navigation";
import Wallet from "@/components/Wallet";
import CreateTransactionForm from "@/components/CreateTransactionForm";
import StatusMonitor from "@/components/StatusMonitor";
import DisputeForm from "@/components/DisputeForm";
import DisputeThread from "@/components/DisputeThread";
import DisputeStatus from "@/components/DisputeStatus";
import SessionComplete from "@/components/SessionComplete";
import { useEscrowStatus } from "@/hooks/useEscrowStatus";
import { Dispute } from "@/lib/disputeHelpers";

export interface CustomerInfo {
  id: string;
  email: string;
  name: string;
}

type View =
  | "wallet"
  | "create-transaction"
  | "transaction-monitor"
  | "dispute-form"
  | "dispute-thread"
  | "session-complete";

async function fetchCustomerInfo(
  customerId: string,
): Promise<CustomerInfo | null> {
  try {
    const res = await fetch(`/api/payluk/customer/${customerId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function SessionPage() {
  const { session, loading, error, token } = useSession();
  const [currentView, setCurrentView] = useState<View>("wallet");
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);

  // Track whether we're loading pre-seeded participant data
  const [customerLoading, setCustomerLoading] = useState(false);

  const [completionData, setCompletionData] = useState<{
    status: string;
    transactionId?: string;
    amount?: number;
    outcome: "success" | "cancelled" | "error";
    message?: string;
  } | null>(null);

  const { data: transactionData } = useEscrowStatus({
    transactionId: selectedTransactionId || "",
    apiKey,
    enabled: !!selectedTransactionId && currentView === "transaction-monitor",
  });

  useEffect(() => {
    notifyReady();
    const key = process.env.NEXT_PUBLIC_API_KEY || "";
    console.log("API Key:", key);
    setApiKey(key);
  }, []);

  useEffect(() => {
    if (error) {
      console.log(error);
    } else if (session) {
      console.log(session);
    } else {
      console.log("Something else is wrong");
    }
  }, [error, session]);

  // When session loads, check for pre-seeded transaction mode
  useEffect(() => {
    if (!session) return;

    const isPreSeeded =
      session.participantId &&
      session.isSeller !== undefined &&
      session.amount !== undefined;

    if (!isPreSeeded) return;

    // Navigate immediately; CreateTransactionForm resolves participant info internally
    setCustomerLoading(true);
    setCurrentView("create-transaction");
    setCustomerLoading(false);
  }, [session]);

  // Check for terminal transaction states and show completion screen
  useEffect(() => {
    if (transactionData && selectedTransactionId) {
      const terminalStatuses = ["COMPLETED", "REFUNDED", "CANCELLED"];
      if (terminalStatuses.includes(transactionData.status)) {
        setCompletionData({
          status: transactionData.status,
          transactionId: selectedTransactionId,
          amount: transactionData.amount,
          outcome:
            transactionData.status === "CANCELLED" ? "cancelled" : "success",
        });
        setCurrentView("session-complete");
      }
    }
  }, [transactionData, selectedTransactionId]);

  // ── Loading states ───────────────────────────────────────────────────────

  if (loading || customerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            {customerLoading
              ? "Loading transaction details…"
              : "Loading session…"}
          </p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
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
                <h3 className="text-sm font-medium text-red-800">
                  Session Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || "Failed to load session"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleTransactionCreated = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setCurrentView("transaction-monitor");
  };

  const handleTransactionClick = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setCurrentView("transaction-monitor");
  };

  const handleOpenDispute = () => setCurrentView("dispute-form");

  const handleDisputeCreated = (dispute: Dispute) => {
    setCurrentDispute(dispute);
    setCurrentView("dispute-thread");
  };

  const handleDisputeCancel = () => setCurrentView("transaction-monitor");

  const getUserRole = (): "buyer" | "seller" | "unknown" => {
    if (!session) return "unknown";
    if (session.isSeller === true) return "seller";
    if (session.isSeller === false) return "buyer";
    return "unknown";
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const BackButton = ({
    onClick,
    label,
  }: {
    onClick: () => void;
    label: string;
  }) => (
    <div className="mb-4">
      <button
        onClick={onClick}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        {label}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === "wallet" && (
            <Wallet
              customerId={session.customerId}
              apiKey={apiKey}
              onCreateTransaction={() => setCurrentView("create-transaction")}
              onTransactionClick={handleTransactionClick}
            />
          )}

          {currentView === "create-transaction" && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                  Create New Transaction
                </h3>
                <CreateTransactionForm
                  customerId={session.customerId}
                  apiKey={apiKey}
                  participantId={session.participantId}
                  isSeller={session.isSeller}
                  amount={session.amount}
                  currency={session.currency}
                  name={session.name}
                  description={session.description}
                  conditions={session.conditions}
                  metadata={session.metadata}
                  onSuccess={handleTransactionCreated}
                  onCancel={() => setCurrentView("wallet")}
                />
              </div>
            </div>
          )}

          {currentView === "transaction-monitor" && selectedTransactionId && (
            <div>
              <BackButton
                onClick={() => setCurrentView("wallet")}
                label="Back to Wallet"
              />
              <StatusMonitor
                transactionId={selectedTransactionId}
                apiKey={apiKey}
                userRole={getUserRole()}
                onOpenDispute={handleOpenDispute}
                onBack={() => setCurrentView("wallet")}
              />
            </div>
          )}

          {currentView === "dispute-form" && selectedTransactionId && (
            <div>
              <BackButton
                onClick={() => setCurrentView("transaction-monitor")}
                label="Back to Transaction"
              />
              <DisputeForm
                transactionId={selectedTransactionId}
                onSuccess={handleDisputeCreated}
                onCancel={handleDisputeCancel}
              />
            </div>
          )}

          {currentView === "dispute-thread" &&
            currentDispute &&
            selectedTransactionId && (
              <div>
                <BackButton
                  onClick={() => setCurrentView("transaction-monitor")}
                  label="Back to Transaction"
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <DisputeThread
                      disputeId={currentDispute.disputeId}
                      transactionId={selectedTransactionId}
                      currentUserRole={getUserRole()}
                    />
                  </div>
                  <div>
                    <DisputeStatus dispute={currentDispute} />
                  </div>
                </div>
              </div>
            )}

          {currentView === "session-complete" && completionData && (
            <SessionComplete
              status={completionData.status}
              transactionId={completionData.transactionId}
              amount={completionData.amount}
              outcome={completionData.outcome}
              message={completionData.message}
              autoCloseDelay={3000}
              onClose={() => {
                setSelectedTransactionId(null);
                setCurrentDispute(null);
                setCompletionData(null);
                setCurrentView("wallet");
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}


