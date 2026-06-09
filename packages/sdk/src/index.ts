/**
 * Ruby Escrow SDK
 * Main entry point
 */

import { configManager } from './config';
import { create } from './methods/create';
import { init } from './methods/init';
import {
  RubyEscrowConfig,
  RubyEscrowSDK,
  CreateCustomerData,
  InitEscrowOptions,
} from './types';

/**
 * Ruby Escrow SDK Instance
 */
const rubyEscrow: RubyEscrowSDK = {
  /**
   * Configure the SDK with API credentials and base URL
   * @param config - SDK configuration
   */
  configure(config: RubyEscrowConfig): void {
    configManager.configure(config);
  },

  /**
   * Create a new customer
   * @param customerData - Customer information
   * @returns Promise resolving to the customer ID
   */
  async create(customerData: CreateCustomerData): Promise<string> {
    return create(customerData);
  },

  /**
   * Initialize an escrow session
   * @param options - Escrow session options
   */
  async init(options: InitEscrowOptions): Promise<void> {
    return init(options);
  },

  /**
   * Get the current SDK configuration
   * @returns Current configuration or null if not configured
   */
  getConfig(): RubyEscrowConfig | null {
    return configManager.getConfig();
  },
};

// Export the SDK instance as default
export default rubyEscrow;

// Also export as named export for flexibility
export { rubyEscrow };

// Export types for TypeScript users
export type {
  RubyEscrowConfig,
  RubyEscrowSDK,
  CreateCustomerData,
  CreateCustomerResponse,
  InitEscrowOptions,
  EscrowSessionResult,
  EscrowStatus,
  DisplayMode,
  SessionTokenData,
  SessionTokenResponse,
  ApiResponse,
  ErrorResponse,
  PostMessageEvent,
  TransactionCreatedEvent,
  StatusUpdatedEvent,
  SessionCompleteEvent,
  SessionCancelledEvent,
  SessionErrorEvent,
  ModalOptions,
} from './types';

// ParticipantInfo is deprecated but still exported for backwards compatibility
export type { ParticipantInfo } from './types';

// Export EscrowError class
export { EscrowError } from './types';

// Made with Bob
