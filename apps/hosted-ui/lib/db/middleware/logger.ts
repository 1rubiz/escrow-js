/**
 * API Logging Middleware
 * 
 * Automatically logs all Payluk API interactions to the database
 */

import { query } from '../client';

export interface ApiLogData {
  transactionId?: string;
  endpoint: string;
  method: string;
  requestBody?: any;
  responseBody?: any;
  statusCode: number;
  durationMs?: number;
  error?: string;
}

/**
 * Log an API call to the database
 */
export async function logApiCall(data: ApiLogData): Promise<void> {
  try {
    await query(
      `INSERT INTO api_logs (
        transaction_id, endpoint, method, request_body, response_body,
        status_code, duration_ms, error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.transactionId || null,
        data.endpoint,
        data.method,
        data.requestBody ? JSON.stringify(data.requestBody) : null,
        data.responseBody ? JSON.stringify(data.responseBody) : null,
        data.statusCode,
        data.durationMs || null,
        data.error || null,
      ]
    );
  } catch (error) {
    // Don't throw - logging should not break the application
    console.error('Failed to log API call:', error);
  }
}

/**
 * Wrapper function to log API calls automatically
 */
export async function withApiLogging<T>(
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>,
  options?: {
    transactionId?: string;
    requestBody?: any;
  }
): Promise<T> {
  const startTime = Date.now();
  let statusCode = 200;
  let responseBody: any;
  let error: string | undefined;

  try {
    const result = await apiCall();
    responseBody = result;
    return result;
  } catch (err) {
    statusCode = 500;
    error = err instanceof Error ? err.message : 'Unknown error';
    throw err;
  } finally {
    const durationMs = Date.now() - startTime;

    // Log asynchronously without blocking
    logApiCall({
      transactionId: options?.transactionId,
      endpoint,
      method,
      requestBody: options?.requestBody,
      responseBody,
      statusCode,
      durationMs,
      error,
    }).catch((logError) => {
      console.error('API logging failed:', logError);
    });
  }
}

/**
 * Create a logged version of a Payluk client function
 */
export function createLoggedFunction<TArgs extends any[], TResult>(
  endpoint: string,
  method: string,
  fn: (...args: TArgs) => Promise<TResult>,
  getTransactionId?: (...args: TArgs) => string | undefined
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const transactionId = getTransactionId?.(...args);
    
    return withApiLogging(
      endpoint,
      method,
      () => fn(...args),
      {
        transactionId,
        requestBody: args.length > 0 ? args[0] : undefined,
      }
    );
  };
}

// Made with Bob