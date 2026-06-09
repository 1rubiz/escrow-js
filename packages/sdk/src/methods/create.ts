/**
 * Ruby Escrow SDK - Create Customer Method
 */

import { apiClient } from '../core/apiClient';
import { CreateCustomerData, EscrowError } from '../types';

/**
 * Validate customer data
 */
function validateCustomerData(data: CreateCustomerData): void {
  if (!data) {
    throw new EscrowError('Customer data is required', 'INVALID_CUSTOMER_DATA');
  }

  if (!data.email || typeof data.email !== 'string') {
    throw new EscrowError('Email is required and must be a string', 'INVALID_EMAIL');
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new EscrowError('Invalid email format', 'INVALID_EMAIL');
  }

  if (!data.name || typeof data.name !== 'string') {
    throw new EscrowError('Name is required and must be a string', 'INVALID_NAME');
  }

  if (data.name.trim().length === 0) {
    throw new EscrowError('Name cannot be empty', 'INVALID_NAME');
  }

  // Validate phone if provided
  if (data.phone !== undefined && data.phone !== null) {
    if (typeof data.phone !== 'string') {
      throw new EscrowError('Phone must be a string', 'INVALID_PHONE');
    }
    // Basic phone validation (allow international formats)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      throw new EscrowError(
        'Invalid phone format. Use international format (e.g., +1234567890)',
        'INVALID_PHONE'
      );
    }
  }

  // Validate metadata if provided
  if (data.metadata !== undefined && data.metadata !== null) {
    if (typeof data.metadata !== 'object' || Array.isArray(data.metadata)) {
      throw new EscrowError('Metadata must be an object', 'INVALID_METADATA');
    }
  }
}

/**
 * Create a new customer
 * @param customerData - Customer information
 * @returns Promise resolving to the customer ID
 */
export async function create(customerData: CreateCustomerData): Promise<string> {
  // Validate input
  validateCustomerData(customerData);

  try {
    // Call API to create customer
    const response = await apiClient.createCustomer(customerData);

    // Return customer ID
    return response.customerId;
  } catch (error) {
    // Re-throw EscrowError as-is
    if (error instanceof EscrowError) {
      throw error;
    }

    // Wrap other errors
    throw new EscrowError(
      'Failed to create customer',
      'CREATE_CUSTOMER_FAILED',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Made with Bob
