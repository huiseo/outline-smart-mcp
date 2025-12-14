/**
 * Handler Types
 *
 * Handler related type definitions
 */

/** API caller wrapper function type */
export type ApiCaller = <T>(fn: () => Promise<T>) => Promise<T>;

/** Tool handler function type */
export type ToolHandler = (args: unknown) => Promise<unknown>;

/** Tool handlers map */
export type ToolHandlers = Record<string, ToolHandler>;
