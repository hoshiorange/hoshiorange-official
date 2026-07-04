/**
 * こおりのぬけみち — ステージ自動生成＆検証スクリプト
 *
 * 実行: npx tsx scripts/koori-generate-stages.ts
 *
 * - 3章 × 各10ステージ = 計30ステージを生成。
 * - 難易度 = マップの広さ + クリアに必要な手数（最小手数）。章をまたいで／章内で段階的に増加。
 * - コアの computeSlide を使って BFS で「停止位置」を全探索し、目標手数で到達できる停止位置を
 *   ゴールに採用 → クリア可能性と最小必要手数を保証。さらに GameEngine で解（author_moves）を
 *   実再生してクリア判定 true をアサート。
 * - 結果を scratchpad に JSON 出力し、難易度分布の表を標準出力に出す。
 */

import {
  GameEngine,
  Tile,
  computeSlide,
  decodeBoard,
  encodeBoard,
  type Board,
  type Direction,
  type StageData,
  type Vec2,
  type TileCode,
} from '../src/games/koori-no-nukemichi/core';
import { writeFileSync } from 'node:fs';

/* ---------------- 乱数（決定的・seed 固定） ---------------- */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRS: Direction[] = ['up', 'down', 'left', 'right'];
const DIR_TO_CHAR: Record<Direction, string> = { up: 'U', down: 'D', left: 'L', right: 'R' };

function serializeMoves(moves: Direction[]): string {
  return moves.map((d) => DIR_TO_CHAR[d]).join('');
}

function keyOf(p: Vec2): string {
  return `${p.x},${p.y}`;
}

/* ---------------- 盤面生成 ---------------- */
/**
 * 氷ベースの盤面に壁・床を散らす。
 * - wallDensity: 内部セルに壁を置く確率
 * - floorDensity: 内部セルに床を置く確率（壁でないセルに対して）
 */
function makeBoard(
  w: number,
  h: number,
  wallDensity: number,
  floorDensity: number,
  rng: () => number,
): Board {
  const tiles: TileCode[][] = [];
  for (let y = 0; y < h; y++) {
    const row: TileCode[] = [];
    for (let x = 0; x < w; x++) {
      const r = rng();
      if (r < wallDensity) row.push(Tile.Wall);
      else if (r < wallDensity + floorDensity) row.push(Tile.Floor);
      else row.push(Tile.Ice);
    }
    tiles.push(row);
  }
  return { width: w, height: h, tiles };
}

/* ---------------- BFS: 停止位置の最小手数を全探索 ---------------- */
interface BfsNode {
  pos: Vec2;
  dist: number;
  parent: string | null;
  dir: Direction | null;
}

/**
 * start から「1スライド=1手」で到達できる停止位置を BFS。
 * goal を「停止できる位置」として正しく評価するため、computeSlide の goal 引数には
 * 探索中の next 停止候補そのものを渡す必要はない（cleared はここでは使わない）。
 * ここでは純粋に「どこに止まれるか」のグラフを作り、後で任意セルをゴールに据える。
 */
function bfsStops(board: Board, start: Vec2): Map<string, BfsNode> {
  const visited = new Map<string, BfsNode>();
  const startKey = keyOf(start);
  visited.set(startKey, { pos: start, dist: 0, parent: null, dir: null });
  const queue: Vec2[] = [start];
  // goal はスライド計算に影響しない（cleared 判定のみに使われる）ので番兵を渡す。
  const sentinel: Vec2 = { x: -999, y: -999 };
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curKey = keyOf(cur);
    const curNode = visited.get(curKey)!;
    for (const dir of DIRS) {
      const res = computeSlide(board, cur, dir, sentinel);
      if (!res.moved) continue;
      const stop = res.stop;
      const sk = keyOf(stop);
      if (visited.has(sk)) continue;
      visited.set(sk, { pos: stop, dist: curNode.dist + 1, parent: curKey, dir });
      queue.push(stop);
    }
  }
  return visited;
}

function reconstruct(visited: Map<string, BfsNode>, goalKey: string): Direction[] {
  const moves: Direction[] = [];
  let cur: string | null = goalKey;
  while (cur) {
    const node: BfsNode = visited.get(cur)!;
    if (node.dir) moves.push(node.dir);
    cur = node.parent;
  }
  moves.reverse();
  return moves;
}

function hasTurn(moves: Direction[]): boolean {
  for (let i = 1; i < moves.length; i++) {
    if (moves[i] !== moves[i - 1]) return true;
  }
  return false;
}

