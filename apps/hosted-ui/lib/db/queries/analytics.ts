/**
 * Analytics Query Functions
 * 
 * Custom analytics and reporting queries for business intelligence
 */

import { query } from '../client';
import { EscrowStatus } from './transactions';

export interface StatusDistribution {
  status: EscrowStatus;
  count: number;
  total_amount: number;
}

export interface DailyStats {
  date: string;
  transaction_count: number;
  total_amount: number;
  completed_count: number;
  disputed_count: number;
}

export interface CustomerStats {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  total_transactions: number;
  total_amount: number;
  as_buyer: number;
  as_seller: number;
}

export interface PaymentGatewayStats {
  gateway: string;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  success_rate: number;
  total_amount: number;
}

/**
 * Get transaction status distribution
 */
export async function getStatusDistribution(): Promise<StatusDistribution[]> {
  const result = await query<StatusDistribution>(
    `SELECT 
      current_status as status,
      COUNT(*)::int as count,
      COALESCE(SUM(amount), 0) as total_amount
     FROM transactions
     GROUP BY current_status
     ORDER BY count DESC`
  );

  return result.rows;
}

/**
 * Get daily transaction statistics
 */
export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const result = await query<DailyStats>(
    `SELECT 
      DATE(created_at) as date,
      COUNT(*)::int as transaction_count,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) FILTER (WHERE current_status = 'COMPLETED')::int as completed_count,
      COUNT(*) FILTER (WHERE current_status = 'DISPUTED')::int as disputed_count
     FROM transactions
     WHERE created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(created_at)
     ORDER BY date DESC`
  );

  return result.rows;
}

/**
 * Get top customers by transaction volume
 */
