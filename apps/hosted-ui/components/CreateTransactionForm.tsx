/**
 * CreateTransactionForm Component
 *
 * Props mirror the POST /api/payluk/generate-session-token body.
 *
 * Two modes:
 * 1. Pre-seeded  – participantId + isSeller are provided; participant fields are read-only.
 *                  Transaction detail fields (amount, name, description, conditions) are editable
 *                  unless also pre-seeded.
 * 2. Manual entry – no participantId; shows participant history dropdown + free-form ID input.
 */

'use client';

import { useState, useEffect } from 'react';
import { createTransaction } from '@/lib/api';
import { notifyTransactionCreated, notifyError } from '@/lib/postMessage';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SessionCustomer {
  participantPaylukId: string;
  participantName?: string;
  participantEmail?: string;
  lastRole: 'buyer' | 'seller';
  transactionCount: number;
}

/** Resolved display info fetched from /api/payluk/customer/:id */
interface ParticipantDisplay {
  id: string;
  name: string;
  email: string;
}

/**
 * Props mirror the POST /api/payluk/generate-session-token body.
 *
 * customerId   – the caller's own Payluk customer ID (required)
 * participantId – the other party's Payluk customer ID
 * isSeller     – true = caller is seller; triggers transaction field validation
 * amount       – required when isSeller + participantId present
 * currency     – 3-letter ISO code, required when isSeller + participantId present
 * name         – item name, required when isSeller + participantId present
 * description  – required when isSeller + participantId present
 * conditions   – array of condition strings
 * metadata     – arbitrary key/value metadata
 */
