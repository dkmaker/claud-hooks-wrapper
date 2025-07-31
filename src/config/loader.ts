/**
 * Configuration loader for CHW
 * Handles loading and parsing of .chw-config.yaml files
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "yaml";
import type { CHWConfig } from "../types/config.js";
import { defaultConfig } from "../types/config.js";

/**
 * Load CHW configuration from file
 * @param configPath Path to the .chw-config.yaml file
 * @returns Loaded and validated configuration
 */
export function loadConfig(configPath?: string): CHWConfig {
  const defaultPath = ".chw-config.yaml";
  const finalPath = configPath || defaultPath;

  if (!existsSync(finalPath)) {
    throw new Error(`Configuration file not found: ${finalPath}`);
  }

  try {
    const yamlContent = readFileSync(finalPath, "utf-8");
    const parsed = yaml.parse(yamlContent);

    // Merge with default configuration
    const config = mergeConfigs(defaultConfig, parsed);

    // Validate configuration
    validateConfig(config);

    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
    throw new Error(`Failed to load configuration: ${String(error)}`);
  }
}

/**
 * Load configuration from a specific directory
 * @param cwd Working directory to look for .chw-config.yaml
 * @returns Loaded configuration or default config if not found
 */
export function loadConfigFromDir(cwd: string): CHWConfig {
  const configPath = join(cwd, ".chw-config.yaml");

  if (!existsSync(configPath)) {
    // Return default config if no configuration file found
    return defaultConfig;
  }

  return loadConfig(configPath);
}

/**
 * Deep merge two configuration objects
 */
function mergeConfigs(defaultConf: CHWConfig, userConf: unknown): CHWConfig {
  const merged = { ...defaultConf };

  // Type guard for parsed YAML object
  if (typeof userConf === "object" && userConf !== null) {
    const conf = userConf as Record<string, unknown>;

    if (conf.version && typeof conf.version === "string") {
      merged.version = conf.version;
    }

    if (conf.logging && typeof conf.logging === "object" && conf.logging !== null) {
      merged.logging = { ...merged.logging, ...(conf.logging as Record<string, unknown>) };
    }

    if (conf.modules && typeof conf.modules === "object" && conf.modules !== null) {
      // Validate and merge modules configuration
      const modules = conf.modules as Record<string, unknown>;
      for (const [moduleName, moduleConfig] of Object.entries(modules)) {
        if (typeof moduleConfig === "object" && moduleConfig !== null) {
          merged.modules[moduleName] = moduleConfig as {
            enabled: boolean;
            settings?: Record<string, unknown>;
          };
        }
      }
    }

    if (conf.hooks && typeof conf.hooks === "object" && conf.hooks !== null) {
      // Validate and merge hooks configuration
      const hooks = conf.hooks as Record<string, unknown>;
      for (const [hookName, hookConfig] of Object.entries(hooks)) {
        if (Array.isArray(hookConfig)) {
          merged.hooks[hookName] = hookConfig as { matcher?: string; modules: string[] }[];
        }
      }
    }
  }

  return merged;
}

/**
 * Validate configuration structure
 */
function validateConfig(config: CHWConfig): void {
  if (!config.version) {
    throw new Error("Configuration must specify a version");
  }

  if (!config.logging) {
    throw new Error("Configuration must include logging section");
  }

  if (typeof config.logging.enabled !== "boolean") {
    throw new Error("logging.enabled must be a boolean");
  }

  const validLevels = ["debug", "info", "warn", "error"];
  if (!validLevels.includes(config.logging.level)) {
    throw new Error(`logging.level must be one of: ${validLevels.join(", ")}`);
  }

  const validFormats = ["json", "text"];
  if (!validFormats.includes(config.logging.format)) {
    throw new Error(`logging.format must be one of: ${validFormats.join(", ")}`);
  }

  if (!config.modules || typeof config.modules !== "object") {
    throw new Error("Configuration must include modules section");
  }

  if (!config.hooks || typeof config.hooks !== "object") {
    throw new Error("Configuration must include hooks section");
  }

  // Validate module configurations
  for (const [moduleName, moduleConfig] of Object.entries(config.modules)) {
    if (typeof moduleConfig.enabled !== "boolean") {
      throw new Error(`Module ${moduleName}.enabled must be a boolean`);
    }

    if (moduleConfig.settings && typeof moduleConfig.settings !== "object") {
      throw new Error(`Module ${moduleName}.settings must be an object`);
    }
  }

  // Validate hook configurations
  for (const [hookName, hookConfigs] of Object.entries(config.hooks)) {
    if (!Array.isArray(hookConfigs)) {
      throw new Error(`Hook ${hookName} must be an array of configurations`);
    }

    for (const hookConfig of hookConfigs) {
      if (!hookConfig.modules || !Array.isArray(hookConfig.modules)) {
        throw new Error(`Hook ${hookName} configuration must have modules array`);
      }

      if (hookConfig.matcher && typeof hookConfig.matcher !== "string") {
        throw new Error(`Hook ${hookName} matcher must be a string`);
      }
    }
  }
}