export async function getTopCustomers(limit: number = 10): Promise<CustomerStats[]> {
  const result = await query<CustomerStats>(
    `SELECT 
      c.id as customer_id,
      c.name as customer_name,
      c.email as customer_email,
      COUNT(DISTINCT t.id)::int as total_transactions,
      COALESCE(SUM(t.amount), 0) as total_amount,
      COUNT(DISTINCT t.id) FILTER (WHERE t.buyer_id = c.id)::int as as_buyer,
      COUNT(DISTINCT t.id) FILTER (WHERE t.seller_id = c.id)::int as as_seller
     FROM customers c
     LEFT JOIN transactions t ON (t.buyer_id = c.id OR t.seller_id = c.id)
     GROUP BY c.id, c.name, c.email
     HAVING COUNT(DISTINCT t.id) > 0
     ORDER BY total_amount DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

/**
 * Get payment gateway statistics
 */
export async function getPaymentGatewayStats(): Promise<PaymentGatewayStats[]> {
  const result = await query<PaymentGatewayStats>(
    `SELECT 
      gateway,
      COUNT(*)::int as total_payments,
      COUNT(*) FILTER (WHERE status = 'success')::int as successful_payments,
      COUNT(*) FILTER (WHERE status = 'failed')::int as failed_payments,
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'success')::float / NULLIF(COUNT(*), 0) * 100)::numeric,
        2
      ) as success_rate,
      COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_amount
     FROM payments
     GROUP BY gateway
     ORDER BY total_payments DESC`
  );

  return result.rows;
}

/**
 * Get transaction summary for date range
 */
export async function getTransactionSummary(startDate: Date, endDate: Date) {
  const result = await query(
    `SELECT 
      COUNT(*)::int as total_transactions,
      COALESCE(SUM(amount), 0) as total_amount,
      COALESCE(AVG(amount), 0) as average_amount,
      COUNT(*) FILTER (WHERE current_status = 'COMPLETED')::int as completed_transactions,
      COUNT(*) FILTER (WHERE current_status = 'DISPUTED')::int as disputed_transactions,
      COUNT(*) FILTER (WHERE current_status = 'REFUNDED')::int as refunded_transactions,
      COALESCE(SUM(amount) FILTER (WHERE current_status = 'COMPLETED'), 0) as completed_amount,
      COALESCE(SUM(amount) FILTER (WHERE current_status = 'REFUNDED'), 0) as refunded_amount
     FROM transactions
     WHERE created_at >= $1 AND created_at <= $2`,
    [startDate, endDate]
  );

  return result.rows[0];
}

/**
 * Get dispute resolution statistics
 */
export async function getDisputeStats() {
  const result = await query(
    `SELECT 
      COUNT(*)::int as total_disputes,
      COUNT(*) FILTER (WHERE status = 'open')::int as open_disputes,
      COUNT(*) FILTER (WHERE status = 'investigating')::int as investigating_disputes,
      COUNT(*) FILTER (WHERE status = 'resolved')::int as resolved_disputes,
      COUNT(*) FILTER (WHERE status = 'resolved' AND winner = 'buyer')::int as buyer_wins,
      COUNT(*) FILTER (WHERE status = 'resolved' AND winner = 'seller')::int as seller_wins,
      ROUND(
        AVG(EXTRACT(EPOCH FROM (resolved_at - opened_at)) / 3600)::numeric,
        2
      ) as avg_resolution_hours
     FROM disputes`
  );

  return result.rows[0];
}

/**
 * Get average transaction completion time
 */
export async function getAverageCompletionTime() {
  const result = await query(
    `SELECT 
      ROUND(
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::numeric,
        2
      ) as avg_hours
     FROM transactions
     WHERE completed_at IS NOT NULL`
  );

  return result.rows[0]?.avg_hours || 0;
}

/**
 * Get transaction velocity (transactions per hour)
 */
export async function getTransactionVelocity(hours: number = 24) {
  const result = await query(
    `SELECT 
      COUNT(*)::int as transaction_count,
      ROUND((COUNT(*)::float / $1)::numeric, 2) as transactions_per_hour
     FROM transactions
     WHERE created_at >= NOW() - INTERVAL '${hours} hours'`,
    [hours]
  );

  return result.rows[0];
}

/**
 * Get revenue by currency
 */
export async function getRevenueByCurrency() {
  const result = await query(
    `SELECT 
      currency,
      COUNT(*)::int as transaction_count,
      COALESCE(SUM(amount) FILTER (WHERE current_status = 'COMPLETED'), 0) as completed_revenue,
      COALESCE(SUM(amount) FILTER (WHERE current_status IN ('PENDING', 'ONGOING')), 0) as pending_revenue
     FROM transactions
     GROUP BY currency
     ORDER BY completed_revenue DESC`
  );

  return result.rows;
}

/**
 * Get customer retention metrics
 */
export async function getCustomerRetention() {
  const result = await query(
    `WITH customer_transactions AS (
      SELECT 
        COALESCE(buyer_id, seller_id) as customer_id,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE buyer_id IS NOT NULL OR seller_id IS NOT NULL
      GROUP BY COALESCE(buyer_id, seller_id)
    )
    SELECT 
      COUNT(*) FILTER (WHERE transaction_count = 1)::int as one_time_customers,
      COUNT(*) FILTER (WHERE transaction_count > 1)::int as repeat_customers,
      ROUND(
        (COUNT(*) FILTER (WHERE transaction_count > 1)::float / NULLIF(COUNT(*), 0) * 100)::numeric,
        2
      ) as repeat_rate
    FROM customer_transactions`
  );

  return result.rows[0];
}

/**
 * Get hourly transaction distribution
 */
export async function getHourlyDistribution() {
  const result = await query(
    `SELECT 
      EXTRACT(HOUR FROM created_at)::int as hour,
      COUNT(*)::int as transaction_count,
      COALESCE(SUM(amount), 0) as total_amount
     FROM transactions
     WHERE created_at >= NOW() - INTERVAL '7 days'
     GROUP BY EXTRACT(HOUR FROM created_at)
     ORDER BY hour`
  );

  return result.rows;
}

/**
 * Get status transition analysis
 */
export async function getStatusTransitions(limit: number = 100) {
  const result = await query(
    `SELECT 
      from_status,
      to_status,
      COUNT(*)::int as transition_count,
      ROUND(AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY transaction_id ORDER BY created_at))) / 60)::numeric, 2) as avg_minutes
     FROM transaction_status_history
     WHERE from_status IS NOT NULL
     GROUP BY from_status, to_status
     ORDER BY transition_count DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
}

/**
 * Get API performance metrics
 */
export async function getApiPerformance(hours: number = 24) {
  const result = await query(
    `SELECT 
      endpoint,
      COUNT(*)::int as request_count,
      COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300)::int as successful_requests,
      COUNT(*) FILTER (WHERE status_code >= 400)::int as failed_requests,
      ROUND(AVG(duration_ms)::numeric, 2) as avg_duration_ms,
      MAX(duration_ms) as max_duration_ms
     FROM api_logs
     WHERE created_at >= NOW() - INTERVAL '${hours} hours'
     GROUP BY endpoint
     ORDER BY request_count DESC`
  );

  return result.rows;
}

/**
 * Get comprehensive dashboard stats
 */
export async function getDashboardStats() {
  const [
    statusDist,
    summary,
    disputeStats,
    avgCompletionTime,
    velocity,
  ] = await Promise.all([
    getStatusDistribution(),
    getTransactionSummary(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    ),
    getDisputeStats(),
    getAverageCompletionTime(),
    getTransactionVelocity(24),
  ]);

  return {
    statusDistribution: statusDist,
    summary,
    disputes: disputeStats,
    avgCompletionTime,
    velocity,
  };
}

// Made with Bob