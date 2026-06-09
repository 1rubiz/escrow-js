'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CodeBlock } from '@/components/CodeBlock';
import { Lock } from 'lucide-react';
import { ChevronRight, Code, Zap, Shield, MessageSquare, Globe, Play, Check } from 'lucide-react';

interface DemoResult {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function Home() {
  const [sdkReady, setSdkReady] = useState(false);
  const [demoStatus, setDemoStatus] = useState<DemoResult | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  // Check if the SDK is loaded
  useEffect(() => {
    const checkSDK = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).RubyEscrow) {
        setSdkReady(true);
        clearInterval(checkSDK);
      }
    }, 500);

    return () => clearInterval(checkSDK);
  }, []);

  const handleDemo = async (
    label: string,
    displayMode: 'modal' | 'fullscreen' | 'inline' = 'modal',
    isTransaction = false
  ) => {
    setDemoLoading(true);
    setDemoStatus({ type: 'info', message: `Opening ${label}...` });

    try {
      if (typeof window !== 'undefined' && (window as any).RubyEscrow) {
        const RubyEscrow = (window as any).RubyEscrow;

        RubyEscrow.configure({
          apiKey: 'demo_key_sandbox',
          baseUrl: window.location.origin,
          environment: 'sandbox',
        });

        const baseOptions = {
          customerId: 'demo_customer_123',
          displayMode,
          onSuccess: (result: any) => {
            setDemoStatus({
              type: 'success',
              message: `${label} completed: ${result.transactionId || 'success'}`,
            });
          },
          onCancel: () => {
            setDemoStatus({ type: 'info', message: `${label} closed by user` });
          },
          onError: (error: any) => {
            setDemoStatus({
              type: 'error',
              message: `Error: ${error.message || 'Unknown error'}`,
            });
          },
        };

        const options = isTransaction
          ? {
              ...baseOptions,
              participantId: 'demo_participant_456',
              isSeller: true,
              amount: 10000,
              currency: 'USD',
              name: 'Demo Purchase',
              description: 'Escrow demo transaction',
              conditions: ['Item received', 'Quality verified'],
            }
          : baseOptions;

        await RubyEscrow.init(options);
      } else {
        setDemoStatus({
          type: 'error',
          message: 'SDK not loaded. Please check your setup.',
        });
      }
    } catch (error: any) {
      setDemoStatus({
        type: 'error',
        message: `Failed to open ${label}: ${error.message}`,
      });
    } finally {
      setDemoLoading(false);
    }
  };

  // Code snippets
  const installCode = `npm install ruby-escrow-js`;

  const configureCode = `import rubyEscrow from 'ruby-escrow-js';

rubyEscrow.configure({
  apiKey: 'your_api_key_here',
  baseUrl: 'https://your-hosted-ui.com',
  environment: 'sandbox' // or 'production'
});`;

  const walletCode = `// Open wallet for a customer
rubyEscrow.init({
  customerId: 'cust_1234567890',
  displayMode: 'modal',
  onSuccess: (result) => {
    console.log('Session completed:', result);
  },
  onCancel: () => {
    console.log('Session cancelled');
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});`;

  const transactionCode = `// Create a pre-seeded transaction
rubyEscrow.init({
  customerId: 'cust_1234567890',
  participantId: 'cust_0987654321',
  isSeller: true,
  amount: 5000,
  currency: 'NGN',
  name: 'Laptop Purchase',
  description: 'Dell XPS 15 laptop',
  conditions: ['Item received', 'Quality verified'],
  displayMode: 'modal',
  onSuccess: (result) => {
    console.log('Transaction created:', result);
  }
});`;

  const inlineCode = `// Embed the escrow widget inline
rubyEscrow.init({
  customerId: 'cust_1234567890',
  displayMode: 'inline',
  container: '#escrow-widget',
  onSuccess: (result) => {
    console.log('Transaction completed:', result);
  }
});`;

  return (
    <>
      <Navbar />
      <main className="bg-gray-950 text-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              ruby-escrow-js
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-4 leading-relaxed">
              Secure Escrow Transactions, Made Simple
            </p>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              A lightweight TypeScript SDK that wraps Payluk's escrow-as-a-service with two powerful methods: <span className="font-mono text-green-400">create</span> and <span className="font-mono text-green-400">init</span>. Integrate in minutes, go live instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#installation"
                className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
              >
                Get Started <ChevronRight size={18} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border border-gray-600 hover:border-green-500 rounded-lg font-semibold transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-16 text-center">Why Choose ruby-escrow-js?</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                <Lock className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Secure Transactions</h3>
                <p className="text-gray-400">
                  Built on Payluk's trusted escrow infrastructure. Your funds are always protected.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                <Code className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Simple API</h3>
                <p className="text-gray-400">
                  Minimal integration points: just configure once and call <span className="font-mono">init()</span> when needed.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                <Zap className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Multiple Display Modes</h3>
                <p className="text-gray-400">
                  Modal, fullscreen, or inline. Choose how the widget fits into your UX.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                <Shield className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Pre-Seeded Data</h3>
                <p className="text-gray-400">
                  Pass participant and transaction details upfront. Auto-fill forms and streamline UX.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                <MessageSquare className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Dispute Resolution</h3>
                <p className="text-gray-400">
                  Built-in messaging and dispute tools for handling edge cases.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                <Globe className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Sandbox & Production</h3>
                <p className="text-gray-400">
                  Test in sandbox mode first. Switch to production with a single config change.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Code Examples Section */}
        <section id="examples" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Code Examples</h2>
            <p className="text-gray-400 mb-12">
              Copy and paste these snippets to get started. See our docs for more advanced usage.
            </p>

            <div className="space-y-8">
              {/* Installation */}
              <div id="installation">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-green-400">1.</span> Installation
                </h3>
                <CodeBlock code={installCode} title="npm install" />
              </div>

              {/* Configuration */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-green-400">2.</span> Configuration
                </h3>
                <CodeBlock code={configureCode} title="Configure SDK" />
              </div>

              {/* Wallet-Only Mode */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-green-400">3.</span> Wallet-Only Mode
                </h3>
                <p className="text-gray-400 mb-4">
                  Open the wallet for a customer with just their ID. Perfect for accessing transaction history and managing funds.
                </p>
                <CodeBlock code={walletCode} title="Open Wallet" />
              </div>

              {/* Pre-Seeded Transaction */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-green-400">4.</span> Pre-Seeded Transaction
                </h3>
                <p className="text-gray-400 mb-4">
                  Create a transaction with pre-filled data. Participant name and email are locked (read-only), but transaction details remain editable.
                </p>
                <CodeBlock code={transactionCode} title="Create Transaction" />
              </div>

              {/* Inline Display Mode */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="text-green-400">5.</span> Inline Display Mode
                </h3>
                <p className="text-gray-400 mb-4">
                  Embed the escrow widget directly into your page instead of using a modal or fullscreen overlay.
                </p>
                <CodeBlock code={inlineCode} title="Inline Widget" />
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">Try It Out</h2>
            <p className="text-gray-400 mb-12">
              {sdkReady
                ? '✓ SDK is ready. Click a button to open the widget.'
                : '⏳ SDK is loading... (Make sure the SDK bundle is available in your environment)'}
            </p>

            {/* Wallet Examples */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold mb-6 text-green-400">Wallet Mode</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Wallet Modal */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-5 h-5 text-green-400" />
                    <h4 className="text-lg font-semibold">Wallet Modal</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Opens wallet in a centered modal popup overlay.
                  </p>
                  <button
                    onClick={() => handleDemo('Wallet Modal', 'modal', false)}
                    disabled={demoLoading || !sdkReady}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm transition-all"
                  >
                    {demoLoading ? 'Loading...' : 'Open Modal'}
                  </button>
                </div>

                {/* Wallet Fullscreen */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-5 h-5 text-green-400" />
                    <h4 className="text-lg font-semibold">Wallet Fullscreen</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Opens wallet in fullscreen mode (100vw × 100vh).
                  </p>
                  <button
                    onClick={() => handleDemo('Wallet Fullscreen', 'fullscreen', false)}
                    disabled={demoLoading || !sdkReady}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm transition-all"
                  >
                    {demoLoading ? 'Loading...' : 'Open Fullscreen'}
                  </button>
                </div>

                {/* Wallet Inline */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-5 h-5 text-green-400" />
                    <h4 className="text-lg font-semibold">Wallet Inline</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Embeds wallet directly into the page.
                  </p>
                  <button
                    onClick={() => handleDemo('Wallet Inline', 'inline', false)}
                    disabled={demoLoading || !sdkReady}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm transition-all"
                  >
                    {demoLoading ? 'Loading...' : 'Open Inline'}
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Examples */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold mb-6 text-green-400">Pre-Seeded Transaction</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Transaction Modal */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-5 h-5 text-green-400" />
                    <h4 className="text-lg font-semibold">Transaction Modal</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Pre-filled transaction form in modal.
                  </p>
                  <button
                    onClick={() => handleDemo('Transaction Modal', 'modal', true)}
                    disabled={demoLoading || !sdkReady}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm transition-all"
                  >
                    {demoLoading ? 'Loading...' : 'Open Modal'}
                  </button>
                </div>

                {/* Transaction Fullscreen */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-5 h-5 text-green-400" />
                    <h4 className="text-lg font-semibold">Transaction Fullscreen</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Pre-filled transaction form fullscreen.
                  </p>
                  <button
                    onClick={() => handleDemo('Transaction Fullscreen', 'fullscreen', true)}
                    disabled={demoLoading || !sdkReady}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm transition-all"
                  >
                    {demoLoading ? 'Loading...' : 'Open Fullscreen'}
                  </button>
                </div>

                {/* Transaction Inline */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Play className="w-5 h-5 text-green-400" />
                    <h4 className="text-lg font-semibold">Transaction Inline</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Pre-filled transaction form embedded inline.
                  </p>
                  <button
                    onClick={() => handleDemo('Transaction Inline', 'inline', true)}
                    disabled={demoLoading || !sdkReady}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-semibold text-sm transition-all"
                  >
                    {demoLoading ? 'Loading...' : 'Open Inline'}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Message */}
            {demoStatus && (
              <div
                className={`mt-6 p-4 rounded-lg border flex items-center gap-3 ${
                  demoStatus.type === 'success'
                    ? 'bg-green-950 border-green-700 text-green-200'
                    : demoStatus.type === 'error'
                      ? 'bg-red-950 border-red-700 text-red-200'
                      : 'bg-blue-950 border-blue-700 text-blue-200'
                }`}
              >
                {demoStatus.type === 'success' && <Check size={20} />}
                <span>{demoStatus.message}</span>
              </div>
            )}

            {/* SDK Status Info */}
            <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <p className="text-sm text-gray-400">
                <strong>Note:</strong> The demo buttons require the SDK bundle to be available at{' '}
                <span className="font-mono text-green-400">/dist/index.global.js</span>. For production use, install
                via npm and import as a module.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Build?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Start integrating ruby-escrow-js into your application today and offer seamless escrow transactions to your users.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://www.npmjs.com/package/ruby-escrow-js"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-green-500/50"
              >
                View on npm
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border border-green-500 text-green-400 hover:bg-green-500/10 rounded-lg font-semibold transition-all"
              >
                Read the Docs
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
