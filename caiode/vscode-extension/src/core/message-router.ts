/**
 * Message Router - JSON-RPC Request Handler
 *
 * Core routing engine for the VS Code Extension host.
 * Receives IPC messages from Webview, parses JSON-RPC requests,
 * routes to appropriate handlers, and returns responses.
 *
 * Features:
 * - Action-based routing with pattern matching
 * - Middleware pipeline (before/after hooks)
 * - Error handling with standardized error codes
 * - Request logging and metrics
 * - Handler lifecycle management
 */

import type {
  ActionName,
  IPCRequest,
  IPCResponse,
  IPCSuccessResponse,
  IPCErrorResponse,
  IPCNotification,
} from "../types/ipc-protocol";
import {
  ErrorCode,
  createSuccessResponse,
  createErrorResponse,
} from "../types/ipc-protocol";

// ============================================================
// Type Definitions
// ============================================================

/** Request handler function signature */
export type ActionHandler<T = unknown> = (
  request: IPCRequest,
  context: RouterContext
) => Promise<T> | T;

/** Middleware function (executed before handler) */
export type BeforeMiddleware = (
  request: IPCRequest,
  context: RouterContext
) => Promise<IPCRequest | null> | IPCRequest | null;
/** Return null to abort request */

/** Middleware function (executed after handler) */
export type AfterMiddleware = (
  response: IPCResponse,
  request: IPCRequest,
  context: RouterContext
) => Promise<IPCResponse> | IPCResponse;

/** Error handler for uncaught exceptions */
export type ErrorHandler = (
  error: Error,
  request: IPCRequest,
  context: RouterContext
) => Promise<IPCErrorResponse> | IPCErrorResponse;

/** Router configuration */
export interface MessageRouterConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Default timeout for handlers (ms) */
  defaultTimeout?: number;
  /** Enable strict mode (reject unknown actions) */
  strictMode?: boolean;
}

/** Context passed to handlers */
export interface RouterContext {
  /** Unique request ID */
  requestId: string;
  /** Timestamp when request was received */
  receivedAt: number;
  /** Custom data injected by middleware */
  metadata: Record<string, unknown>;
}

/** Route registration options */
export interface RouteOptions {
  /** Description for documentation/logging */
  description?: string;
  /** Expected payload schema (for validation) */
  schema?: Record<string, unknown>;
  /** Custom timeout override (ms) */
  timeout?: number;
}

/** Router event types */
export enum RouterEvent {
  REQUEST_RECEIVED = "request:received",
  ROUTE_MATCHED = "route:matched",
  HANDLER_START = "handler:start",
  HANDLER_COMPLETE = "handler:complete",
  HANDLER_ERROR = "handler:error",
  RESPONSE_SENT = "response:sent",
  MIDDLEWARE_ABORT = "middleware:abort",
}

/** Event listener */
export type RouterEventListener = (data: {
  event: RouterEvent;
  request?: IPCRequest;
  response?: IPCResponse;
  error?: Error;
  durationMs?: number;
}) => void;

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: Required<MessageRouterConfig> = {
  debug: false,
  defaultTimeout: 30000,
  strictMode: false,
};

// ============================================================
// MessageRouter Class
// ============================================================

export class MessageRouter {
  private config: Required<MessageRouterConfig>;
  private handlers: Map<ActionName, { handler: ActionHandler; options: RouteOptions }> =
    new Map();
  private beforeMiddlewares: BeforeMiddleware[] = [];
  private afterMiddlewares: AfterMiddleware[] = [];
  private errorHandler: ErrorHandler;
  private listeners: Set<RouterEventListener> = new Set();
  private activeRequests: Map<string, AbortController> = new Map();

  constructor(config: MessageRouterConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errorHandler = this.defaultErrorHandler.bind(this);
    this.log("MessageRouter initialized", { config: this.config });
  }

  // ============================================================
  // Route Registration
  // ============================================================

  /**
   * Register an action handler
   *
   * @param action - The action name to handle
   * @param handler - The handler function
   * @param options - Optional route configuration
   * @returns this (for chaining)
   */
  on<T = unknown>(
    action: ActionName,
    handler: ActionHandler<T>,
    options?: RouteOptions
  ): this {
    if (this.handlers.has(action)) {
      this.log(`Overwriting existing handler for action: ${action}`);
    }

    this.handlers.set(action, { handler: handler as ActionHandler, options: options ?? {} });
    return this;
  }

