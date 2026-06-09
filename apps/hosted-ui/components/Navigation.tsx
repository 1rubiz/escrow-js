/**
 * Navigation Component
 * 
 * Provides navigation between different views in the hosted UI.
 */

'use client';

type View = 'wallet' | 'create-transaction' | 'transaction-monitor' | 'dispute-form' | 'dispute-thread' | 'session-complete';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <button
              onClick={() => onViewChange('wallet')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'wallet'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Wallet
            </button>
            <button
              onClick={() => onViewChange('create-transaction')}
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                currentView === 'create-transaction'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Create Transaction
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Made with Bob