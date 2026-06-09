'use client';

import { DisputeMessage, formatSenderName, getSenderColor } from '@/lib/disputeHelpers';

interface DisputeHistoryProps {
  messages: DisputeMessage[];
  isLoading?: boolean;
}

export default function DisputeHistory({ messages, isLoading }: DisputeHistoryProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Message History
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Message History
        </h3>
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-sm text-gray-600">No messages yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Messages will appear here as the dispute progresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Message History
      </h3>
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`border-l-4 pl-4 py-2 ${
              message.sender === 'admin'
                ? 'border-purple-500 bg-purple-50'
                : message.sender === 'buyer'
                ? 'border-blue-500 bg-blue-50'
                : 'border-green-500 bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
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
            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {message.message}
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Messages</span>
          <span className="font-medium text-gray-900">{messages.length}</span>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
