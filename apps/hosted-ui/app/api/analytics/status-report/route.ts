import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
import {
  getStatusDistribution,
  getTransactionSummary,
  getDisputeStats,
  getAverageCompletionTime,
  getTransactionVelocity,
  getCustomerRetention,
  getHourlyDistribution,
  getStatusTransitions,
} from '@/lib/db/queries/analytics';

/**
 * GET /api/analytics/status-report
 *
 * Returns a comprehensive status distribution and health report.
 *
 * Query params:
 *   days  - lookback window for daily/velocity stats (default: 30)
 *
 * Requires API key authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = validateApiKey(request);
    if (!authResult.valid) {
      return unauthorizedResponse(authResult.error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      statusDistribution,
      summary,
      disputeStats,
      avgCompletionHours,
      velocity,
      retention,
      hourlyDistribution,
      statusTransitions,
    ] = await Promise.all([
      getStatusDistribution(),
      getTransactionSummary(startDate, endDate),
      getDisputeStats(),
      getAverageCompletionTime(),
      getTransactionVelocity(24),
      getCustomerRetention(),
      getHourlyDistribution(),
      getStatusTransitions(50),
    ]);

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      period: { days, from: startDate.toISOString(), to: endDate.toISOString() },
      statusDistribution,
      summary,
      disputeStats,
      performance: {
        avgCompletionHours,
        transactionsPerHour: velocity?.transactions_per_hour || 0,
        totalLast24h: velocity?.transaction_count || 0,
      },
      customerInsights: {
        retention,
        hourlyDistribution,
      },
      statusTransitions,
    });
  } catch (error) {
    console.error('Status report error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate status report';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
