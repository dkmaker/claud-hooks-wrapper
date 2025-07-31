/**
 * Module system types for CHW
 * Defines interfaces for creating pluggable hook modules
 */

import type { HookInput, HookOutput } from "../types/hooks.js";

/**
 * Base interface for all CHW modules
 */
export interface HookModule {
  /**
   * Module name (should match configuration key)
   */
  readonly name: string;

  /**
   * Module description
   */
  readonly description: string;

  /**
   * Process a hook event
   * @param input Hook input data from Claude Code
   * @param config Module-specific configuration
   * @returns Promise resolving to hook processing result
   */
  process(input: HookInput, config: ModuleConfig): Promise<ModuleResult>;

  /**
   * Initialize the module (called once when module is loaded)
   * @param config Module configuration
   */
  initialize?(config: ModuleConfig): Promise<void> | void;

  /**
   * Cleanup the module (called when shutting down)
   */
  cleanup?(): Promise<void> | void;
}

/**
 * Module configuration from .chw-config.yaml
 */
export interface ModuleConfig {
  enabled: boolean;
  settings?: Record<string, unknown>;
}

/**
 * Result returned by a module after processing a hook
 */
export interface ModuleResult {
  /**
   * Whether the module completed successfully
   */
  success: boolean;

  /**
   * Optional hook output modifications
   * If provided, these will influence the final hook response
   */
  hookOutput?: Partial<HookOutput>;

  /**
   * Error message if processing failed
   */
  error?: string;

  /**
   * Additional data for logging or debugging
   */
  metadata?: Record<string, unknown>;
}

/**
 * Module registration entry
 */
export interface ModuleRegistration {
  module: HookModule;
  config: ModuleConfig;
  initialized: boolean;
}

/**
 * Module matcher configuration
 */
export interface ModuleMatcher {
  matcher: string;
  modules: string[];
}
