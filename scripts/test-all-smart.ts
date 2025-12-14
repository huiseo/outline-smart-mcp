#!/usr/bin/env npx tsx
/**
 * Complete Smart Features Test Script
 */

import { createConfig } from '../src/lib/config.js';
import { createAppContext } from '../src/lib/context.js';
import { createSmartHandlers } from '../src/lib/handlers/smart.js';
import { resetBrain } from '../src/lib/brain/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env loading
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
process.env.ENABLE_SMART_FEATURES = 'true';

async function main() {
  console.log('🧪 Complete Smart Features Test\n');

  const config = createConfig(process.env);
  const ctx = createAppContext(config);
  const handlers = createSmartHandlers(ctx);

  console.log(`📡 Wiki: ${config.OUTLINE_URL}\n`);

  try {
    // 1. Smart Status (초기)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 1. smart_status (초기 상태)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const status1 = await handlers.smart_status();
    console.log(JSON.stringify(status1, null, 2));
    console.log();

    // 2. Sync Knowledge (이미 동기화됨)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📚 2. sync_knowledge (문서 동기화)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    // 이미 동기화된 경우 스킵
    if (status1.indexedChunks > 100) {
      console.log(`이미 ${status1.indexedChunks}개 청크가 인덱싱되어 있습니다. 스킵합니다.`);
    } else {
      const syncResult = await handlers.sync_knowledge({});
      console.log(JSON.stringify(syncResult, null, 2));
    }
    console.log();

    // 3. Ask Wiki - 다양한 질문 테스트
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❓ 3. ask_wiki (RAG 질문 답변)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const questions = [
      'VectorDB에 대해 설명해줘',
      '회의록은 어디서 볼 수 있어?',
      '신규 입사자 가이드가 있어?',
    ];

    for (const q of questions) {
      console.log(`\n💬 Q: ${q}`);
      const answer = await handlers.ask_wiki({ question: q });
      console.log(`📝 A: ${answer.answer?.substring(0, 500)}...`);
      console.log(`📎 Sources: ${answer.sources?.map((s: {title: string}) => s.title).join(', ')}`);
    }
    console.log();

    // 4. Summarize Document - 첫 번째 문서 요약
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 4. summarize_document (문서 요약)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 먼저 문서 목록 가져오기
    const { data: docs } = await ctx.apiCall(() =>
      ctx.apiClient.post<Array<{id: string; title: string}>>('/documents.list', { limit: 5 })
    );

    if (docs && docs.length > 0) {
      const doc = docs[0];
      console.log(`문서: ${doc.title} (${doc.id})`);
      const summary = await handlers.summarize_document({ documentId: doc.id });
      console.log('요약:', summary.summary || summary.error);
    }
    console.log();

    // 5. Suggest Tags
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏷️  5. suggest_tags (태그 추천)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (docs && docs.length > 0) {
      const doc = docs[0];
      console.log(`문서: ${doc.title}`);
      const tags = await handlers.suggest_tags({ documentId: doc.id });
      console.log('추천 태그:', tags.suggestedTags || tags.error);
    }
    console.log();

    // 6. Find Related
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 6. find_related (연관 문서 찾기)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (docs && docs.length > 0) {
      const doc = docs[0];
      console.log(`기준 문서: ${doc.title}`);
      const related = await handlers.find_related({ documentId: doc.id, limit: 3 });
      if (related.related) {
        console.log('연관 문서:');
        for (const r of related.related) {
          console.log(`  - ${r.title}`);
        }
      } else {
        console.log(related.error);
      }
    }
    console.log();

    // 7. Generate Diagram
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 7. generate_diagram (다이어그램 생성)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const diagramDesc = '사용자가 로그인하면 토큰을 발급받고, 토큰으로 API를 호출하는 흐름';
    console.log(`설명: ${diagramDesc}`);
    const diagram = await handlers.generate_diagram({ description: diagramDesc });
    console.log('생성된 Mermaid:');
    console.log(diagram.diagram);
    console.log();

    // 8. Final Status
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 8. smart_status (최종 상태)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const status2 = await handlers.smart_status();
    console.log(JSON.stringify(status2, null, 2));

    console.log('\n✅ 모든 Smart 기능 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  } finally {
    resetBrain();
  }
}

main();
