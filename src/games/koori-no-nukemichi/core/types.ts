/**
 * こおりのぬけみち — ゲームコア型定義（純TS / フレームワーク非依存）
 *
 * ここには描画・React・Pixi 等への依存を一切持ち込まない。
 * 盤面状態・滑走/停止/クリア判定はすべてこの core 配下の純粋ロジックで完結させ、
 * 将来スマホアプリ化する際も描画だけ差し替えてこのコアを再利用できるようにする。
 */

/**
 * タイルコード（MVP）。盤面テキストでは 1 マス = 1 桁の数字で表す。
 * - Ice  (0): 氷床。乗っても止まれず滑り続ける。
 * - Wall (1): 壁・岩。通れない。盤面の縁も同じ扱い（その手前で止まる）。
 * - Floor(2): 通常床。乗ると滑らず止まれる。
 * スタート / ゴールはセル種別ではなく座標で別管理する（仕様）。
 */
export const Tile = {
  Ice: 0,
  Wall: 1,
  Floor: 2,
} as const;

export type TileCode = (typeof Tile)[keyof typeof Tile];

/** タイルコードは 1 桁（0-9）。将来の種別追加に備え最大 10 種まで。 */
export const MAX_TILE_CODE = 9;

/** 方向入力。 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** 盤面座標（x = 列, y = 行。原点は左上、y は下方向が正）。 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * ステージの永続表現。DB（将来 Supabase）/ JSON / エディタ出力すべてこの形。
 * `data` は "111,101,121" 形式のテキスト:
 *   - 1 行 = `width` 文字（タイルコードを区切りなしで連結）
 *   - 行同士はカンマ区切り、行数 = `height`
 */
export interface StageData {
  id: string;
  /** 所属する章（world）の ID。階層は 2 段（world=章 → stage）。 */
  worldId: string;
  title: string;
  width: number;
  height: number;
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  data: string;
  /** 章 / ワールド内での並び順（小さいほど先）。 */
  order?: number;
  /**
   * 公開済みか（M1）。true=公開 / false・undefined=下書き。
   * 公開後は盤面ロック（メタのみ編集可・複製は可）。
   */
  published?: boolean;
  /**
   * 作成者が実際にクリアした操作手順（方向列）＝マリオメーカー方式の公開根拠（M1）。
   * 手数は length で算出。フェーズ2 のサーバ再生検証にも使える。
   */
  authorMoves?: Direction[] | null;
  /** 作成者ユーザーID（Supabase Auth の user_id）。M1。 */
  createdBy?: string | null;
  /** 作成日時（ISO 文字列・Supabase）。 */
  createdAt?: string;
  /** 更新日時（ISO 文字列・Supabase）。 */
  updatedAt?: string;
}

/**
 * デコード済みの盤面（2D グリッド）。core 内部の計算用。
 * `tiles[y][x]` でアクセスする。
 */
export interface Board {
  width: number;
  height: number;
  tiles: TileCode[][];
}