  /**
   * Register multiple actions at once
   *
   * @param routes - Object mapping action names to handlers
   * @returns this (for chaining)
   */
  registerRoutes(
    routes: Record<ActionName, ActionHandler | { handler: ActionHandler; options?: RouteOptions }>
  ): this {
    for (const [action, value] of Object.entries(routes)) {
      if (typeof value === "function") {
        this.on(action, value);
      } else {
        this.on(action, value.handler, value.options);
      }
    }
    return this;
  }

  /**
   * Remove a registered handler
   */
  off(action: ActionName): boolean {
    return this.handlers.delete(action);
  }

  /**
   * Check if an action has a registered handler
   */
  hasHandler(action: ActionName): boolean {
    return this.handlers.has(action);
  }

  /**
   * Get list of all registered actions
   */
  getRegisteredActions(): ActionName[] {
    return Array.from(this.handlers.keys());
  }

  // ============================================================
  // Middleware Registration
  // ============================================================

  /**
   * Add a before-middleware (executed before handler)
   */
  useBefore(middleware: BeforeMiddleware): this {
    this.beforeMiddlewares.push(middleware);
    return this;
  }

  /**
   * Add an after-middleware (executed after handler)
   */
  useAfter(middleware: AfterMiddleware): this {
    this.afterMiddlewares.push(middleware);
    return this;
  }

  /**
   * Set custom error handler
   */
  onError(handler: ErrorHandler): this {
    this.errorHandler = handler;
    return this;
  }

