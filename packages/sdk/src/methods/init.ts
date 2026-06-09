import { configManager } from '../config';
import { apiClient } from '../core/apiClient';
import { openModal } from '../ui/modal';
import { InitEscrowOptions, EscrowError, SessionTokenData } from '../types';

/**
 * Validate init options according to Phase 7 rules.
 */
function validateInitOptions(options: InitEscrowOptions): void {
  if (!options) {
    throw new EscrowError('Init options are required', 'INVALID_OPTIONS');
  }

  // customerId is always required
  if (!options.customerId || typeof options.customerId !== 'string') {
    throw new EscrowError('customerId is required and must be a string', 'INVALID_CUSTOMER_ID');
  }

  // isSeller without participantId — warn and continue
  if (options.isSeller !== undefined && !options.participantId) {
    console.warn(
      '[RubyEscrow] isSeller has no effect without participantId. ' +
      'The wallet will open in browse mode.'
    );
  }

  // When a transaction is being pre-seeded (isSeller + participantId present),
  // all transaction fields become required.
  if (options.isSeller !== undefined && options.participantId) {
    if (typeof options.amount !== 'number' || options.amount <= 0) {
      throw new EscrowError(
        'amount is required and must be a positive number when isSeller and participantId are provided',
        'INVALID_AMOUNT'
      );
    }
    if (!options.currency || typeof options.currency !== 'string') {
      throw new EscrowError(
        'currency is required when isSeller and participantId are provided',
        'INVALID_CURRENCY'
      );
    }
    if (options.currency.length !== 3) {
      throw new EscrowError('currency must be a 3-letter ISO code (e.g. NGN, USD)', 'INVALID_CURRENCY');
    }
    if (!options.name || typeof options.name !== 'string') {
      throw new EscrowError(
        'name is required when isSeller and participantId are provided',
        'INVALID_NAME'
      );
    }
    if (!options.description || typeof options.description !== 'string') {
      throw new EscrowError(
        'description is required when isSeller and participantId are provided',
        'INVALID_DESCRIPTION'
      );
    }
  }

  // Inline display mode requires a container
  if (options.displayMode === 'inline' && !options.container) {
    throw new EscrowError(
      'container is required when displayMode is "inline"',
      'INVALID_OPTIONS'
    );
  }

  // Validate amount if provided outside of the isSeller+participantId context
  if (options.amount !== undefined && options.isSeller === undefined) {
    if (typeof options.amount !== 'number' || options.amount <= 0) {
      throw new EscrowError('amount must be a positive number', 'INVALID_AMOUNT');
    }
  }

  // Validate currency if provided outside the required context
  if (options.currency !== undefined && options.isSeller === undefined) {
    if (typeof options.currency !== 'string' || options.currency.length !== 3) {
      throw new EscrowError('currency must be a 3-letter ISO code (e.g. NGN, USD)', 'INVALID_CURRENCY');
    }
  }

  // Validate conditions if provided
  if (options.conditions !== undefined && options.conditions !== null) {
    if (!Array.isArray(options.conditions)) {
      throw new EscrowError('conditions must be an array', 'INVALID_CONDITIONS');
    }
    if (options.conditions.some((c) => typeof c !== 'string')) {
      throw new EscrowError('All conditions must be strings', 'INVALID_CONDITIONS');
    }
  }

  // Validate metadata if provided
  if (options.metadata !== undefined && options.metadata !== null) {
    if (typeof options.metadata !== 'object' || Array.isArray(options.metadata)) {
      throw new EscrowError('metadata must be an object', 'INVALID_METADATA');
    }
  }

  // Validate callbacks
  if (options.onSuccess !== undefined && typeof options.onSuccess !== 'function') {
    throw new EscrowError('onSuccess must be a function', 'INVALID_CALLBACK');
  }
  if (options.onCancel !== undefined && typeof options.onCancel !== 'function') {
    throw new EscrowError('onCancel must be a function', 'INVALID_CALLBACK');
  }
  if (options.onError !== undefined && typeof options.onError !== 'function') {
    throw new EscrowError('onError must be a function', 'INVALID_CALLBACK');
  }
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Initialize an escrow session
 * @param options - Escrow session options
 */
export async function init(options: InitEscrowOptions): Promise<void> {
  // Validate environment
  if (!isBrowser()) {
    throw new EscrowError(
      'init() can only be called in a browser environment',
      'INVALID_ENVIRONMENT'
    );
  }

  // Validate options
  validateInitOptions(options);

  // Get configuration
  const config = configManager.requireConfig();

  try {
    // Build session token payload
    const sessionData: SessionTokenData = {
      customerId: options.customerId,
      ...(options.participantId && { participantId: options.participantId }),
      ...(options.isSeller !== undefined && { isSeller: options.isSeller }),
      ...(options.amount !== undefined && { amount: options.amount }),
      ...(options.currency && { currency: options.currency }),
      ...(options.name && { name: options.name }),
      ...(options.description && { description: options.description }),
      ...(options.conditions && { conditions: options.conditions }),
      ...(options.metadata && { metadata: options.metadata }),
    };

    // Generate session token
    const tokenResponse = await apiClient.generateSessionToken(sessionData);

    // Open widget with session token
    openModal({
      token: tokenResponse.token,
      baseUrl: config.baseUrl,
      displayMode: options.displayMode,
      container: options.container,
      onSuccess: options.onSuccess,
      onCancel: options.onCancel,
      onError: options.onError,
    });
  } catch (error) {
    const escrowError = error instanceof EscrowError
      ? error
      : new EscrowError(
          'Failed to initialize escrow session',
          'INIT_FAILED',
          { originalError: error instanceof Error ? error.message : String(error) }
        );

    if (options.onError) {
      options.onError(escrowError);
    } else {
      throw escrowError;
    }
  }
}

// Made with Bob
