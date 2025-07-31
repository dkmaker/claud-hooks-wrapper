/**
 * JSON Command Logger Module
 * Saves each hook event as individual JSON files in .chw-commands/ directory
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { HookInput } from "../types/hooks.js";
import type { HookModule, ModuleConfig, ModuleResult } from "./types.js";

interface JsonCommandLoggerSettings {
  maxFiles?: number;
  includeResponse?: boolean;
  filenameFormat?: string;
  directory?: string;
}

export class JsonCommandLogger implements HookModule {
  readonly name = "json-command-logger";
  readonly description = "Logs hook events as individual JSON files for detailed inspection";

  private commandsDir = "";
  private settings: JsonCommandLoggerSettings = {};

  async initialize(config: ModuleConfig): Promise<void> {
    this.settings = {
      maxFiles: 100,
      includeResponse: true,
      filenameFormat: "{timestamp}-{sessionId}-{hookEventName}-{toolName}.json",
      directory: ".chw-commands",
      ...config.settings,
    } as JsonCommandLoggerSettings;
  }

  async process(input: HookInput, _config: ModuleConfig): Promise<ModuleResult> {
    try {
      // Set up commands directory based on input.cwd
      this.commandsDir = join(input.cwd, this.settings.directory || ".chw-commands");
      this.ensureCommandsDirectory();

      // Generate filename
      const filename = this.generateFilename(input);
      const filepath = join(this.commandsDir, filename);

      // Prepare JSON data
      const jsonData = this.prepareJsonData(input);

      // Write JSON file
      writeFileSync(filepath, JSON.stringify(jsonData, null, 2), "utf-8");

      // Clean up old files if needed
      this.cleanupOldFiles();

      return {
        success: true,
        metadata: {
          filepath,
          filename,
          size: JSON.stringify(jsonData).length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write JSON command log: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private ensureCommandsDirectory(): void {
    if (!existsSync(this.commandsDir)) {
      mkdirSync(this.commandsDir, { recursive: true });
    }
  }

  private generateFilename(input: HookInput): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sessionId = input.session_id.slice(0, 8); // First 8 chars for brevity
    const toolName = "tool_name" in input ? input.tool_name : input.hook_event_name;
    const eventType = input.hook_event_name;

    const format =
      this.settings.filenameFormat || "{timestamp}-{sessionId}-{hookEventName}-{toolName}.json";

    return format
      .replace("{timestamp}", timestamp)
      .replace("{sessionId}", sessionId)
      .replace("{toolName}", toolName)
      .replace("{hookEventName}", eventType)
      .replace("{eventType}", eventType) // Keep for backward compatibility
      .replace(/[^a-zA-Z0-9\-_.]/g, "_"); // Sanitize filename
  }

  private prepareJsonData(input: HookInput): Record<string, unknown> {
    const baseData: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      hook_event_name: input.hook_event_name,
      session_id: input.session_id,
      transcript_path: input.transcript_path,
      cwd: input.cwd,
    };

    // Add tool-specific data
    if ("tool_name" in input) {
      baseData.tool_name = input.tool_name;
      baseData.tool_input = input.tool_input;
    }

    // Add tool response for PostToolUse events if enabled
    if (
      input.hook_event_name === "PostToolUse" &&
      this.settings.includeResponse &&
      "tool_response" in input
    ) {
      baseData.tool_response = input.tool_response;
    }

    // Add other event-specific data
    if (input.hook_event_name === "UserPromptSubmit" && "prompt" in input) {
      baseData.prompt = input.prompt;
    }

    if (input.hook_event_name === "Notification" && "message" in input) {
      baseData.message = input.message;
    }

    if (input.hook_event_name === "PreCompact" && "trigger" in input) {
      baseData.trigger = input.trigger;
      baseData.custom_instructions = input.custom_instructions;
    }

    if (input.hook_event_name === "SessionStart" && "source" in input) {
      baseData.source = input.source;
    }

    if ("stop_hook_active" in input) {
      baseData.stop_hook_active = input.stop_hook_active;
    }

    return baseData;
  }

  private cleanupOldFiles(): void {
    try {
      const maxFiles = this.settings.maxFiles || 100;

      if (!existsSync(this.commandsDir)) {
        return;
      }

      const files = readdirSync(this.commandsDir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => ({
          name: file,
          path: join(this.commandsDir, file),
          mtime: statSync(join(this.commandsDir, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Remove excess files
      if (files.length > maxFiles) {
        const filesToDelete = files.slice(maxFiles);
        for (const file of filesToDelete) {
          try {
            unlinkSync(file.path);
          } catch {
            // Ignore errors when deleting old files
          }
        }
      }
    } catch {
      // Ignore cleanup errors to prevent breaking the main functionality
    }
  }
}
