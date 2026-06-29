/**
 * 滑走・停止・クリア判定の純粋ロジック。
 * 盤面状態 ＋ 方向 → 滑走経路・停止位置・移動有無・クリア有無 を返す。
 * フレームワーク非依存・完全に決定的（同じ入力なら必ず同じ出力）。
 */

import { tileAt } from './board';
import { type Board, type Direction, type Vec2, Tile } from './types';

/** 各方向の単位ベクトル（y は下方向が正）。 */
const DELTA: Record<Direction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** 停止理由。none は「初手から動けなかった」場合。 */
export type StopReason = 'wall' | 'edge' | 'floor' | 'none';

export interface SlideResult {
  /** 実際に 1 マス以上動いたか。 */
  moved: boolean;
  /** 通過したマス列（開始位置は含めず、停止位置を末尾に含む）。アニメ用。 */
  path: Vec2[];
  /** 最終停止位置。 */
  stop: Vec2;
  /** ゴール上で「止まった」場合のみ true（通過はクリアにしない）。 */
  cleared: boolean;
  /** 停止理由。 */
  reason: StopReason;
}

function eq(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * `from` から `dir` 方向へ氷上を滑らせ、停止位置までを計算する。
 *
 * 停止条件（仕様）:
 *   (a) 進行方向の隣が壁・岩 → その手前で停止（reason: 'wall'）
 *   (b) 進行方向の隣が盤面の縁 → その手前で停止（reason: 'edge'）
 *   (c) 通常床のマスに乗った → そのマスで停止（reason: 'floor'）
 * いずれにも当てはまらず初手で動けなかった場合は reason: 'none'（moved=false）。
 *
 * クリア判定: 停止位置がゴール座標と一致した時のみ cleared=true。
 * 氷の上をゴールマス「通過」しただけ（停止しない）ではクリアにしない。
 */
export function computeSlide(board: Board, from: Vec2, dir: Direction, goal: Vec2): SlideResult {
  const delta = DELTA[dir];
  const path: Vec2[] = [];
  let cur: Vec2 = { x: from.x, y: from.y };

  // 1 マスずつ前進。床に乗ったら即停止、壁/縁に当たったら手前で停止。
  for (;;) {
    const next: Vec2 = { x: cur.x + delta.x, y: cur.y + delta.y };
    const nextTile = tileAt(board, next.x, next.y); // 盤外は Wall 扱い

    if (nextTile === Tile.Wall) {
      // (a)(b) 壁 or 縁。手前（cur）で停止。
      const edge = next.x < 0 || next.y < 0 || next.x >= board.width || next.y >= board.height;
      const moved = path.length > 0;
      return {
        moved,
        path,
        stop: cur,
        cleared: moved && eq(cur, goal),
        reason: moved ? (edge ? 'edge' : 'wall') : 'none',
      };
    }

    // 氷 or 床へ前進できる。
    cur = next;
    path.push(cur);

    if (nextTile === Tile.Floor) {
      // (c) 通常床に乗ったので停止。
      return {
        moved: true,
        path,
        stop: cur,
        cleared: eq(cur, goal),
        reason: 'floor',
      };
    }
    // 氷なら滑走継続。
  }
}
