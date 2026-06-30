/**
 * Ruby Escrow SDK - Close Method
 *
 * Programmatically close all open escrow widgets,
 * regardless of display mode (modal, fullscreen, inline).
 */

import { closeAllModals } from "../ui/modal";

/**
 * Close all open escrow widgets.
 *
 * Works across every display mode:
 *   - modal    → removes overlay + iframe
 *   - fullscreen → removes overlay + iframe
 *   - inline   → removes iframe from container
 *
 * Safe to call even when no widget is open (no-op).
 */
export function close(): void {
  closeAllModals();
}