interface CreateTransactionFormProps {
  /** The caller's own Payluk customer ID. */
  customerId: string;
  /** Internal API key used for transaction creation. */
  apiKey: string;
  /** The other party's Payluk customer ID. */
  participantId?: string;
  /** true = caller is seller; false = caller is buyer */
  isSeller?: boolean;
  amount?: number;
  /** 3-letter ISO currency code. Defaults to 'NGN'. */
  currency?: string;
  name?: string;
  description?: string;
  conditions?: string[];
  metadata?: Record<string, unknown>;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CreateTransactionForm({
  customerId,
  apiKey,
  participantId,
  isSeller,
  amount: initialAmount,
  currency: initialCurrency,
  name: initialName,
  description: initialDescription,
  conditions: initialConditions,
  metadata,
  onSuccess,
  onCancel,
}: CreateTransactionFormProps) {
  // Transaction fields — editable (pre-seeded values are defaults)
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [currency, setCurrency] = useState(initialCurrency || 'NGN');
  const [name, setName] = useState(initialName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [conditions, setConditions] = useState<string[]>(
    initialConditions?.length ? initialConditions : ['']
  );

  // Participant display info (resolved from participantId when pre-seeded)
  const [participantDisplay, setParticipantDisplay] = useState<ParticipantDisplay | null>(null);
  const [participantLoading, setParticipantLoading] = useState(false);

  // Manual participant entry (non-pre-seeded mode)
  const [manualParticipantId, setManualParticipantId] = useState('');

  // Participant history dropdown
  const [participantHistory, setParticipantHistory] = useState<SessionCustomer[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pre-seeded: participantId AND isSeller are both provided, meaning the
   * caller has already identified who they are transacting with and their role.
   */
  const isPreSeeded = !!participantId && isSeller !== undefined;

  // Fetch resolved participant display info when pre-seeded
  useEffect(() => {
    if (!participantId) return;
    setParticipantLoading(true);
    fetch(`/api/payluk/customer/${participantId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ParticipantDisplay | null) => {
        if (data) setParticipantDisplay(data);
      })
      .catch(() => {/* silently ignore — card degrades to showing the ID */})
      .finally(() => setParticipantLoading(false));
  }, [participantId]);

  // Fetch participant history for manual mode
  useEffect(() => {
    if (isPreSeeded || !customerId) return;
    fetch(`/api/payluk/session-customers/${customerId}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        if (Array.isArray(json.data)) setParticipantHistory(json.data);
      })
      .catch(() => {/* silently ignore */});
  }, [isPreSeeded, customerId]);

  // ── Conditions helpers ───────────────────────────────────────────────────

  const addCondition = () => setConditions([...conditions, '']);
  const removeCondition = (i: number) => setConditions(conditions.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, val: string) => {
    const next = [...conditions];
    next[i] = val;
    setConditions(next);
  };

  // ── History dropdown select ───────────────────────────────────────────────

  const handleHistorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = participantHistory.find((p) => p.participantPaylukId === e.target.value);
    if (!selected) return;
    setManualParticipantId(selected.participantPaylukId);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const parsedAmount = parseFloat(amount);
    if (!amount || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (!name.trim()) {
      setError('Please enter a transaction name');
      setLoading(false);
      return;
    }

    const validConditions = conditions.filter((c) => c.trim() !== '');
    if (validConditions.length === 0) {
      setError('Please add at least one condition');
      setLoading(false);
      return;
    }

    // Resolve the effective participant ID
    const effectiveParticipantId = isPreSeeded ? participantId! : manualParticipantId.trim();

    if (!effectiveParticipantId) {
      setError('Please provide the other party\'s Payluk customer ID');
      setLoading(false);
      return;
    }

    // Resolve buyer / seller based on isSeller flag
    // When isSeller is undefined (manual mode), treat caller as buyer by default
    const callerIsSeller = isSeller === true;

    const buyer = callerIsSeller
      ? { id: effectiveParticipantId }
      : { id: customerId };
    const seller = callerIsSeller
      ? { id: customerId }
      : { id: effectiveParticipantId };

    try {
      const result = await createTransaction(
        {
          customerId,
          amount: parsedAmount,
          currency,
          buyer,
          seller,
          conditions: validConditions,
          description: description || name,
          ...(metadata && { metadata }),
        },
        apiKey
      );

      if (result.error || !result.data) {
        setError(result.error || 'Failed to create transaction');
        notifyError(result.error || 'Failed to create transaction');
        setLoading(false);
        return;
      }

      notifyTransactionCreated(result.data.transactionId, parsedAmount);

      // Record participant in history (non-blocking)
      fetch(`/api/payluk/session-customers/${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantPaylukId: effectiveParticipantId,
          participantName: participantDisplay?.name ?? null,
          participantEmail: participantDisplay?.email ?? null,
          role: callerIsSeller ? 'buyer' : 'seller',
        }),
      }).catch((err) => console.warn('[session-customers] failed to record participant:', err));

      onSuccess?.(result.data.transactionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* ── Participant section ────────────────────────────────────────────── */}

      {isPreSeeded ? (
        /* Pre-seeded: read-only participant card */
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">
            {isSeller ? 'Buyer (pre-filled)' : 'Seller (pre-filled)'}
          </p>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            {participantLoading ? (
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
            ) : (
              /* Avatar initial — use resolved name or first char of ID */
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {(participantDisplay?.name ?? participantId!).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {participantDisplay ? (
                <>
                  <p className="text-sm font-medium text-gray-900 truncate">{participantDisplay.name}</p>
                  <p className="text-sm text-gray-500 truncate">{participantDisplay.email}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900 truncate font-mono">{participantId}</p>
                  <p className="text-xs text-gray-400">Payluk customer ID</p>
                </>
              )}
            </div>
            {/* Lock icon */}
            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Role badge */}
          <p className="mt-1.5 text-xs text-gray-500">
            You are the <span className="font-semibold">{isSeller ? 'seller' : 'buyer'}</span> in this transaction.
          </p>
        </div>
      ) : (
        /* Manual entry: participant history dropdown + free-form Payluk ID input */
        <div className="space-y-4">
          {participantHistory.length > 0 && (
            <div>
              <label htmlFor="participantHistory" className="block text-sm font-medium text-gray-700">
                Recent participants
              </label>
              <select
                id="participantHistory"
                defaultValue=""
                onChange={handleHistorySelect}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="" disabled>Select a previous participant…</option>
                {participantHistory.map((p) => (
                  <option key={p.participantPaylukId} value={p.participantPaylukId}>
                    {p.participantName || p.participantEmail || p.participantPaylukId}
                    {' '}({p.lastRole}, {p.transactionCount}×)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="manualParticipantId" className="block text-sm font-medium text-gray-700">
              {isSeller === false ? 'Seller' : isSeller === true ? 'Buyer' : 'Other Party'} Payluk ID
            </label>
            <input
              type="text"
              id="manualParticipantId"
              value={manualParticipantId}
              onChange={(e) => setManualParticipantId(e.target.value)}
              required
              placeholder="cus_xxxxxxxxxxxxxxxx"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the Payluk customer ID of the{' '}
              {isSeller === true ? 'buyer' : isSeller === false ? 'seller' : 'other party'}.
            </p>
          </div>
        </div>
      )}

      {/* ── Transaction details ────────────────────────────────────────────── */}

      {/* Amount + Currency */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className="block w-full flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option>NGN</option>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
          </select>
        </div>
      </div>

      {/* Item Name */}
      <div>
        <label htmlFor="txName" className="block text-sm font-medium text-gray-700">Item Name</label>
        <input
          type="text"
          id="txName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. MacBook Pro 2023"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Additional details about the transaction"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Conditions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
        <div className="space-y-2">
          {conditions.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={c}
                onChange={(e) => updateCondition(i, e.target.value)}
                placeholder={`Condition ${i + 1}`}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {conditions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCondition(i)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCondition}
          className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          + Add Condition
        </button>
      </div>

      {/* Metadata preview (read-only, shown only when present) */}
      {metadata && Object.keys(metadata).length > 0 && (
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-1">Metadata</p>
          <pre className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 overflow-x-auto">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────────── */}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating…' : 'Create Transaction'}
        </button>
      </div>

    </form>
  );
}

// Made with Bob