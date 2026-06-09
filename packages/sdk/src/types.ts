/**
 * Ruby Escrow SDK TypeScript Type Definitions
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface RubyEscrowConfig {
  apiKey: string;
  baseUrl: string;
  environment?: 'production' | 'sandbox';
}

// ============================================================================
// Customer Types
// ============================================================================

export interface CreateCustomerData {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface CreateCustomerResponse {
  customerId: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
}

// ============================================================================
// Transaction/Escrow Types
// ============================================================================

/**
 * @deprecated ParticipantInfo is no longer used in InitEscrowOptions.
 * Participants are now referenced by their Payluk customer ID string.
 * Kept only for internal use where participant data is fetched from the API.
 */
export interface ParticipantInfo {
  email: string;
  name?: string;
  phone?: string;
}

export type DisplayMode = 'modal' | 'fullscreen' | 'inline';

export interface InitEscrowOptions {
  /** The caller's own Payluk customer ID. Always required. */
  customerId: string;

  /**
   * The other party's Payluk customer ID.
   * Optional — omit to open in wallet-only mode with no pre-seeded transaction.
   */
  participantId?: string;

  /**
   * Whether the caller is the seller in the transaction.
   * Only meaningful when `participantId` is also provided.
   * If supplied without `participantId`, a console warning is emitted and the
   * wallet opens normally.
   * When provided with `participantId`, the following fields become required:
   * `amount`, `currency`, `name`, `description`.
   */
  isSeller?: boolean;

  /** Transaction amount. Required when `isSeller` + `participantId` are present. */
  amount?: number;

  /** ISO 4217 currency code (e.g. 'NGN'). Required when `isSeller` + `participantId` are present. */
  currency?: string;

  /** Short item/transaction name. Required when `isSeller` + `participantId` are present. */
  name?: string;

  /** Longer transaction description. Required when `isSeller` + `participantId` are present. */
  description?: string;

  conditions?: string[];
  metadata?: Record<string, any>;

  onSuccess?: (result: EscrowSessionResult) => void;
  onCancel?: () => void;
  onError?: (error: EscrowError) => void;

  /**
   * How the escrow widget is rendered.
   * - `'modal'` (default): centred overlay with semi-transparent backdrop.
   * - `'fullscreen'`: fills 100vw × 100vh, no backdrop.
   * - `'inline'`: injected into `container` — no overlay created.
   */
  displayMode?: DisplayMode;

  /**
   * Target DOM element or CSS selector for `displayMode: 'inline'`.
   * Required when `displayMode === 'inline'`; ignored otherwise.
   */
  container?: string | HTMLElement;
}

export interface EscrowSessionResult {
  transactionId: string;
  status: EscrowStatus;
  amount: number;
  currency: string;
  /** Payluk customer ID of the buyer. */
  buyerId: string;
  /** Payluk customer ID of the seller. */
  sellerId: string;
  createdAt: string;
}

export type EscrowStatus = 
  | 'pending'
  | 'funded'
  | 'released'
  | 'refunded'
  | 'disputed'
  | 'cancelled';

// ============================================================================
// Session Token Types
// ============================================================================

export interface SessionTokenData {
  customerId: string;
  participantId?: string;
  isSeller?: boolean;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  conditions?: string[];
  metadata?: Record<string, any>;
}

export interface SessionTokenResponse {
  token: string;
  expiresAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class EscrowError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'EscrowError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, EscrowError.prototype);
  }
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}

// ============================================================================
// PostMessage Event Types
// ============================================================================

export type PostMessageEventType =
  | 'TRANSACTION_CREATED'
  | 'STATUS_UPDATED'
  | 'SESSION_COMPLETE'
  | 'SESSION_CANCELLED'
  | 'SESSION_ERROR';

export interface PostMessageEvent {
  type: PostMessageEventType;
  payload: any;
}

export interface TransactionCreatedEvent extends PostMessageEvent {
  type: 'TRANSACTION_CREATED';
  payload: {
    transactionId: string;
    status: EscrowStatus;
  };
}

export interface StatusUpdatedEvent extends PostMessageEvent {
  type: 'STATUS_UPDATED';
  payload: {
    transactionId: string;
    status: EscrowStatus;
    previousStatus: EscrowStatus;
  };
}

export interface SessionCompleteEvent extends PostMessageEvent {
  type: 'SESSION_COMPLETE';
  payload: EscrowSessionResult;
}

export interface SessionCancelledEvent extends PostMessageEvent {
  type: 'SESSION_CANCELLED';
  payload: {
    reason?: string;
  };
}

export interface SessionErrorEvent extends PostMessageEvent {
  type: 'SESSION_ERROR';
  payload: ErrorResponse;
}

// ============================================================================
// Modal Types
// ============================================================================

export interface ModalOptions {
  token: string;
  baseUrl: string;
  /**
   * How the widget is rendered. Defaults to `'modal'`.
   * When `'inline'`, `container` must also be provided.
   */
  displayMode?: DisplayMode;
  /**
   * Target element or CSS selector for `displayMode: 'inline'`.
   * Required when `displayMode === 'inline'`.
   */
  container?: string | HTMLElement;
  onSuccess?: (result: EscrowSessionResult) => void;
  onCancel?: () => void;
  onError?: (error: EscrowError) => void;
}

// ============================================================================
// SDK Instance Types
// ============================================================================

export interface RubyEscrowSDK {
  configure(config: RubyEscrowConfig): void;
  create(customerData: CreateCustomerData): Promise<string>;
  init(options: InitEscrowOptions): Promise<void>;
  getConfig(): RubyEscrowConfig | null;
}


// Made with Bob
