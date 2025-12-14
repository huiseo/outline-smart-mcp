/**
 * Configuration Module
 *
 * Zod-based environment variable validation and type-safe configuration
 */

import { z } from 'zod';

// Environment variable schema definition
const envSchema = z.object({
  OUTLINE_URL: z
    .string()
    .url()
    .default('https://app.getoutline.com'),
  OUTLINE_API_TOKEN: z
    .string()
    .min(1, 'OUTLINE_API_TOKEN is required'),
  READ_ONLY: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  DISABLE_DELETE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  MAX_RETRIES: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(10))
    .default('3'),
  RETRY_DELAY_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(100).max(30000))
    .default('1000'),
  // Smart Features
  ENABLE_SMART_FEATURES: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  OPENAI_API_KEY: z.string().optional(),
});

// Extract config type
export type Config = z.infer<typeof envSchema>;

/**
 * Parse environment variables and create config
 */
export function createConfig(env: Record<string, string | undefined> = process.env): Config {
  return envSchema.parse(env);
}

/**
 * Validate environment variables (safe parsing)
 */
export function validateConfig(env: Record<string, string | undefined> = process.env) {
  return envSchema.safeParse(env);
}

/**
 * Format config error
 */
export function formatConfigError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
}
