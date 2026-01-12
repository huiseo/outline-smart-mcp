/**
 * Health Handlers
 *
 * Server health check and diagnostics
 */

import type { AppContext } from '../context.js';
import { filterToolsByAccess } from '../access-control.js';
import { allTools } from '../tools.js';

interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  version: string;
  timestamp: string;
  outline: {
    connected: boolean;
    url: string;
    latencyMs?: number;
    error?: string;
  };
  config: {
    readOnly: boolean;
    deleteDisabled: boolean;
    smartFeaturesEnabled: boolean;
  };
  tools: {
    total: number;
    available: number;
  };
  smartFeatures?: {
    enabled: boolean;
    indexedChunks?: number;
  };
}

export function createHealthHandlers({ apiClient, apiCall, config, brain }: AppContext) {
  return {
    /**
     * Check server health and connectivity
     */
    async health_check(): Promise<HealthStatus> {
      const startTime = Date.now();
      let outlineConnected = false;
      let outlineError: string | undefined;
      let latencyMs: number | undefined;

      // Test Outline API connectivity
      try {
        await apiCall(() => apiClient.post('/auth.info', {}));
        outlineConnected = true;
        latencyMs = Date.now() - startTime;
      } catch (error) {
        outlineError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Get smart features status
      let smartFeaturesStatus: { enabled: boolean; indexedChunks?: number } | undefined;
      if (config.ENABLE_SMART_FEATURES) {
        try {
          const stats = await brain.getStats();
          smartFeaturesStatus = {
            enabled: stats.enabled,
            indexedChunks: stats.chunks,
          };
        } catch {
          smartFeaturesStatus = { enabled: false };
        }
      }

      // Get available tools count
      const totalTools = allTools.length;
      const availableTools = filterToolsByAccess(allTools, config).length;

      const status: HealthStatus = {
        status: outlineConnected ? 'ok' : 'error',
        version: '3.1.0',
        timestamp: new Date().toISOString(),
        outline: {
          connected: outlineConnected,
          url: config.OUTLINE_URL,
          latencyMs,
          error: outlineError,
        },
        config: {
          readOnly: config.READ_ONLY,
          deleteDisabled: config.DISABLE_DELETE,
          smartFeaturesEnabled: config.ENABLE_SMART_FEATURES,
        },
        tools: {
          total: totalTools,
          available: availableTools,
        },
      };

      if (smartFeaturesStatus) {
        status.smartFeatures = smartFeaturesStatus;
      }

      // Set degraded status if smart features are enabled but not working
      if (config.ENABLE_SMART_FEATURES && !smartFeaturesStatus?.enabled) {
        status.status = outlineConnected ? 'degraded' : 'error';
      }

      return status;
    },
  };
}
