/**
 * ステージ取得・保存のリポジトリ・インターフェース。
 *
 * 実体は環境に応じて差し替える:
 *   - LocalStageRepository … シード JSON / インメモリ（現状・env 不要）
 *   - SupabaseStageRepository … M1 で追加（NEXT_PUBLIC_SUPABASE_URL 設定時）
 * 呼び出し側（プレイヤー・エディタ）は常にこの IF にのみ依存する。
 */

import type { StageData } from '../core/types';

/** ワールド（章＝チャプターをまとめる最上位の進行単位）。 */
export interface WorldSummary {
  id: string;
  title: string;
  order: number;
  chapters: ChapterSummary[];
}

/** 章（ステージをまとめる単位）。章内はフリー選択、全クリアで次章解放。 */
export interface ChapterSummary {
  id: string;
  worldId: string;
  title: string;
  order: number;
}

/** ステージ一覧表示用の軽量サマリ（盤面データは含めない）。 */
export interface StageSummary {
  id: string;
  worldId: string;
  chapterId: string;
  title: string;
  order: number;
}

export interface StageRepository {
  /** ワールド（章ツリー込み）の一覧を並び順で返す。 */
  listWorlds(): Promise<WorldSummary[]>;
  /** 指定章のステージ一覧（サマリ）を並び順で返す。 */
  listStages(chapterId: string): Promise<StageSummary[]>;
  /** ステージ本体（盤面データ込み）を取得する。存在しなければ null。 */
  getStage(stageId: string): Promise<StageData | null>;
  /**
   * ステージを作成 / 更新する（エディタ用）。
   * ローカルアダプタではインメモリ更新。Supabase アダプタ（M1）では admins のみ許可。
   */
  upsertStage(stage: StageData): Promise<StageData>;
}
