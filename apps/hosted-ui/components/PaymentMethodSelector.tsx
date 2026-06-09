/**
 * PaymentMethodSelector Component
 * 
 * Displays available payment methods and allows user to select one
 */

'use client';

import { useState } from 'react';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  description?: string;
  fees?: {
    fixed: number;
    percentage: number;
  };
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethod: string | null;
  onSelect: (methodId: string) => void;
  amount?: number;
  currency?: string;
}

export default function PaymentMethodSelector({
  methods,
  selectedMethod,
  onSelect,
  amount = 0,
  currency = 'NGN',
}: PaymentMethodSelectorProps) {
  /**
   * Calculate total fee for a payment method
   */
  const calculateFee = (method: PaymentMethod): number => {
    if (!method.fees) return 0;
    const fixedFee = method.fees.fixed || 0;
    const percentageFee = (amount * (method.fees.percentage || 0)) / 100;
    return fixedFee + percentageFee;
  };

  /**
   * Format currency amount
   */
  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(value);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Select Payment Method</h3>

      <div className="space-y-2">
        {methods.map((method) => {
          const fee = calculateFee(method);
          const total = amount + fee;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-white'
                        }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900">{method.name}</h4>
                  </div>

                  {method.description && (
                    <p className="text-sm text-gray-600 mt-1 ml-7">
                      {method.description}
                    </p>
                  )}

                  {method.fees && (
                    <div className="text-sm text-gray-500 mt-2 ml-7">
                      {method.fees.fixed > 0 && (
                        <span>Fee: {formatAmount(method.fees.fixed)}</span>
                      )}
                      {method.fees.percentage > 0 && (
                        <span>
                          {method.fees.fixed > 0 ? ' + ' : 'Fee: '}
                          {method.fees.percentage}%
                        </span>
                      )}
                      {fee > 0 && (
                        <span className="ml-2 font-medium">
                          ({formatAmount(fee)})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {amount > 0 && (
                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatAmount(total)}
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {methods.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No payment methods available</p>
        </div>
      )}
    </div>
  );
}

// Made with Bob