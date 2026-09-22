import pino from "pino";

// Create a Pino logger instance for structured JSON logging.
// In production, this outputs highly performant JSON ideal for Datadog/ELK.
export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  formatters: {
    level: (label) => {
      return { level: label }; // Output string level instead of number
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
