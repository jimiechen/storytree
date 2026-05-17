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
import type { ActionName, IPCRequest, IPCResponse, IPCErrorResponse } from "./ipc-protocol";
/** Request handler function signature */
export type ActionHandler<T = unknown> = (request: IPCRequest, context: RouterContext) => Promise<T> | T;
/** Middleware function (executed before handler) */
export type BeforeMiddleware = (request: IPCRequest, context: RouterContext) => Promise<IPCRequest | null> | IPCRequest | null;
/** Return null to abort request */
/** Middleware function (executed after handler) */
export type AfterMiddleware = (response: IPCResponse, request: IPCRequest, context: RouterContext) => Promise<IPCResponse> | IPCResponse;
/** Error handler for uncaught exceptions */
export type ErrorHandler = (error: Error, request: IPCRequest, context: RouterContext) => Promise<IPCErrorResponse> | IPCErrorResponse;
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
export declare enum RouterEvent {
    REQUEST_RECEIVED = "request:received",
    ROUTE_MATCHED = "route:matched",
    HANDLER_START = "handler:start",
    HANDLER_COMPLETE = "handler:complete",
    HANDLER_ERROR = "handler:error",
    RESPONSE_SENT = "response:sent",
    MIDDLEWARE_ABORT = "middleware:abort"
}
/** Event listener */
export type RouterEventListener = (data: {
    event: RouterEvent;
    request?: IPCRequest;
    response?: IPCResponse;
    error?: Error;
    durationMs?: number;
}) => void;
export declare class MessageRouter {
    private config;
    private handlers;
    private beforeMiddlewares;
    private afterMiddlewares;
    private errorHandler;
    private listeners;
    private activeRequests;
    constructor(config?: MessageRouterConfig);
    /**
     * Register an action handler
     *
     * @param action - The action name to handle
     * @param handler - The handler function
     * @param options - Optional route configuration
     * @returns this (for chaining)
     */
    on<T = unknown>(action: ActionName, handler: ActionHandler<T>, options?: RouteOptions): this;
    /**
     * Register multiple actions at once
     *
     * @param routes - Object mapping action names to handlers
     * @returns this (for chaining)
     */
    registerRoutes(routes: Record<ActionName, ActionHandler | {
        handler: ActionHandler;
        options?: RouteOptions;
    }>): this;
    /**
     * Remove a registered handler
     */
    off(action: ActionName): boolean;
    /**
     * Check if an action has a registered handler
     */
    hasHandler(action: ActionName): boolean;
    /**
     * Get list of all registered actions
     */
    getRegisteredActions(): ActionName[];
    /**
     * Add a before-middleware (executed before handler)
     */
    useBefore(middleware: BeforeMiddleware): this;
    /**
     * Add an after-middleware (executed after handler)
     */
    useAfter(middleware: AfterMiddleware): this;
    /**
     * Set custom error handler
     */
    onError(handler: ErrorHandler): this;
    /**
     * Subscribe to router events
     */
    onEvent(listener: RouterEventListener): () => void;
    /**
     * Process an incoming IPC message/request
     *
     * This is the main entry point called by the Extension's
     * webview message listener.
     *
     * @param rawMessage - The raw message from webview
     * @returns Promise resolving to the response
     */
    processMessage(rawMessage: unknown): Promise<IPCResponse>;
    /**
     * Process a parsed request through the full pipeline
     */
    private processRequest;
    private handleNotification;
    private parseRequest;
    private isNotification;
    private applyAfterMiddlewares;
    private defaultErrorHandler;
    private emit;
    private log;
    /**
     * Dispose router and cleanup resources
     */
    dispose(): void;
    /**
     * Get router statistics
     */
    getStats(): {
        registeredHandlers: number;
        beforeMiddlewares: number;
        afterMiddlewares: number;
        activeListeners: number;
        activeRequests: number;
    };
}
//# sourceMappingURL=message-router.d.ts.map