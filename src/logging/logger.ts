/**
 * Basic logging infrastructure for CHW
 * Writes logs to .chw-logs folder in the project root
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

export class Logger {
  private logsDir: string;
  private logFile: string;
  private level: LogLevel;
  private format: "json" | "text";
  private maxFiles: number;
  private maxSize: number; // in bytes

  constructor(
    projectRoot: string,
    level: LogLevel = "info",
    format: "json" | "text" = "text",
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024 // 10MB
  ) {
    this.logsDir = join(projectRoot, ".chw-logs");
    this.logFile = join(this.logsDir, `chw-${new Date().toISOString().split("T")[0]}.log`);
    this.level = level;
    this.format = format;
    this.maxFiles = maxFiles;
    this.maxSize = maxSize;

    this.ensureLogDirectory();
    this.rotateLogsIfNeeded();
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private rotateLogsIfNeeded(): void {
    try {
      // Check if current log file is too large
      if (existsSync(this.logFile)) {
        const stats = statSync(this.logFile);
        if (stats.size > this.maxSize) {
          // Create a new timestamped file
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const newLogFile = join(this.logsDir, `chw-${timestamp}.log`);
          this.logFile = newLogFile;
        }
      }

      // Clean up old log files
      const logFiles = readdirSync(this.logsDir)
        .filter((file) => file.startsWith("chw-") && file.endsWith(".log"))
        .map((file) => ({
          name: file,
          path: join(this.logsDir, file),
          mtime: statSync(join(this.logsDir, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Remove excess log files
      if (logFiles.length > this.maxFiles) {
        const filesToDelete = logFiles.slice(this.maxFiles);
        for (const file of filesToDelete) {
          try {
            unlinkSync(file.path);
          } catch (_error) {
            // Ignore errors when deleting old log files
          }
        }
      }
    } catch (_error) {
      // Ignore rotation errors to prevent breaking the main functionality
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.level];
  }

  private writeLog(entry: LogEntry): void {
    try {
      const logLine =
        this.format === "json"
          ? `${JSON.stringify(entry)}\n`
          : `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${
              entry.data ? ` ${JSON.stringify(entry.data)}` : ""
            }\n`;

      writeFileSync(this.logFile, logLine, { flag: "a" });
    } catch (error) {
      // Fail silently to prevent breaking the main functionality
      console.error("Failed to write to log file:", error);
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    this.writeLog(entry);
  }

  debug(message: string, data?: unknown): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: unknown): void {
    this.log("error", message, data);
  }
}

// Default logger instance
let defaultLogger: Logger | null = null;

export function getLogger(projectRoot?: string): Logger {
  if (!defaultLogger) {
    const root = projectRoot || process.cwd();
    defaultLogger = new Logger(root);
  }
  return defaultLogger;
}

export function setLogger(logger: Logger): void {
  defaultLogger = logger;
}
