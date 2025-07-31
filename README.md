# Claude Hooks Wrapper (CHW)

A TypeScript CLI tool that provides a simplified wrapper layer for Claude Code hooks with modular architecture and YAML-based configuration.

## Overview

Claude Hooks Wrapper (CHW) allows you to configure and manage [Claude Code hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) through a simple YAML configuration file instead of directly editing Claude's settings.json files. It provides a modular system where different hook functionalities can be enabled, disabled, and configured independently.

## Features

- 🎯 **Modular Architecture** - Pluggable modules for different hook functionalities
- 📄 **JSON Command Logger** - Saves individual JSON files for each hook event
- ⚙️ **YAML Configuration** - Simple `.chw-config.yaml` for configuration
- 📝 **File-based Logging** - Automatic log rotation in `.chw-logs/` directory
- 🛠️ **TypeScript CLI** - Commander.js-based CLI with multiple commands
- 🔒 **Type Safety** - Complete TypeScript definitions for Claude Code hook events

## Installation

Install globally via npx:

```bash
npx claude-hooks-wrapper init
```

Or install as dependency:

```bash
pnpm add claude-hooks-wrapper
# or
npm install claude-hooks-wrapper
```

## Quick Start

1. **Initialize configuration:**
   ```bash
   npx chw init
   ```

2. **Configure your hooks in `.chw-config.yaml`:**
   ```yaml
   modules:
     json-command-logger:
       enabled: true
       settings:
         maxFiles: 100
         includeResponse: true
   ```

3. **Install hooks into Claude Code:**
   ```bash
   npx chw install
   ```

4. **Validate configuration:**
   ```bash
   npx chw validate
   ```

## Configuration

The `.chw-config.yaml` file controls all CHW behavior:

```yaml
version: "1.0.0"

# Global logging configuration
logging:
  enabled: true
  level: info  # debug, info, warn, error
  format: text  # text or json
  maxFiles: 10
  maxSize: 10MB

# Module configuration
modules:
  # Basic logging module
  basic-logger:
    enabled: true
    settings:
      logLevel: info

  # JSON command logger - saves individual JSON files
  json-command-logger:
    enabled: true
    settings:
      maxFiles: 100
      includeResponse: true
      filenameFormat: "{timestamp}-{sessionId}-{hookEventName}-{toolName}.json"
      directory: ".chw-commands"

# Hook event mapping
hooks:
  PreToolUse:
    - matcher: "*"  # Match all tools
      modules: ["basic-logger", "json-command-logger"]
  
  PostToolUse:
    - matcher: "*"
      modules: ["basic-logger", "json-command-logger"]
```

## Available Modules

### JSON Command Logger

Saves each hook event as individual JSON files in `.chw-commands/` directory for detailed inspection.

**Features:**
- Individual JSON files for each tool usage
- Configurable filename format with placeholders
- Automatic file rotation and cleanup
- Includes tool inputs and responses

**Filename Placeholders:**
- `{timestamp}` - ISO timestamp
- `{sessionId}` - Claude session ID (first 8 chars)
- `{hookEventName}` - Hook event type (PreToolUse, PostToolUse, etc.)
- `{toolName}` - Claude tool name (Read, Write, Bash, etc.)

**Example Output:**
```json
{
  "timestamp": "2025-07-31T11:57:11.729Z",
  "hook_event_name": "PreToolUse",
  "session_id": "22348d05-ea9d-491a-8d5e-4a5de01574b3",
  "tool_name": "Read",
  "tool_input": {
    "file_path": "package.json",
    "limit": 5
  }
}
```

### Basic Logger

Traditional file-based logging to `.chw-logs/` with rotation.

**Features:**
- Timestamped log entries
- Configurable log levels
- Automatic log rotation
- JSON or text format options

## CLI Commands

### `chw init`
Initialize a new `.chw-config.yaml` file with default settings.

```bash
chw init [--force]
```

### `chw install`
Install CHW hooks into Claude Code configuration.

```bash
chw install [--global] [--project <path>]
```

### `chw validate`
Validate the `.chw-config.yaml` file for syntax and configuration errors.

```bash
chw validate [--file <path>]
```

### `chw status`
Show current CHW hook status and module information.

```bash
chw status
```

## Hook Events

CHW supports all Claude Code hook events:

- **PreToolUse** - Before tool execution
- **PostToolUse** - After tool execution  
- **UserPromptSubmit** - When user submits a prompt
- **Notification** - System notifications
- **Stop** - When stopping execution
- **SubagentStop** - When subagent stops
- **PreCompact** - Before conversation compacting
- **SessionStart** - At session start

## Development

### Requirements

- Node.js ≥ 22.0.0
- pnpm ≥ 10.13.1

### Setup

```bash
git clone https://github.com/your-username/claude-hooks-wrapper.git
cd claude-hooks-wrapper
pnpm install
```

### Build

```bash
pnpm build
```

### Development Mode

```bash
pnpm dev  # TypeScript watch mode
```

### Code Quality

```bash
pnpm lint      # Run BiomeJS linting
pnpm format    # Auto-format code
pnpm lint --fix --unsafe  # Auto-fix issues
```

## Project Structure

```
src/
├── modules/
│   ├── types.ts              # Module interfaces
│   ├── moduleRegistry.ts     # Module management
│   ├── jsonCommandLogger.ts  # JSON logger module
├── config/
│   └── loader.ts            # Configuration loading
├── logging/
│   └── logger.ts            # File-based logging
├── types/
│   ├── config.ts            # Configuration types
│   └── hooks.ts             # Claude Code hook types
└── index.ts                 # Main CLI entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality checks: `pnpm lint && pnpm build`
5. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Related Projects

- [Claude Code](https://claude.ai/code) - Official Claude CLI
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)

---

Built with ❤️ for the Claude Code community