  /**
   * Subscribe to router events
   */
  onEvent(listener: RouterEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ============================================================
  // Request Processing (Core Method)
  // ============================================================

  /**
   * Process an incoming IPC message/request
   *
   * This is the main entry point called by the Extension's
   * webview message listener.
   *
   * @param rawMessage - The raw message from webview
   * @returns Promise resolving to the response
   */
  async processMessage(rawMessage: unknown): Promise<IPCResponse> {
    const receivedAt = Date.now();

    try {
      const request = this.parseRequest(rawMessage);

      if (!request) {
        return createErrorResponse(null, ErrorCode.INVALID_REQUEST, "Invalid message format");
      }

      const context: RouterContext = {
        requestId: typeof request.id === "string" || typeof request.id === "number"
          ? `router-${request.id}`
          : `notif-${receivedAt}`,
        receivedAt,
        metadata: {},
      };

      this.emit({ event: RouterEvent.REQUEST_RECEIVED, request, durationMs: 0 });

      if (this.isNotification(request)) {
        await this.handleNotification(request as IPCNotification, context);
        return createSuccessResponse(null, null as unknown); // No response expected
      }

      const response = await this.processRequest(request, context);

      const durationMs = Date.now() - receivedAt;
      this.emit({ event: RouterEvent.RESPONSE_SENT, request, response, durationMs });

      return response;
    } catch (error) {
      this.log("Unhandled error in processMessage", { error: (error as Error).message });
      return createErrorResponse(
        null,
        ErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }

  /**
   * Process a parsed request through the full pipeline
   */
  private async processRequest(
    request: IPCRequest,
    context: RouterContext
  ): Promise<IPCResponse> {
    let currentRequest = request;

    // Phase 1: Before Middlewares
    for (const middleware of this.beforeMiddlewares) {
      const result = await middleware(currentRequest, context);
      if (result === null) {
        this.emit({
          event: RouterEvent.MIDDLEWARE_ABORT,
          request: currentRequest,
          durationMs: Date.now() - context.receivedAt,
        });
        return createErrorResponse(
          request.id,
          ErrorCode.INTERNAL_ERROR,
          "Request aborted by middleware"
        );
      }
      currentRequest = result;
    }

    // Phase 2: Route Matching
    const route = this.handlers.get(currentRequest.action);

    if (!route) {
      if (this.config.strictMode) {
        return createErrorResponse(
          request.id,
          ErrorCode.METHOD_NOT_FOUND,
          `Unknown action: ${currentRequest.action}`
        );
      }

      this.log(`No handler for action: ${currentRequest.action}`, { action: currentRequest.action });
      return createErrorResponse(
        request.id,
        ErrorCode.METHOD_NOT_FOUND,
        `Action not found: ${currentRequest.action}`
      );
    }

    this.emit({
      event: RouterEvent.ROUTE_MATCHED,
      request: currentRequest,
      durationMs: Date.now() - context.receivedAt,
    });

    // Phase 3: Execute Handler
    this.emit({
      event: RouterEvent.HANDLER_START,
      request: currentRequest,
      durationMs: Date.now() - context.receivedAt,
    });

    const startTime = Date.now();
    let result: unknown;
    let error: Error | undefined;

    try {
      result = await Promise.resolve(route.handler(currentRequest, context));
    } catch (err) {
      error = err as Error;
    }

    const handlerDurationMs = Date.now() - startTime;

    if (error) {
      this.emit({
        event: RouterEvent.HANDLER_ERROR,
        request: currentRequest,
        error,
        durationMs: handlerDurationMs,
      });

      const errorResponse = await this.errorHandler(error, currentRequest, context);
      return this.applyAfterMiddlewares(errorResponse, currentRequest, context);
    }

    this.emit({
      event: RouterEvent.HANDLER_COMPLETE,
      request: currentRequest,
      durationMs: handlerDurationMs,
    });

    // Phase 4: Create Response
    const successResponse = createSuccessResponse(request.id, result, {
      durationMs: handlerDurationMs,
    });

    // Phase 5: After Middlewares
    return this.applyAfterMiddlewares(successResponse, currentRequest, context);
  }

  // ============================================================
  // Notification Handling
  // ============================================================

  private async handleNotification(
    notification: IPCNotification,
    context: RouterContext
  ): Promise<void> {
    const route = this.handlers.get(notification.action);

    if (route) {
      try {
        await Promise.resolve(
          route.handler(notification as unknown as IPCRequest, context)
        );
      } catch (error) {
        this.log("Error in notification handler", {
          action: notification.action,
          error: (error as Error).message,
        });
      }
    } else {
      this.log("No handler for notification", { action: notification.action });
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private parseRequest(rawMessage: unknown): IPCRequest | null {
    if (!rawMessage || typeof rawMessage !== "object") {
      return null;
    }

    const msg = rawMessage as Record<string, unknown>;

    if (msg.jsonrpc !== "2.0" || !msg.action) {
      return null;
    }

    return msg as unknown as IPCRequest;
  }

  private isNotification(message: IPCRequest): boolean {
    return !("id" in message) || message.id === undefined || message.id === null;
  }

  private async applyAfterMiddlewares(
    response: IPCResponse,
    request: IPCRequest,
    context: RouterContext
  ): Promise<IPCResponse> {
    let currentResponse = response;

    for (const middleware of this.afterMiddlewares) {
      currentResponse = await Promise.resolve(middleware(currentResponse, request, context));
    }

    return currentResponse;
  }

  private defaultErrorHandler(
    error: Error,
    request: IPCRequest,
    _context: RouterContext
  ): IPCErrorResponse {
    this.log("Handler error", {
      action: request.action,
      error: error.message,
      stack: error.stack,
    });

    return createErrorResponse(
      request.id,
      ErrorCode.INTERNAL_ERROR,
      error.message || "Unknown error"
    );
  }

  private emit(data: {
    event: RouterEvent;
    request?: IPCRequest;
    response?: IPCResponse;
    error?: Error;
    durationMs?: number;
  }): void {
    if (this.config.debug) {
      this.log(`Event: ${data.event}`, {
        action: data.request?.action,
        durationMs: data.durationMs,
        error: data.error?.message,
      });
    }

    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error("[MessageRouter] Event listener error:", err);
      }
    }
  }

  private log(message: string, data?: Record<string, unknown>): void {
    if (this.config.debug) {
      console.log(`[MessageRouter] ${message}`, data ?? "");
    }
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  /**
   * Dispose router and cleanup resources
   */
  dispose(): void {
    this.handlers.clear();
    this.beforeMiddlewares = [];
    this.afterMiddlewares = [];
    this.listeners.clear();

    for (const [, controller] of this.activeRequests) {
      controller.abort();
    }
    this.activeRequests.clear();

    this.log("MessageRouter disposed");
  }

  /**
   * Get router statistics
   */
  getStats(): {
    registeredHandlers: number;
    beforeMiddlewares: number;
    afterMiddlewares: number;
    activeListeners: number;
    activeRequests: number;
  } {
    return {
      registeredHandlers: this.handlers.size,
      beforeMiddlewares: this.beforeMiddlewares.length,
      afterMiddlewares: this.afterMiddlewares.length,
      activeListeners: this.listeners.size,
      activeRequests: this.activeRequests.size,
    };
  }
}
