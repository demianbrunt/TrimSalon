import { ErrorHandler, Injectable, isDevMode } from '@angular/core';

/**
 * Global Error Handler
 *
 * Catches all unhandled errors in the application.
 * - In development: logs full error to console
 * - In production: logs minimal info, could be extended to send to error tracking service
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    // Extract error details
    const errorMessage = this.extractErrorMessage(error);
    const stack = error instanceof Error ? error.stack : undefined;

    if (isDevMode()) {
      // Development: full error logging
      console.error('=== UNHANDLED ERROR ===');
      console.error('Message:', errorMessage);
      if (stack) {
        console.error('Stack:', stack);
      }
      console.error('Full error:', error);
    } else {
      // Production: minimal logging
      // In a real app, you would send this to an error tracking service like Sentry
      console.error(`Error: ${errorMessage}`);

      // TODO: Send to error tracking service
      // this.sendToErrorTracking(errorMessage, stack);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Unknown error occurred';
  }
}
