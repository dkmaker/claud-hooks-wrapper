/**
 * Module registry for CHW
 * Manages module loading, initialization, and execution
 */

import type { CHWConfig } from "../types/config.js";
import type { HookInput, HookOutput, PreToolUseOutput } from "../types/hooks.js";
import { JsonCommandLogger } from "./jsonCommandLogger.js";
import type { HookModule, ModuleRegistration, ModuleResult } from "./types.js";

/**
 * Registry for managing CHW modules
 */
export class ModuleRegistry {
  private modules = new Map<string, ModuleRegistration>();
  private config: CHWConfig | null = null;

  /**
   * Initialize the module registry with configuration
   */
  async initialize(config: CHWConfig): Promise<void> {
    this.config = config;

    // Register built-in modules
    this.registerBuiltinModules();

    // Initialize enabled modules
    await this.initializeEnabledModules();
  }

  /**
   * Register built-in modules
   */
  private registerBuiltinModules(): void {
    // Register JSON command logger
    this.registerModule(new JsonCommandLogger());

    // Additional built-in modules can be registered here
  }

  /**
   * Register a module
   */
  registerModule(module: HookModule): void {
    const config = this.config?.modules[module.name] || { enabled: false, settings: {} };

    this.modules.set(module.name, {
      module,
      config,
      initialized: false,
    });
  }

  /**
   * Initialize all enabled modules
   */
  private async initializeEnabledModules(): Promise<void> {
    if (!this.config) {
      throw new Error("Registry not initialized with configuration");
    }

    for (const [moduleName, registration] of this.modules) {
      if (registration.config.enabled && !registration.initialized) {
        try {
          if (registration.module.initialize) {
            await registration.module.initialize(registration.config);
          }
          registration.initialized = true;
        } catch (error) {
          throw new Error(
            `Failed to initialize module '${moduleName}': ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }
  }

  /**
   * Process a hook event through appropriate modules
   */
  async processHookEvent(input: HookInput): Promise<HookOutput> {
    if (!this.config) {
      throw new Error("Registry not initialized");
    }

    const hookConfigs = this.config.hooks[input.hook_event_name] || [];
    const results: ModuleResult[] = [];
    let finalHookOutput: HookOutput = {
      continue: true,
      suppressOutput: false,
    };

    // Process each hook configuration
    for (const hookConfig of hookConfigs) {
      const matchingModules = this.getMatchingModules(
        input,
        hookConfig.modules,
        hookConfig.matcher
      );

      // Execute matching modules
      for (const moduleName of matchingModules) {
        const registration = this.modules.get(moduleName);

        if (!registration) {
          console.warn(`Module '${moduleName}' not found in registry`);
          continue;
        }

        if (!registration.config.enabled) {
          continue;
        }

        if (!registration.initialized) {
          console.warn(`Module '${moduleName}' not initialized, skipping`);
          continue;
        }

        try {
          const result = await registration.module.process(input, registration.config);
          results.push(result);

          // Merge hook output modifications
          if (result.hookOutput) {
            finalHookOutput = { ...finalHookOutput, ...result.hookOutput };
          }

          // Handle errors
          if (!result.success && result.error) {
            console.error(`Module '${moduleName}' error: ${result.error}`);
          }
        } catch (error) {
          console.error(
            `Module '${moduleName}' threw error: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }

    // Add hook-specific output for PreToolUse
    if (input.hook_event_name === "PreToolUse") {
      const preToolUseOutput = finalHookOutput as PreToolUseOutput;
      preToolUseOutput.hookSpecificOutput = {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: "CHW module processing",
        ...preToolUseOutput.hookSpecificOutput,
      };
    }

    return finalHookOutput;
  }

  /**
   * Get modules that match the current hook event
   */
  private getMatchingModules(
    input: HookInput,
    configuredModules: string[],
    matcher = "*"
  ): string[] {
    // For now, implement simple matching
    // "*" matches all tools
    // Specific tool names can be matched exactly or with patterns

    if (matcher === "*") {
      return configuredModules;
    }

    // Extract tool name for matching
    const toolName = "tool_name" in input ? input.tool_name : "";

    // Support pipe-separated patterns like "Write|Edit"
    const patterns = matcher.split("|");
    const matches = patterns.some((patternRaw) => {
      const pattern = patternRaw.trim();
      if (pattern === "*") return true;
      if (pattern === toolName) return true;
      // Could add regex support here in the future
      return false;
    });

    return matches ? configuredModules : [];
  }

  /**
   * Cleanup all modules
   */
  async cleanup(): Promise<void> {
    for (const [moduleName, registration] of this.modules) {
      if (registration.initialized && registration.module.cleanup) {
        try {
          await registration.module.cleanup();
        } catch (error) {
          console.error(`Error cleaning up module '${moduleName}': ${error}`);
        }
      }
    }
  }

  /**
   * Get registry status for debugging
   */
  getStatus(): Record<string, unknown> {
    const status: Record<string, unknown> = {};

    for (const [moduleName, registration] of this.modules) {
      status[moduleName] = {
        enabled: registration.config.enabled,
        initialized: registration.initialized,
        description: registration.module.description,
      } as Record<string, unknown>;
    }

    return status;
  }
}