/* ---------------- 1ステージ生成 ---------------- */
interface GeneratedStage {
  width: number;
  height: number;
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  data: string;
  moves: Direction[]; // 解（最小手数）
  movesStr: string;
  dist: number; // 最小必要手数
  targetMoves: number;
}

interface GenParams {
  w: number;
  h: number;
  targetMoves: number;
}

/**
 * 指定サイズ・目標手数でクリア可能なステージを生成する。
 * 多数の盤面をランダム試行し、目標手数以上（できるだけ近い）で曲がりを含む解を持つものを採用。
 */
function generateStage(params: GenParams, rng: () => number): GeneratedStage {
  const { w, h, targetMoves } = params;
  const maxAttempts = 60000;
  // 目標手数の許容窓（targetMoves 以上 targetMoves+window 以下を最優先）
  const window = 3;

  let best: GeneratedStage | null = null; // 窓に入らない場合の保険（最大 dist）

  // サイズが大きいほど壁を増やすと曲がりが増えて手数が伸びる。
  const area = w * h;
  const wallDensity = 0.14 + Math.min(0.16, (targetMoves / area) * 1.6);
  const floorDensity = 0.05;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board = makeBoard(w, h, wallDensity, floorDensity, rng);

    // start: 壁でないセルからランダムに選ぶ
    const standables: Vec2[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (board.tiles[y][x] !== Tile.Wall) standables.push({ x, y });
      }
    }
    if (standables.length < 4) continue;
    const start = standables[Math.floor(rng() * standables.length)];

    const visited = bfsStops(board, start);
    if (visited.size < 3) continue;

    // 候補ゴール: dist >= targetMoves、曲がりあり。dist 昇順で targetMoves に最も近いものを選ぶ。
    let chosen: { key: string; node: BfsNode; moves: Direction[] } | null = null;
    let chosenDist = Infinity;
    let fallback: { key: string; node: BfsNode; moves: Direction[] } | null = null;
    let fallbackDist = -1;

    for (const [key, node] of visited) {
      if (node.dist < 2) continue;
      if (key === keyOf(start)) continue;
      const moves = reconstruct(visited, key);
      if (!hasTurn(moves)) continue;

      // フォールバック: 最大 dist を保持
      if (node.dist > fallbackDist) {
        fallbackDist = node.dist;
        fallback = { key, node, moves };
      }
      // 本命: targetMoves <= dist <= targetMoves+window のうち最小 dist
      if (node.dist >= targetMoves && node.dist <= targetMoves + window) {
        if (node.dist < chosenDist) {
          chosenDist = node.dist;
          chosen = { key, node, moves };
        }
      }
    }

    const pick = chosen ?? null;
    if (pick) {
      const g: GeneratedStage = buildResult(board, start, pick.node.pos, pick.moves, targetMoves);
      verifyStage(g);
      return g;
    }

    // 窓に入らなくても、より目標に近い（大きい）解を保険として保持
    if (fallback && fallbackDist > (best?.dist ?? -1)) {
      const g = buildResult(board, start, fallback.node.pos, fallback.moves, targetMoves);
      verifyStage(g);
      best = g;
    }
  }

  if (best) return best;
  throw new Error(`生成失敗: w=${w} h=${h} target=${targetMoves}`);
}

function buildResult(
  board: Board,
  start: Vec2,
  goal: Vec2,
  moves: Direction[],
  targetMoves: number,
): GeneratedStage {
  return {
    width: board.width,
    height: board.height,
    startX: start.x,
    startY: start.y,
    goalX: goal.x,
    goalY: goal.y,
    data: encodeBoard(board),
    moves,
    movesStr: serializeMoves(moves),
    dist: moves.length,
    targetMoves,
  };
}

/* ---------------- 検証: GameEngine で解を実再生してクリア確認 ---------------- */
function verifyStage(g: GeneratedStage): void {
  // decode 往復チェック
  const board = decodeBoard(g.data, g.width, g.height);
  if (board.tiles[g.startY]?.[g.startX] === undefined)
    throw new Error('start 座標が盤面外');
  if (board.tiles[g.goalY]?.[g.goalX] === undefined) throw new Error('goal 座標が盤面外');
  if (board.tiles[g.startY][g.startX] === Tile.Wall) throw new Error('start が壁');
  if (board.tiles[g.goalY][g.goalX] === Tile.Wall) throw new Error('goal が壁');

  const stage: StageData = {
    id: 'verify',
    worldId: 'verify',
    title: 'verify',
    width: g.width,
    height: g.height,
    startX: g.startX,
    startY: g.startY,
    goalX: g.goalX,
    goalY: g.goalY,
    data: g.data,
  };
  const engine = new GameEngine(stage);
  for (const dir of g.moves) {
    engine.move(dir);
  }
  if (!engine.cleared) {
    throw new Error(
      `解の再生でクリアできない: target=${g.targetMoves} moves=${g.movesStr} (${g.width}x${g.height})`,
    );
  }
  if (engine.moveCount !== g.moves.length) {
    throw new Error(
      `解の途中で動けない手がある（手数不一致 ${engine.moveCount} != ${g.moves.length}）`,
    );
  }
  // 最小性の念のため確認: 解の手数が BFS の dist と一致しているはず
  const board2 = decodeBoard(g.data, g.width, g.height);
  const visited = bfsStops(board2, { x: g.startX, y: g.startY });
  const node = visited.get(`${g.goalX},${g.goalY}`);
  if (!node) throw new Error('ゴールが BFS で到達不能');
  if (node.dist !== g.moves.length) {
    throw new Error(`最小手数不一致 bfs=${node.dist} solution=${g.moves.length}`);
  }
}

