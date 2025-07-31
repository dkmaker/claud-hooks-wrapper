# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Hooks Wrapper (CHW) is a TypeScript CLI tool that provides a simplified wrapper layer for Claude Code hooks. It allows users to configure hooks via a simple YAML file (.chw-config.yaml) instead of directly editing Claude's settings.json files. The project is designed to be installed via npx and provide modular hook functionality.

## Development Commands

**Build and Test:**
- `pnpm build` - Compiles TypeScript to JavaScript in dist/ (required before testing)
- `pnpm dev` - Runs TypeScript compiler in watch mode for development
- `node dist/index.js --help` - Test the built CLI locally
- `node dist/index.js --version` - Verify version output

**Code Quality:**
- `pnpm lint` - Runs BiomeJS linter checks (must pass before commits)
- `pnpm format` - Auto-formats code using BiomeJS
- `pnpm lint --fix --unsafe` - Auto-fix linting issues

**Package Management:**
- Uses **pnpm** (version 10.13.1+) - always use pnpm instead of npm
- `pnpm install` - Install dependencies

## Architecture Overview

CHW follows a modular architecture where hook functionality is provided by pluggable modules:

**Core Components:**
1. **CLI Layer** (`src/index.ts`) - Commander.js-based CLI with install/validate/init/status commands
2. **Type System** (`src/types/`) - Complete TypeScript definitions for Claude Code hook events and CHW configuration
3. **Logging System** (`src/logging/logger.ts`) - File-based logging to `chw-logs/` with rotation and configurable levels
4. **Configuration System** - YAML-based configuration via `.chw-config.yaml`

**Hook Event Flow:**
1. Claude Code triggers hook event (PreToolUse, PostToolUse, etc.)
2. CHW receives JSON input via stdin containing session_id, tool_name, tool_input/response
3. CHW routes to enabled modules based on .chw-config.yaml configuration
4. Modules process the hook and return JSON output for Claude Code

**Module System:**
- Modules are enabled/disabled via `.chw-config.yaml`
- Each module can have custom settings
- Hook events are mapped to modules via matchers (e.g., "Write|Edit", "*")
- Currently implemented: basic-logger module

## Key Implementation Details

**TypeScript Configuration:**
- Uses ES modules (`"type": "module"`) with ESNext target
- Strict TypeScript settings with bundler module resolution
- BiomeJS for linting/formatting instead of ESLint/Prettier

**Hook Types System:**
- Complete type definitions for all 8 Claude Code hook events
- Union types for HookInput and HookOutput with proper discriminated unions
- Permission decisions (allow/deny/ask) and block decisions for flow control

**Logging Architecture:**
- Automatic log rotation by date and size (configurable maxFiles/maxSize)
- Supports both JSON and text formats
- Writes to project-root/chw-logs/ directory
- Singleton pattern with getLogger() for global access

**CLI Design:**
- Detects stdin vs TTY to differentiate between hook execution and CLI usage
- Commander.js provides structured command handling
- Reads package.json dynamically for version info