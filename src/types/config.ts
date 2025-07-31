/**
 * Configuration types for the CHW wrapper
 */

/**
 * Configuration for a single hook module
 */
export interface HookModuleConfig {
  enabled: boolean;
  settings?: Record<string, unknown>;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  enabled: boolean;
  level: "debug" | "info" | "warn" | "error";
  format: "json" | "text";
  maxFiles?: number;
  maxSize?: string;
}

/**
 * Hook event configuration
 */
export interface HookEventConfig {
  [eventName: string]: {
    matcher?: string;
    modules: string[];
  }[];
}

/**
 * Main CHW configuration
 */
export interface CHWConfig {
  version: string;
  logging: LoggingConfig;
  modules: Record<string, HookModuleConfig>;
  hooks: HookEventConfig;
}

/**
 * Default configuration
 */
export const defaultConfig: CHWConfig = {
  version: "1.0.0",
  logging: {
    enabled: true,
    level: "info",
    format: "text",
    maxFiles: 10,
    maxSize: "10MB",
  },
  modules: {},
  hooks: {},
};
