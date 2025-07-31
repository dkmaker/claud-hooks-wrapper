#!/usr/bin/env node

/**
 * Claude Hooks Wrapper CLI
 * Entry point for the CHW command-line tool
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { loadConfigFromDir } from "./config/loader.js";
import { getLogger } from "./logging/logger.js";
import { ModuleRegistry } from "./modules/moduleRegistry.js";
import type { HookInput, HookOutput, PreToolUseOutput } from "./types/hooks.js";

// Get package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const program = new Command();

program
  .name("chw")
  .description("Claude Hooks Wrapper - Simplified configuration for Claude Code hooks")
  .version(packageJson.version);

// Install command - sets up hooks in Claude settings
program
  .command("install")
  .description("Install CHW hooks into Claude Code configuration")
  .option("-g, --global", "Install to global Claude settings")
  .option("-p, --project <path>", "Install to specific project directory")
  .action(async (options) => {
    console.log("Installing CHW hooks...");
    console.log("Options:", options);

    // TODO: Implement installation logic
    console.log("Installation functionality will be implemented in future versions");
  });

// Validate command - checks the CHW configuration
program
  .command("validate")
  .description("Validate the .chw-config.yaml file")
  .option("-f, --file <path>", "Path to config file", ".chw-config.yaml")
  .action(async (options) => {
    console.log("Validating CHW configuration...");
    console.log("Config file:", options.file);

    // TODO: Implement validation logic
    console.log("Validation functionality will be implemented in future versions");
  });

// Init command - creates a sample configuration
program
  .command("init")
  .description("Initialize a new .chw-config.yaml file")
  .option("-f, --force", "Overwrite existing configuration")
  .action(async (options) => {
    console.log("Initializing CHW configuration...");
    console.log("Force:", options.force);

    // TODO: Implement initialization logic
    console.log("Initialization functionality will be implemented in future versions");
  });

// Status command - shows current hook status
program
  .command("status")
  .description("Show current CHW hook status")
  .action(async () => {
    console.log("CHW Status:");

    // TODO: Implement status checking logic
    console.log("Status functionality will be implemented in future versions");
  });

// Handle stdin for hook execution (when called by Claude)
if (!process.stdin.isTTY) {
  // We're being called as a hook by Claude Code
  await handleHookExecution();
  process.exit(0);
}

/**
 * Handle hook execution when called by Claude Code
 * Reads JSON input from stdin and processes the hook event
 */
async function handleHookExecution(): Promise<void> {
  try {
    // Read JSON input from stdin
    const input = await readStdin();

    if (!input.trim()) {
      console.error(JSON.stringify({ error: "No input provided" }));
      return;
    }

    // Parse JSON input
    let hookInput: HookInput;
    try {
      hookInput = JSON.parse(input) as HookInput;
    } catch {
      console.error(JSON.stringify({ error: "Invalid JSON input" }));
      return;
    }

    // Process the hook event
    const result = await processHookEvent(hookInput);

    // Output result as JSON
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(
      JSON.stringify({
        error: "Hook execution failed",
        details: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

/**
 * Read all data from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    process.stdin.on("end", () => {
      resolve(data);
    });

    process.stdin.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Process a hook event and return the appropriate response
 */
async function processHookEvent(hookInput: HookInput): Promise<HookOutput> {
  const logger = getLogger(hookInput.cwd);

  try {
    // Load configuration
    const config = loadConfigFromDir(hookInput.cwd);

    // Initialize module registry
    const registry = new ModuleRegistry();
    await registry.initialize(config);

    // Log the hook event (basic logging)
    if (config.logging.enabled) {
      logger.info(`Hook triggered: ${hookInput.hook_event_name}`, {
        session_id: hookInput.session_id,
        tool_name: "tool_name" in hookInput ? hookInput.tool_name : undefined,
        tool_input: "tool_input" in hookInput ? hookInput.tool_input : undefined,
        tool_response: "tool_response" in hookInput ? hookInput.tool_response : undefined,
      });
    }

    // Process through module system
    const result = await registry.processHookEvent(hookInput);

    // Cleanup registry
    await registry.cleanup();

    return result;
  } catch (error) {
    // Fallback to basic processing if module system fails
    logger.error(`Module system error: ${error instanceof Error ? error.message : String(error)}`);

    // Return basic safe response
    const fallbackResponse: HookOutput = {
      continue: true,
      suppressOutput: false,
    };

    if (hookInput.hook_event_name === "PreToolUse") {
      const preToolUseResponse = fallbackResponse as PreToolUseOutput;
      preToolUseResponse.hookSpecificOutput = {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: "CHW fallback processing",
      };
    }

    return fallbackResponse;
  }
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
