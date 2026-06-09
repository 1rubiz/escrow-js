/**
 * Ruby Escrow SDK - Modal UI Component
 * Handles the iframe for escrow sessions.
 * Supports three display modes: modal, fullscreen, and inline.
 */

import {
  ModalOptions,
  EscrowError,
  PostMessageEvent,
  EscrowSessionResult,
} from '../types';

export class EscrowModal {
  private iframe: HTMLIFrameElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private inlineContainer: HTMLElement | null = null;
  private options: ModalOptions;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(options: ModalOptions) {
    this.options = options;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Resolve the inline container from a string selector or HTMLElement.
   * Returns null if not applicable.
   */
  private resolveContainer(): HTMLElement | null {
    const { container } = this.options;
    if (!container) return null;
    if (typeof container === 'string') {
      const el = document.querySelector<HTMLElement>(container);
      if (!el) {
        throw new EscrowError(
          `Container element not found: "${container}"`,
          'INVALID_CONTAINER'
        );
      }
      return el;
    }
    return container;
  }

  /**
   * Build the iframe element.
   */
  private createIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    const sessionUrl = `${this.options.baseUrl}/session?token=${encodeURIComponent(this.options.token)}`;
    iframe.src = sessionUrl;
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'payment');
    return iframe;
  }

  // ---------------------------------------------------------------------------
  // Open
  // ---------------------------------------------------------------------------

  /**
   * Open the widget in the configured display mode.
   */
  open(): void {
    if (this.iframe) {
      throw new EscrowError('Widget is already open', 'MODAL_ALREADY_OPEN');
    }

    const mode = this.options.displayMode ?? 'modal';

    this.iframe = this.createIframe();

    if (mode === 'inline') {
      this.openInline();
    } else if (mode === 'fullscreen') {
      this.openFullscreen();
    } else {
      this.openModal();
    }

    this.setupMessageListener();
  }

  /** Render as a centred overlay modal. */
  private openModal(): void {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    this.iframe!.style.cssText = `
      width: 100%;
      height: 100%;
      max-width: 600px;
      max-height: 90vh;
      border: none;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    this.overlay.appendChild(this.iframe!);
    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';

    // Close on backdrop click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.handleCancel();
      }
    });
  }

  /** Render as a full-viewport overlay (no backdrop colour). */
  private openFullscreen(): void {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
    `;

    this.iframe!.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background-color: white;
    `;

    this.overlay.appendChild(this.iframe!);
    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';
  }

  /** Inject the iframe directly into the caller-provided container. */
  private openInline(): void {
    const container = this.resolveContainer();
    if (!container) {
      // resolveContainer throws if a selector doesn't match;
      // this branch only fires if container wasn't provided (shouldn't happen
      // after init.ts validation, but guard anyway).
      throw new EscrowError(
        'container is required for inline display mode',
        'INVALID_OPTIONS'
      );
    }
    this.inlineContainer = container;

    this.iframe!.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    `;

    container.appendChild(this.iframe!);
  }

  // ---------------------------------------------------------------------------
  // Close
  // ---------------------------------------------------------------------------

  /**
   * Close and clean up the widget.
   */
  close(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    if (this.inlineContainer && this.iframe && this.iframe.parentNode === this.inlineContainer) {
      this.inlineContainer.removeChild(this.iframe);
    }

    document.body.style.overflow = '';

    this.iframe = null;
    this.overlay = null;
    this.inlineContainer = null;
  }

  /**
   * Setup postMessage listener
   */
  private setupMessageListener(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Verify origin
      const baseUrl = new URL(this.options.baseUrl);
      if (event.origin !== baseUrl.origin) {
        return;
      }

      // Parse message
      let message: PostMessageEvent;
      try {
        message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (error) {
        console.error('Failed to parse postMessage data:', error);
        return;
      }

      // Handle message based on type
      switch (message.type) {
        case 'TRANSACTION_CREATED':
          // Transaction created, keep modal open
          break;

        case 'STATUS_UPDATED':
          // Status updated, keep modal open
          break;

        case 'SESSION_COMPLETE':
          this.handleSuccess(message.payload);
          break;

        case 'SESSION_CANCELLED':
          this.handleCancel();
          break;

        case 'SESSION_ERROR':
          this.handleError(message.payload);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Handle successful session completion
   */
  private handleSuccess(result: EscrowSessionResult): void {
    this.close();
    if (this.options.onSuccess) {
      this.options.onSuccess(result);
    }
  }

  /**
   * Handle session cancellation
   */
  private handleCancel(): void {
    this.close();
    if (this.options.onCancel) {
      this.options.onCancel();
    }
  }

  /**
   * Handle session error
   */
  private handleError(errorData: any): void {
    this.close();
    const error = new EscrowError(
      errorData.message || 'An error occurred during the escrow session',
      errorData.code || 'SESSION_ERROR',
      errorData.details
    );
    if (this.options.onError) {
      this.options.onError(error);
    }
  }
}

/**
 * Create and open a modal
 */
export function openModal(options: ModalOptions): EscrowModal {
  const modal = new EscrowModal(options);
  modal.open();
  return modal;
}

// Made with Bob
