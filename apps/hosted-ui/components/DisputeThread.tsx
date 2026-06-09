'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispute } from '@/hooks/useDispute';
import { useDisputeMessages } from '@/hooks/useDisputeMessages';
import {
  formatSenderName,
  getSenderColor,
  DisputeMessage,
} from '@/lib/disputeHelpers';

interface DisputeThreadProps {
  disputeId: string;
  transactionId: string;
  currentUserRole: 'buyer' | 'seller' | 'unknown';
}

export default function DisputeThread({
  disputeId,
  transactionId,
  currentUserRole,
}: DisputeThreadProps) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, isLoading: isSending } = useDispute({
    transactionId,
  });

  const {
    messages,
    isLoading: isLoadingMessages,
    error,
    addOptimisticMessage,
  } = useDisputeMessages({
    disputeId,
    enabled: true,
    pollingInterval: 5000,
    onNewMessage: (message) => {
      // Scroll to bottom when new message arrives
      scrollToBottom();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom on initial load and when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || isSending) {
      return;
    }

    const text = messageText.trim();
    setMessageText('');

    // Add optimistic message (only if role is known)
    if (currentUserRole !== 'unknown') {
      const optimisticMessage: DisputeMessage = {
        id: `temp-${Date.now()}`,
        sender: currentUserRole,
        message: text,
        timestamp: new Date().toISOString(),
      };
      addOptimisticMessage(optimisticMessage);
    }

    try {
      await sendMessage(disputeId, text);
    } catch (err) {
      console.error('Failed to send message:', err);
      // The actual message will be fetched on next poll
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Dispute Thread</h3>
        <p className="text-sm text-gray-600 mt-1">
          Communicate with the other party and Payluk support
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation below</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender === currentUserRole;
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] ${
                    isCurrentUser ? 'order-2' : 'order-1'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${getSenderColor(
                        message.sender
                      )}`}
                    >
                      {formatSenderName(message.sender)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || isSending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Messages are monitored by Payluk support
        </p>
      </div>
    </div>
  );
}

// Made with Bob