/* ---------------- 難易度スケジュール ---------------- */
// 章ごとに (サイズ範囲, 手数範囲) を定義。章内 s1→s10 で線形に増やす。
interface ChapterPlan {
  title: string;
  order: number;
  sizeFrom: number;
  sizeTo: number;
  movesFrom: number;
  movesTo: number;
}

const CHAPTERS: ChapterPlan[] = [
  { title: '第1層 こおりのいりぐち', order: 1, sizeFrom: 5, sizeTo: 8, movesFrom: 2, movesTo: 6 },
  { title: '第2層 つららの回廊', order: 2, sizeFrom: 8, sizeTo: 12, movesFrom: 5, movesTo: 12 },
  { title: '第3層 氷結の迷宮', order: 3, sizeFrom: 11, sizeTo: 16, movesFrom: 10, movesTo: 20 },
];

function lerpInt(from: number, to: number, i: number, n: number): number {
  // i in [0, n-1]
  return Math.round(from + ((to - from) * i) / (n - 1));
}

/* ---------------- メイン ---------------- */
function main() {
  const rng = mulberry32(20260630);
  const STAGES_PER_CHAPTER = 10;

  const output: {
    chapters: {
      title: string;
      order: number;
      stages: (GeneratedStage & { title: string; orderInWorld: number })[];
    }[];
  } = { chapters: [] };

  console.log('=== こおりのぬけみち ステージ生成 ===\n');

  for (let c = 0; c < CHAPTERS.length; c++) {
    const plan = CHAPTERS[c];
    const stages: (GeneratedStage & { title: string; orderInWorld: number })[] = [];
    console.log(`--- ${plan.title} (order=${plan.order}) ---`);
    console.log('stage | size  | target | dist | moves');

    for (let i = 0; i < STAGES_PER_CHAPTER; i++) {
      const size = lerpInt(plan.sizeFrom, plan.sizeTo, i, STAGES_PER_CHAPTER);
      const targetMoves = lerpInt(plan.movesFrom, plan.movesTo, i, STAGES_PER_CHAPTER);
      const g = generateStage({ w: size, h: size, targetMoves }, rng);
      const title = `${plan.order}-${i + 1}`;
      stages.push({ ...g, title, orderInWorld: i + 1 });
      console.log(
        `  ${title.padEnd(4)} | ${`${g.width}x${g.height}`.padEnd(5)} | ${String(targetMoves).padStart(
          6,
        )} | ${String(g.dist).padStart(4)} | ${g.movesStr}`,
      );
    }
    output.chapters.push({ title: plan.title, order: plan.order, stages });
    console.log('');
  }

  // 全件再検証（保険）
  let total = 0;
  for (const ch of output.chapters) {
    for (const s of ch.stages) {
      verifyStage(s);
      total++;
    }
  }
  console.log(`全 ${total} ステージ クリア可能性検証 OK\n`);

  const outPath =
    'C:\\Users\\kei21\\AppData\\Local\\Temp\\claude\\C--git-hoshiorange-official\\b8ec16ce-d778-4bcf-8da5-d46cbe9c9ab7\\scratchpad\\koori-stages.json';
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`JSON 出力: ${outPath}`);

  // 難易度分布サマリ
  console.log('\n=== 難易度分布サマリ ===');
  for (const ch of output.chapters) {
    const dists = ch.stages.map((s) => s.dist);
    const sizes = ch.stages.map((s) => s.width);
    console.log(
      `${ch.title}: size ${Math.min(...sizes)}-${Math.max(...sizes)}, moves ${Math.min(
        ...dists,
      )}-${Math.max(...dists)}`,
    );
  }
}

main();
