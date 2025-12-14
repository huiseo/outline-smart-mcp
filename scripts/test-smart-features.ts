#!/usr/bin/env npx tsx
/**
 * Smart Features Integration Test Script
 *
 * Usage:
 *   1. Set environment variables or create .env file
 *   2. Run: npx tsx scripts/test-smart-features.ts
 */

import { createConfig } from '../src/lib/config.js';
import { createAppContext } from '../src/lib/context.js';
import { createSmartHandlers } from '../src/lib/handlers/smart.js';
import { resetBrain } from '../src/lib/brain/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env loading (no dotenv dependency needed)
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnvFile();

async function main() {
  console.log('🧪 Smart Features Integration Test\n');

  // Check environment
  const requiredEnv = ['OUTLINE_URL', 'OUTLINE_API_TOKEN', 'OPENAI_API_KEY'];
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.error('\nPlease create a .env file with:');
    console.error('  OUTLINE_URL=https://your-outline-instance.com');
    console.error('  OUTLINE_API_TOKEN=ol_api_...');
    console.error('  OPENAI_API_KEY=sk-...');
    console.error('  ENABLE_SMART_FEATURES=true');
    process.exit(1);
  }

  // Force enable smart features
  process.env.ENABLE_SMART_FEATURES = 'true';

  // Initialize
  const config = createConfig(process.env);
  const ctx = createAppContext(config);
  const handlers = createSmartHandlers(ctx);

  console.log(`📡 Connected to: ${config.OUTLINE_URL}`);
  console.log(`🤖 Smart features: ${config.ENABLE_SMART_FEATURES ? 'Enabled' : 'Disabled'}\n`);

  try {
    // Test 1: Smart Status
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test 1: smart_status');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const status = await handlers.smart_status();
    console.log('Result:', JSON.stringify(status, null, 2));
    console.log();

    // Test 2: Sync Knowledge
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 Test 2: sync_knowledge');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const syncResult = await handlers.sync_knowledge({});
    console.log('Result:', JSON.stringify(syncResult, null, 2));
    console.log();

    // Test 3: Ask Wiki
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❓ Test 3: ask_wiki');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const question = '이 위키에는 어떤 내용이 있나요?';
    console.log(`Question: ${question}`);
    const askResult = await handlers.ask_wiki({ question });
    console.log('Result:', JSON.stringify(askResult, null, 2));
    console.log();

    // Test 4: Smart Status after sync
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test 4: smart_status (after sync)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const statusAfter = await handlers.smart_status();
    console.log('Result:', JSON.stringify(statusAfter, null, 2));
    console.log();

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    resetBrain();
  }
}

main();
