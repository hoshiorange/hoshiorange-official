/**
 * 盤面テキスト "111,101,121" ⇔ 2D 構造（Board）の相互変換とアクセサ。
 * すべて純粋関数。例外は「データ不整合」を呼び出し側に伝えるためにのみ投げる。
 */

import { type Board, type StageData, type TileCode, type Vec2, MAX_TILE_CODE, Tile } from './types';

/** 1 文字をタイルコードに変換する。範囲外（0-9 以外）はエラー。 */
function charToTile(ch: string): TileCode {
  const code = ch.charCodeAt(0) - 48; // '0' = 48
  if (code < 0 || code > MAX_TILE_CODE) {
    throw new Error(`不正なタイル文字です: "${ch}"`);
  }
  return code as TileCode;
}

/**
 * 盤面テキストを 2D の Board にデコードする。
 * width / height はスカラー側の値を正とし、テキストと不一致なら検出して投げる。
 */
export function decodeBoard(data: string, width: number, height: number): Board {
  const rows = data.split(',');
  if (rows.length !== height) {
    throw new Error(`行数が height と一致しません（期待 ${height} / 実際 ${rows.length}）`);
  }
  const tiles: TileCode[][] = rows.map((row, y) => {
    if (row.length !== width) {
      throw new Error(`${y} 行目の文字数が width と一致しません（期待 ${width} / 実際 ${row.length}）`);
    }
    return Array.from(row, charToTile);
  });
  return { width, height, tiles };
}

/** Board を盤面テキストにエンコードする（decode の逆）。 */
export function encodeBoard(board: Board): string {
  return board.tiles.map((row) => row.join('')).join(',');
}

/** StageData から Board を組み立てる便利関数。 */
export function boardFromStage(stage: StageData): Board {
  return decodeBoard(stage.data, stage.width, stage.height);
}

/** (x, y) が盤面内なら true。 */
export function inBounds(board: Board, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < board.width && y < board.height;
}

/**
 * (x, y) のタイルを返す。盤面外は「縁＝壁と同じ扱い」のため Wall を返す。
 * これにより滑走ロジックは縁と壁を同一視できる。
 */
export function tileAt(board: Board, x: number, y: number): TileCode {
  if (!inBounds(board, x, y)) return Tile.Wall;
  return board.tiles[y][x];
}

/** スタート座標を Vec2 で取り出す。 */
export function startOf(stage: StageData): Vec2 {
  return { x: stage.startX, y: stage.startY };
}

/** ゴール座標を Vec2 で取り出す。 */
export function goalOf(stage: StageData): Vec2 {
  return { x: stage.goalX, y: stage.goalY };
}
