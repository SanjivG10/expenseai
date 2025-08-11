// Enhanced logging utility for ExpenseAI backend

export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const baseLog = `[${timestamp}] ${level}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      return `${baseLog}\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    return baseLog;
  }

  static info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  static warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  static error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context));
  }

  static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  // Specific loggers for different types of events
  static apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`${method} ${url}`, { type: 'API_REQUEST', ...context });
  }

  static apiResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    
    if (level === 'WARN') {
      this.warn(message, { type: 'API_RESPONSE', statusCode, duration, ...context });
    } else {
      this.info(message, { type: 'API_RESPONSE', statusCode, duration, ...context });
    }
  }

  static validationError(endpoint: string, errors: any[], context?: LogContext): void {
    this.error(`Validation failed for ${endpoint}`, {
      type: 'VALIDATION_ERROR',
      validationErrors: errors,
      ...context
    });
  }

  static dbOperation(operation: string, table: string, success: boolean, context?: LogContext): void {
    const message = `DB ${operation} on ${table} - ${success ? 'SUCCESS' : 'FAILED'}`;
    
    if (success) {
      this.debug(message, { type: 'DB_OPERATION', operation, table, ...context });
    } else {
      this.error(message, { type: 'DB_OPERATION', operation, table, ...context });
    }
  }
}

export default Logger;