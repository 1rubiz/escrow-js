import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, errorResponse, unauthorizedResponse } from '@/lib/auth';
import {
  getStatusDistribution,
  getDailyStats,
  getTopCustomers,
  getPaymentGatewayStats,
  getDisputeStats,
  getRevenueByCurrency,
  getApiPerformance,
  // getDashboardStats,
} from '@/lib/db/queries/analytics';

/**
 * GET /api/analytics/transactions
 *
 * Returns comprehensive transaction analytics.
 *
 * Query params:
 *   from     - ISO date string (start of range)
 *   to       - ISO date string (end of range)
 *   days     - number of days for daily stats (default: 30)
 *   limit    - top-N customers to include (default: 10)
 *   currency - filter revenue by currency (default: NGN)
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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const days = parseInt(searchParams.get('days') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    // const currency = searchParams.get('currency') || 'NGN';

    // const startDate = from ? new Date(from) : undefined;
    // const endDate = to ? new Date(to) : undefined;

    // Fetch all analytics in parallel for performance
    const [
      statusDistribution,
      dailyStats,
      topCustomers,
      gatewayStats,
      disputeMetrics,
      revenueByCurrency,
      apiMetrics,
    ] = await Promise.all([
      getStatusDistribution(),
      getDailyStats(days),
      getTopCustomers(limit),
      getPaymentGatewayStats(),
      getDisputeStats(),
      getRevenueByCurrency(),
      getApiPerformance(24),
    ]);

    return NextResponse.json({
      success: true,
      period: {
        from: from || `last ${days} days`,
        to: to || 'now',
      },
      statusDistribution,
      dailyStats,
      topCustomers,
      gatewayStats,
      disputeMetrics,
      revenueByCurrency,
      apiMetrics,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve analytics';
    return errorResponse(errorMessage, 500);
  }
}

// Made with Bob
