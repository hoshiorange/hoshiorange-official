/**
 * ステージ取得・保存のリポジトリ・インターフェース。
 *
 * 実体は環境に応じて差し替える:
 *   - LocalStageRepository … シード / インメモリ（env 不要）
 *   - SupabaseStageRepository … NEXT_PUBLIC_SUPABASE_URL 設定時
 * 呼び出し側（プレイヤー・エディタ）は常にこの IF にのみ依存する。
 *
 * 階層モデル（確定）: **2 段＝ world（＝章）→ stage**。中間の chapter 階層は持たない。
 * スキーマ: world / stage / admins の 3 テーブル（stage.world_id で章に紐づく）。
 */

import type { Direction, StageData } from '../core/types';

/** 章（world）。スキーマ world(id,title,"order",published,created_at,updated_at) に対応。 */
export interface World {
  id: string;
  title: string;
  order: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** ステージ一覧表示用の軽量サマリ（盤面データは含めない）。 */
export interface StageSummary {
  id: string;
  worldId: string;
  title: string;
  order: number;
  /** 公開済みか（編集一覧で下書き/公開を区別）。 */
  published: boolean;
}

/** 章の新規作成入力。 */
export interface WorldInput {
  title: string;
  order?: number;
  published?: boolean;
}

/** 章のメタ更新パッチ（指定したフィールドのみ更新）。 */
export interface WorldPatch {
  title?: string;
  order?: number;
  published?: boolean;
}

/** ステージ（下書き）の新規作成入力。published=false で作成される。 */
export interface CreateStageInput {
  worldId: string;
  title: string;
  width: number;
  height: number;
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  data: string;
  order?: number;
}

/**
 * ステージのメタ/盤面更新パッチ（指定したフィールドのみ更新）。
 * 公開後（published=true）は盤面系（width/height/startX/Y/goalX/Y/data）は
 * 実装側で無視され、メタ（title/order）のみ更新される（盤面ロック）。
 */
export interface StagePatch {
  title?: string;
  order?: number;
  width?: number;
  height?: number;
  startX?: number;
  startY?: number;
  goalX?: number;
  goalY?: number;
  data?: string;
}

export interface StageRepository {
  /* ---- 章（world） ---- */

  /** 章一覧。includeDrafts=false（既定）なら公開（published=true）のみ。並び順で返す。 */
  listWorlds(includeDrafts?: boolean): Promise<World[]>;
  /** 章を 1 件取得。存在しなければ null。 */
  getWorld(worldId: string): Promise<World | null>;
  /** 章を新規作成する（admin）。 */
  createWorld(input: WorldInput): Promise<World>;
  /** 章のメタを更新する（admin）。 */
  updateWorld(worldId: string, patch: WorldPatch): Promise<World>;
  /** 章を削除する（admin。配下ステージも削除）。 */
  deleteWorld(worldId: string): Promise<void>;

  /* ---- ステージ ---- */

  /** 指定章のステージ一覧。includeDrafts=false（既定）なら公開のみ。並び順で返す。 */
  listStages(worldId: string, includeDrafts?: boolean): Promise<StageSummary[]>;
  /** ステージ本体（盤面データ込み）を取得する。存在しなければ null。 */
  getStage(stageId: string): Promise<StageData | null>;
  /** 下書きステージを新規作成する（published=false）。 */
  createStage(input: CreateStageInput): Promise<StageData>;
  /**
   * ステージを更新する。
   * 公開後は盤面ロック（メタ＝title/order のみ反映。盤面系パッチは無視）。
   */
  updateStage(stageId: string, patch: StagePatch): Promise<StageData>;
  /**
   * ステージを公開する。作成者の実クリア手順（authorMoves）を保存し published=true にする
   * （マリオメーカー方式）。authorMoves が空なら公開不可（エラー）。
   */
  publishStage(stageId: string, authorMoves: Direction[]): Promise<StageData>;
  /** ステージを削除する（下書きのみ。公開済みは削除不可＝エラー）。 */
  deleteStage(stageId: string): Promise<void>;
  /** ステージを複製して新規下書きとして返す（公開済みからの作り直しに使う）。 */
  duplicateStage(stageId: string): Promise<StageData>;
}
