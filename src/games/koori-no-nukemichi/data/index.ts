/**
 * データ層の公開エントリ＋アダプタ選択ファクトリ。
 *
 * createStageRepository() は環境に応じて実装を選ぶ:
 *   - NEXT_PUBLIC_SUPABASE_URL が設定されていれば（M1 で）Supabase アダプタ
 *   - 未設定なら LocalStageRepository（シード / インメモリ）
 * これにより env 無しでも全機能がビルド & 動作する。
 */

import { LocalStageRepository } from './localRepository';
import type { StageRepository } from './repository';

export * from './repository';
export { LocalStageRepository } from './localRepository';
export { seedStages, seedWorlds } from './seed';

let cached: StageRepository | null = null;

/**
 * 既定のステージリポジトリを返す（シングルトン）。
 * M1 で Supabase アダプタを追加したら、ここで env を見て分岐する:
 *
 *   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 *   if (url) return new SupabaseStageRepository(url, ...);
 */
export function createStageRepository(): StageRepository {
  if (cached) return cached;
  // 現状は常にローカル。env の有無に関わらず動作する。
  cached = new LocalStageRepository();
  return cached;
}
