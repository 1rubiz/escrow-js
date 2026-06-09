/**
 * StatusTimeline Component
 * 
 * Visual timeline showing the progress of an escrow transaction
 */

'use client';

import { EscrowStatus, getStatusTimeline, getStatusInfo } from '@/lib/statusHelpers';

interface StatusTimelineProps {
  currentStatus: EscrowStatus;
  className?: string;
}

export default function StatusTimeline({ currentStatus, className = '' }: StatusTimelineProps) {
  const timeline = getStatusTimeline(currentStatus);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Transaction Progress</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Timeline Items */}
        <div className="space-y-6">
          {timeline.map((stage, index) => {
            const statusInfo = getStatusInfo(stage.status);
            const isLast = index === timeline.length - 1;

            return (
              <div key={stage.status} className="relative flex items-start gap-4">
                {/* Status Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    stage.completed
                      ? 'bg-green-500 border-green-500'
                      : stage.current
                      ? 'bg-blue-500 border-blue-500 animate-pulse'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {stage.completed ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : stage.current ? (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  ) : (
                    <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  )}
                </div>

                {/* Status Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{statusInfo.icon}</span>
                    <h4
                      className={`font-semibold ${
                        stage.current
                          ? 'text-blue-600'
                          : stage.completed
                          ? 'text-green-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {stage.label}
                    </h4>
                    {stage.current && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      stage.current || stage.completed ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {statusInfo.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Badge */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              getStatusInfo(currentStatus).color
            }`}
          >
            {getStatusInfo(currentStatus).label}
          </span>
        </div>
      </div>
    </div>
  );
}

// Made with Bob