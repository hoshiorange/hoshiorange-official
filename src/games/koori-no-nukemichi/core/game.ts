/**
 * ゲーム状態の管理（手数・操作履歴・アンドゥ・リセット）。
 * 描画から完全に独立。Pixi プレイヤーやテストはこのエンジンを介して操作する。
 */

import { boardFromStage, goalOf, startOf } from './board';
import { computeSlide, type SlideResult } from './slide';
import { type Board, type Direction, type StageData, type Vec2 } from './types';

/** 1 手分のスナップショット（アンドゥ用の履歴エントリ）。 */
interface HistoryEntry {
  pos: Vec2;
  moveCount: number;
  cleared: boolean;
  /** この状態に至った手（リセット直後＝初期状態のみ null）。 */
  dir: Direction | null;
}

/** move() の結果。アニメ用の経路と判定結果を呼び出し側へ渡す。 */
export interface MoveOutcome extends SlideResult {
  from: Vec2;
  dir: Direction;
}

export class GameEngine {
  readonly stage: StageData;
  readonly board: Board;
  readonly start: Vec2;
  readonly goal: Vec2;

  private pos: Vec2;
  private moves: number;
  private clearedFlag: boolean;
  /** 実際に動いた手の方向列（将来のランキング検証用＝解の再生に使える）。 */
  private dirHistory: Direction[];
  /** アンドゥ用の状態スタック。 */
  private undoStack: HistoryEntry[];

  constructor(stage: StageData) {
    this.stage = stage;
    this.board = boardFromStage(stage);
    this.start = startOf(stage);
    this.goal = goalOf(stage);

    this.pos = { ...this.start };
    this.moves = 0;
    this.clearedFlag = false;
    this.dirHistory = [];
    this.undoStack = [];
  }

  /** 現在位置（コピーを返す）。 */
  get position(): Vec2 {
    return { ...this.pos };
  }

  /** 手数（実際に動いた回数のみカウント。動けなかった入力は数えない）。 */
  get moveCount(): number {
    return this.moves;
  }

  /** クリア済みか。 */
  get cleared(): boolean {
    return this.clearedFlag;
  }

  /** 動いた手の方向列（コピー）。 */
  get directions(): Direction[] {
    return [...this.dirHistory];
  }

  /** アンドゥ可能か。 */
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * 方向入力を適用する。滑走結果（経路・停止位置・クリア有無）を返す。
   * 実際に動いた場合のみ手数・履歴・方向列を更新する。
   * 既にクリア済みの場合も移動自体は許可する（盤面探索を妨げない）。
   */
  move(dir: Direction): MoveOutcome {
    const from = { ...this.pos };
    const result = computeSlide(this.board, from, dir, this.goal);

    if (result.moved) {
      // 直前状態を退避してからコミット。
      this.undoStack.push({
        pos: from,
        moveCount: this.moves,
        cleared: this.clearedFlag,
        dir,
      });
      this.pos = { ...result.stop };
      this.moves += 1;
      this.dirHistory.push(dir);
      if (result.cleared) this.clearedFlag = true;
    }

    return { ...result, from, dir };
  }

  /**
   * 1 手戻す。戻せた場合 true。
   * 手数・方向列・クリア状態も巻き戻す。
   */
  undo(): boolean {
    const prev = this.undoStack.pop();
    if (!prev) return false;
    this.pos = { ...prev.pos };
    this.moves = prev.moveCount;
    this.clearedFlag = prev.cleared;
    this.dirHistory.pop();
    return true;
  }

  /** 初期状態へ戻す。 */
  reset(): void {
    this.pos = { ...this.start };
    this.moves = 0;
    this.clearedFlag = false;
    this.dirHistory = [];
    this.undoStack = [];
  }
}
