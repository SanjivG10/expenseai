import { Request, Response, NextFunction } from 'express';
import env from '../config/env';

// Interface to extend Response with original send method
interface ResponseWithOriginalSend extends Response {
  originalSend?: any;
}

// Enhanced request/response logging middleware
export const responseLogger = (req: Request, res: ResponseWithOriginalSend, next: NextFunction) => {
  const startTime = Date.now();

  // Log incoming request
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    headers: {
      'content-type': req.get('content-type'),
      authorization: req.get('authorization') ? '[REDACTED]' : undefined,
      'user-agent': req.get('user-agent'),
    },
    body: req.body && Object.keys(req.body).length > 0 ? sanitizeRequestBody(req.body) : undefined,
    ip: req.ip,
  };

  console.log('📨 [REQUEST]', JSON.stringify(requestLog, null, 2));

  // Store original send method
  res.originalSend = res.send;

  // Override res.send to capture response
  res.send = function (body: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Parse response body if it's a string
    let responseBody;
    try {
      responseBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch {
      responseBody = body;
    }

    const responseLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      headers: {
        'content-type': res.get('content-type'),
        'content-length': res.get('content-length'),
      },
      body: sanitizeResponseBody(responseBody),
      success: res.statusCode >= 200 && res.statusCode < 300,
    };

    // Use different log levels based on status code
    if (res.statusCode >= 500) {
      console.error('❌ [RESPONSE - ERROR]', JSON.stringify(responseLog, null, 2));
    } else if (res.statusCode >= 400) {
      console.warn('⚠️ [RESPONSE - CLIENT ERROR]', JSON.stringify(responseLog, null, 2));
    } else {
      console.log('✅ [RESPONSE - SUCCESS]', JSON.stringify(responseLog, null, 2));
    }

    // Log validation errors with extra detail
    if (res.statusCode === 400 && responseBody?.error) {
      console.error('🔍 [VALIDATION ERROR DETAIL]', {
        url: req.originalUrl,
        method: req.method,
        requestBody: sanitizeRequestBody(req.body),
        validationError: responseBody.error,
        message: responseBody.message,
      });
    }

    // Call original send method
    return res.originalSend.call(this, body);
  };

  next();
};

// Sanitize request body to remove sensitive information
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };

  // Remove or mask sensitive fields
  const sensitiveFields = ['password', 'token', 'refreshToken', 'otp'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Truncate very large base64 images in logs
  if (
    sanitized.image &&
    typeof sanitized.image === 'string' &&
    sanitized.image.startsWith('data:image')
  ) {
    sanitized.image = `[BASE64_IMAGE - ${sanitized.image.length} chars]`;
  }

  if (
    sanitized.receipt_image &&
    typeof sanitized.receipt_image === 'string' &&
    sanitized.receipt_image.startsWith('data:image')
  ) {
    sanitized.receipt_image = `[BASE64_IMAGE - ${sanitized.receipt_image.length} chars]`;
  }

  return sanitized;
}

// Sanitize response body for logging
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };

  // Remove sensitive fields from response
  if (sanitized.data) {
    const sensitiveFields = ['access_token', 'refresh_token', 'session'];
    for (const field of sensitiveFields) {
      if (sanitized.data[field]) {
        sanitized.data[field] = '[REDACTED]';
      }
    }
  }

  return sanitized;
}

// Simplified request logger for development
export const simpleRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

// Export the appropriate logger based on environment
export const requestResponseLogger =
  env.NODE_ENV === 'development' ? responseLogger : simpleRequestLogger;
