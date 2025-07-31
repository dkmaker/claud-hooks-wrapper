/**
 * Claude Code hook event types and interfaces
 * Based on the official Claude Code hooks documentation
 */

export type HookEventName =
  | "PreToolUse"
  | "PostToolUse"
  | "Notification"
  | "UserPromptSubmit"
  | "Stop"
  | "SubagentStop"
  | "PreCompact"
  | "SessionStart";

export type PermissionDecision = "allow" | "deny" | "ask";
export type BlockDecision = "block" | undefined;

/**
 * Common fields present in all hook inputs
 */
export interface BaseHookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: HookEventName;
}

/**
 * PreToolUse hook input
 */
export interface PreToolUseInput extends BaseHookInput {
  hook_event_name: "PreToolUse";
  tool_name: string;
  tool_input: Record<string, unknown>;
}

/**
 * PostToolUse hook input
 */
export interface PostToolUseInput extends BaseHookInput {
  hook_event_name: "PostToolUse";
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: Record<string, unknown>;
}

/**
 * Notification hook input
 */
export interface NotificationInput extends BaseHookInput {
  hook_event_name: "Notification";
  message: string;
}

/**
 * UserPromptSubmit hook input
 */
export interface UserPromptSubmitInput extends BaseHookInput {
  hook_event_name: "UserPromptSubmit";
  prompt: string;
}

/**
 * Stop hook input
 */
export interface StopInput extends BaseHookInput {
  hook_event_name: "Stop";
  stop_hook_active: boolean;
}

/**
 * SubagentStop hook input
 */
export interface SubagentStopInput extends BaseHookInput {
  hook_event_name: "SubagentStop";
  stop_hook_active: boolean;
}

/**
 * PreCompact hook input
 */
export interface PreCompactInput extends BaseHookInput {
  hook_event_name: "PreCompact";
  trigger: "manual" | "auto";
  custom_instructions: string;
}

/**
 * SessionStart hook input
 */
export interface SessionStartInput extends BaseHookInput {
  hook_event_name: "SessionStart";
  source: "startup" | "resume" | "clear";
}

/**
 * Union type for all hook inputs
 */
export type HookInput =
  | PreToolUseInput
  | PostToolUseInput
  | NotificationInput
  | UserPromptSubmitInput
  | StopInput
  | SubagentStopInput
  | PreCompactInput
  | SessionStartInput;

/**
 * Common JSON output fields
 */
export interface BaseHookOutput {
  continue?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
}

/**
 * PreToolUse specific output
 */
export interface PreToolUseOutput extends BaseHookOutput {
  hookSpecificOutput?: {
    hookEventName: "PreToolUse";
    permissionDecision: PermissionDecision;
    permissionDecisionReason: string;
  };
  // Deprecated but still supported
  decision?: "approve" | "block";
  reason?: string;
}

/**
 * PostToolUse specific output
 */
export interface PostToolUseOutput extends BaseHookOutput {
  decision?: BlockDecision;
  reason?: string;
}

/**
 * UserPromptSubmit specific output
 */
export interface UserPromptSubmitOutput extends BaseHookOutput {
  decision?: BlockDecision;
  reason?: string;
  hookSpecificOutput?: {
    hookEventName: "UserPromptSubmit";
    additionalContext: string;
  };
}

/**
 * Stop/SubagentStop specific output
 */
export interface StopOutput extends BaseHookOutput {
  decision?: BlockDecision;
  reason?: string;
}

/**
 * SessionStart specific output
 */
export interface SessionStartOutput extends BaseHookOutput {
  hookSpecificOutput?: {
    hookEventName: "SessionStart";
    additionalContext: string;
  };
}

/**
 * Union type for all hook outputs
 */
export type HookOutput =
  | PreToolUseOutput
  | PostToolUseOutput
  | UserPromptSubmitOutput
  | StopOutput
  | SessionStartOutput
  | BaseHookOutput;
