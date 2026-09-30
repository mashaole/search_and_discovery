import type { Logger } from "../ports/index.js";

export class ConsoleLogger implements Logger {
  info(message: string, fields?: Record<string, unknown>): void {
    if (fields) {
      console.log(message, fields);
      return;
    }
    console.log(message);
  }

  error(message: string, fields?: Record<string, unknown>): void {
    if (fields) {
      console.error(message, fields);
      return;
    }
    console.error(message);
  }
}
