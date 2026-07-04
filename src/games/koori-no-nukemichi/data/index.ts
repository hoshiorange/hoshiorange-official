/**
 * データ層の公開エントリ＋アダプタ選択ファクトリ。
 *
 * createStageRepository() は環境に応じて実装を選ぶ:
 *   - NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY が揃っていれば SupabaseStageRepository
 *   - 未設定なら LocalStageRepository（シード / インメモリ）
 * これにより env 無しでも全機能がビルド & 動作する。
 *
 * 注: SupabaseStageRepository は supabase-js をトップレベル import せず、メソッド内の
 *     動的 import に遅延させているため、env 無しの環境では supabase-js がロードされない。
 */

import { LocalStageRepository } from './localRepository';
import type { StageRepository } from './repository';
import { hasSupabaseEnv } from './supabaseClient';
import { SupabaseStageRepository } from './supabaseRepository';

export * from './repository';
export { LocalStageRepository } from './localRepository';
export { SupabaseStageRepository } from './supabaseRepository';
export { hasSupabaseEnv, getSupabaseClient } from './supabaseClient';
export { seedStages, seedWorlds } from './seed';

let cached: StageRepository | null = null;

/**
 * 既定のステージリポジトリを返す（シングルトン）。
 * env があれば Supabase、無ければローカル（シード）を使う。
 */
export function createStageRepository(): StageRepository {
  if (cached) return cached;
  cached = hasSupabaseEnv() ? new SupabaseStageRepository() : new LocalStageRepository();
  return cached;
}
