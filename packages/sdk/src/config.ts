/**
 * Ruby Escrow SDK Configuration Management
 */

import { RubyEscrowConfig, EscrowError } from './types';

class ConfigManager {
  private config: RubyEscrowConfig | null = null;

  /**
   * Set the SDK configuration
   */
  configure(config: RubyEscrowConfig): void {
    this.validateConfig(config);
    this.config = {
      ...config,
      environment: config.environment || 'production',
    };
  }

  /**
   * Get the current configuration
   */
  getConfig(): RubyEscrowConfig | null {
    return this.config;
  }

  /**
   * Get the current configuration or throw an error if not configured
   */
  requireConfig(): RubyEscrowConfig {
    if (!this.config) {
      throw new EscrowError(
        'SDK not configured. Please call rubyEscrow.configure() first.',
        'NOT_CONFIGURED'
      );
    }
    return this.config;
  }

  /**
   * Check if SDK is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Reset configuration (useful for testing)
   */
  reset(): void {
    this.config = null;
  }

  /**
   * Validate configuration object
   */
  private validateConfig(config: RubyEscrowConfig): void {
    if (!config) {
      throw new EscrowError('Configuration object is required', 'INVALID_CONFIG');
    }

    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new EscrowError('API key is required and must be a string', 'INVALID_API_KEY');
    }

    if (!config.baseUrl || typeof config.baseUrl !== 'string') {
      throw new EscrowError('Base URL is required and must be a string', 'INVALID_BASE_URL');
    }

    // Validate base URL format
    try {
      new URL(config.baseUrl);
    } catch (error) {
      throw new EscrowError('Base URL must be a valid URL', 'INVALID_BASE_URL');
    }

    // Validate environment if provided
    if (config.environment && !['production', 'sandbox'].includes(config.environment)) {
      throw new EscrowError(
        'Environment must be either "production" or "sandbox"',
        'INVALID_ENVIRONMENT'
      );
    }
  }
}

// Export singleton instance
export const configManager = new ConfigManager();

// Made with Bob
