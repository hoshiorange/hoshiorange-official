/**
 * こおりのぬけみち — 新・第3章（高難易度・開放盤）ステージ自動生成＆検証スクリプト
 *
 * 実行: npx tsx scripts/koori-generate-chapter3.ts
 *
 * 【設計方針（ユーザーフィードバック v2 反映）】
 *  アイスパズルの難しさは「壁で道を狭めた1本道（廊下を辿る）」ではなく、
 *  「広い氷の上で、どの縁/障害物にどの順序でぶつかって曲がるかを計画する」ことにある。
 *  したがって本章は:
 *   - 障害物（壁/床）を旧章(密度0.4〜0.48)より下げ、盤の大半を氷にする。
 *   - 1手のスライドが長い（縁や離れた障害物まで滑る）＝「開放感」を、
 *     “解の平均スライド距離”を明示的に最大化することで担保する（廊下的な短い停止を排除）。
 *
 * 【偶然クリアの排除（前回ロジックを流用）】
 *   条件A: 最短手数 L の解（停止セル列）がちょうど 1 通り（最短経路が一意）。
 *   条件B: 「単純路」（同じ停止セルを二度通らない経路）で、長さ L+1 .. L+K（K=3）に
 *          ゴール到達する別ルートが 0 件。＝最短解の前後数手に別ルートが無い＝偶然クリア防止。
 *     ※ 氷上の往復ウィグル（同じ場所を行き来）は単純路でないので別解に数えない。
 *
 * 【重要な知見（検証で判明）】
 *   開放盤は連結性が高く、低密度ほど L+1..L+3 の“迂回の単純路”が増えて条件Bが壊れる。
 *   ＝「真に疎」と「近接別解ゼロ」は構造的に両立しにくい。そこで本生成器は:
 *     ・密度を [DENSITY_LO, DENSITY_HI] で振りつつ（旧章より低い帯）、
 *     ・条件A,B を満たす盤の中から “解の平均スライド距離 (avgSlide)” が最大の盤を採用する。
 *   これにより「偶然クリア不可（A,B）」を保ったまま、可能な限り開放的（長い滑走＝順序読み）な
 *   盤を選び取る。旧章との本質的な違いは density の数値ではなく avgSlide（廊下→長い滑走）。
 *
 * 採用解は GameEngine 実再生で cleared===true / 手数一致 / BFS最短一致を三重アサート。
 * さらに A,B を採用前後で再アサートする。
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
const serializeMoves = (moves: Direction[]) => moves.map((d) => DIR_TO_CHAR[d]).join('');
const keyOf = (p: Vec2) => `${p.x},${p.y}`;
const SENTINEL: Vec2 = { x: -999, y: -999 };

/* ---------------- 盤面生成（開放・低密度） ---------------- */
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

function internalObstacleDensity(board: Board): number {
  let obst = 0;
  let total = 0;
  for (let y = 0; y < board.height; y++)
    for (let x = 0; x < board.width; x++) {
      total++;
      if (board.tiles[y][x] !== Tile.Ice) obst++;
    }
  return obst / total;
}

/* ---------------- スライドグラフ（スライド距離つき） ---------------- */
interface Edge {
  to: string;
  dir: Direction;
  dist: number; // このスライドで進んだセル数
}
interface Graph {
  nodes: string[];
  pos: Map<string, Vec2>;
  out: Map<string, Edge[]>;
}

function buildGraph(board: Board, start: Vec2): Graph {
  const pos = new Map<string, Vec2>();
  const out = new Map<string, Edge[]>();
  pos.set(keyOf(start), start);
  const queue: Vec2[] = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const ck = keyOf(cur);
    if (out.has(ck)) continue;
    const edges: Edge[] = [];
    for (const dir of DIRS) {
      const res = computeSlide(board, cur, dir, SENTINEL);
      if (!res.moved) continue;
      const sk = keyOf(res.stop);
      edges.push({
        to: sk,
        dir,
        dist: Math.abs(res.stop.x - cur.x) + Math.abs(res.stop.y - cur.y),
      });
      if (!pos.has(sk)) {
        pos.set(sk, res.stop);
        queue.push(res.stop);
      }
    }
    out.set(ck, edges);
  }
  return { nodes: [...pos.keys()], pos, out };
}

function shortestDist(graph: Graph, start: string, goal: string): number {
  const dist = new Map<string, number>();
  dist.set(start, 0);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === goal) return dist.get(cur)!;
    const d = dist.get(cur)!;
    for (const e of graph.out.get(cur) ?? []) {
      if (!dist.has(e.to)) {
        dist.set(e.to, d + 1);
        queue.push(e.to);
      }
    }
  }
  return dist.has(goal) ? dist.get(goal)! : Infinity;
}

function goalDistMap(graph: Graph, goal: string): Map<string, number> {
  const rev = new Map<string, string[]>();
  for (const n of graph.nodes) rev.set(n, []);
  for (const [u, edges] of graph.out) for (const e of edges) rev.get(e.to)!.push(u);
  const dist = new Map<string, number>();
  dist.set(goal, 0);
  const queue = [goal];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    for (const u of rev.get(cur) ?? []) {
      if (!dist.has(u)) {
        dist.set(u, d + 1);
        queue.push(u);
      }
    }
  }
  return dist;
}

/** 条件A: 最短長 L ちょうどでゴールに到達する経路の本数を {0,1,>=2} で返す。 */
function shortestPathCount(graph: Graph, start: string, goal: string, L: number): number {
  const sat = (a: number, b: number) => Math.min(2, a + b);
  let cur = new Map<string, number>();
  cur.set(start, 1);
  for (let m = 1; m <= L; m++) {
    const next = new Map<string, number>();
    for (const [u, cnt] of cur) {
      if (u === goal) continue;
      for (const e of graph.out.get(u) ?? []) next.set(e.to, sat(next.get(e.to) ?? 0, cnt));
    }
    cur = next;
  }
  return cur.get(goal) ?? 0;
}

/** 条件B: 長さ L+1..L+K にゴール到達する「単純路」が存在するか（true=近接別解あり）。 */
function hasNearSimpleAlt(
  graph: Graph,
  gd: Map<string, number>,
  start: string,
  goal: string,
  L: number,
  K: number,
): boolean {
  const maxLen = L + K;
  const visited = new Set<string>([start]);
  let found = false;
  function dfs(node: string, depth: number) {
    if (found) return;
    if (node === goal) {
      if (depth >= L + 1 && depth <= maxLen) found = true;
      return;
    }
    const gdN = gd.get(node);
    if (gdN === undefined || gdN > maxLen - depth) return;
    for (const e of graph.out.get(node) ?? []) {
      if (visited.has(e.to)) continue;
      visited.add(e.to);
      dfs(e.to, depth + 1);
      visited.delete(e.to);
      if (found) return;
    }
  }
  dfs(start, 0);
  return found;
}

/** 唯一最短経路の方向列を復元（A が一意のときのみ正しい）。 */
function reconstructUnique(graph: Graph, start: string, goal: string, L: number): Direction[] {
  const gd = goalDistMap(graph, goal);
  const moves: Direction[] = [];
  let cur = start;
  for (let step = 0; step < L; step++) {
    const need = gd.get(cur)! - 1;
    let picked: Edge | null = null;
    for (const e of graph.out.get(cur) ?? []) {
      if (gd.get(e.to) === need) {
        picked = e;
        break;
      }
    }
    if (!picked) throw new Error('唯一経路の復元に失敗');
    moves.push(picked.dir);
    cur = picked.to;
  }
  if (cur !== goal) throw new Error('唯一経路の終点がゴールでない');
  return moves;
}

/* ---------------- 開放度・難所メトリクス ---------------- */
interface Metrics {
  solAvgSlide: number; // 解の平均スライド距離（開放度の主指標）
  solMinSlide: number; // 解中の最短スライド
  solMaxSlide: number; // 解中の最長スライド
  graphAvgSlide: number; // 盤全体の平均スライド距離
  turns: number; // 解の方向転換回数（衝突順序の複雑さ）
  decisionPoints: number; // 出次数>=2（別方向に滑れた）地点の数
  forcedEveryStep: boolean; // 各ステップで前進方向が一意か
}

function analyze(graph: Graph, start: string, goal: string, moves: Direction[]): Metrics {
  const gd = goalDistMap(graph, goal);
  const pathNodes: string[] = [start];
  const slides: number[] = [];
  let cur = start;
  for (const dir of moves) {
    const e = (graph.out.get(cur) ?? []).find((x) => x.dir === dir)!;
    slides.push(e.dist);
    cur = e.to;
    pathNodes.push(cur);
  }

  let turns = 0;
  let decisionPoints = 0;
  let forcedEveryStep = true;
  for (let i = 0; i < moves.length; i++) {
    const node = pathNodes[i];
    if ((graph.out.get(node) ?? []).length >= 2) decisionPoints++;
    const need = gd.get(node)! - 1;
    let progressing = 0;
    for (const e of graph.out.get(node) ?? []) if (gd.get(e.to) === need) progressing++;
    if (progressing !== 1) forcedEveryStep = false;
    if (i >= 1 && moves[i] !== moves[i - 1]) turns++;
  }

  // 盤全体の平均スライド距離
  let edgeCount = 0;
  let edgeDistSum = 0;
  for (const [, edges] of graph.out)
    for (const e of edges) {
      edgeCount++;
      edgeDistSum += e.dist;
    }

  return {
    solAvgSlide: slides.reduce((a, b) => a + b, 0) / slides.length,
    solMinSlide: Math.min(...slides),
    solMaxSlide: Math.max(...slides),
    graphAvgSlide: edgeCount ? edgeDistSum / edgeCount : 0,
    turns,
    decisionPoints,
    forcedEveryStep,
  };
}

/* ---------------- 1ステージ生成（avgSlide 最大化） ---------------- */
interface GeneratedStage {
  width: number;
  height: number;
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  data: string;
  moves: Direction[];
  movesStr: string;
  dist: number;
  obstacleDensity: number;
  metrics: Metrics;
}

interface GenParams {
  w: number;
  h: number;
  minL: number;
  maxL: number;
  densityLo: number;
  densityHi: number;
  floorDensity: number;
  opennessFloor: number; // 解の平均スライド距離の下限（これ未満は不採用）
  opennessGood: number; // これ以上なら早期採用（十分開放的）
  minTurns: number;
  minDecisionPoints: number;
  K: number;
  attempts: number;
}

/**
 * 目標帯 [minL, maxL] の中で、条件A,B＋開放度下限を満たす盤を探し、
 * その中から「解の平均スライド距離」が最大の盤を採用する（開放感を最大化）。
 */
function generateStage(params: GenParams, rng: () => number): GeneratedStage {
  const {
    w, h, minL, maxL, densityLo, densityHi, floorDensity,
    opennessFloor, opennessGood, minTurns, minDecisionPoints, K, attempts,
  } = params;

  let best: GeneratedStage | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const wallDensity = densityLo + (densityHi - densityLo) * rng();
    const board = makeBoard(w, h, wallDensity, floorDensity, rng);

    const standables: Vec2[] = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) if (board.tiles[y][x] !== Tile.Wall) standables.push({ x, y });
    if (standables.length < 6) continue;
    const start = standables[Math.floor(rng() * standables.length)];
    const startKey = keyOf(start);

    const graph = buildGraph(board, start);
    if (graph.nodes.length < minL + 2) continue;

    // 目標帯内の候補ゴール
    const candidates: { key: string; L: number }[] = [];
    for (const key of graph.nodes) {
      if (key === startKey) continue;
      const L = shortestDist(graph, startKey, key);
      if (L >= minL && L <= maxL) candidates.push({ key, L });
    }
    if (candidates.length === 0) continue;
    // 長い解（順序を多く組む）を優先しつつ評価
    candidates.sort((a, b) => b.L - a.L);

    for (const cand of candidates.slice(0, 20)) {
      const goalKey = cand.key;
      const L = cand.L;
      if (shortestPathCount(graph, startKey, goalKey, L) !== 1) continue; // 条件A
      const gd = goalDistMap(graph, goalKey);
      if (hasNearSimpleAlt(graph, gd, startKey, goalKey, L, K)) continue; // 条件B

      const moves = reconstructUnique(graph, startKey, goalKey, L);
      const metrics = analyze(graph, startKey, goalKey, moves);
      if (metrics.solAvgSlide < opennessFloor) continue; // 開放度フィルタ
      if (metrics.turns < minTurns) continue;
      if (metrics.decisionPoints < minDecisionPoints) continue;

      const goal = graph.pos.get(goalKey)!;
      const g: GeneratedStage = {
        width: board.width,
        height: board.height,
        startX: start.x,
        startY: start.y,
        goalX: goal.x,
        goalY: goal.y,
        data: encodeBoard(board),
        moves,
        movesStr: serializeMoves(moves),
        dist: L,
        obstacleDensity: internalObstacleDensity(board),
        metrics,
      };
      // avgSlide が最大のものを保持
      if (!best || g.metrics.solAvgSlide > best.metrics.solAvgSlide) best = g;
      break; // 1盤につき最良候補1つ
    }

    // 十分開放的なものが見つかったら早期終了
    if (best && best.metrics.solAvgSlide >= opennessGood) break;
  }

  if (!best) {
    throw new Error(
      `生成失敗: w=${w} h=${h} L=[${minL},${maxL}] density=[${densityLo},${densityHi}] openness>=${opennessFloor}`,
    );
  }
  verifyStage(best, K);
  return best;
}

/* ---------------- 検証（三重 + A,B 再検証） ---------------- */
function verifyStage(g: GeneratedStage, K: number): void {
  const board = decodeBoard(g.data, g.width, g.height);
  if (board.tiles[g.startY]?.[g.startX] === undefined) throw new Error('start 座標が盤面外');
  if (board.tiles[g.goalY]?.[g.goalX] === undefined) throw new Error('goal 座標が盤面外');
  if (board.tiles[g.startY][g.startX] === Tile.Wall) throw new Error('start が壁');
  if (board.tiles[g.goalY][g.goalX] === Tile.Wall) throw new Error('goal が壁');

  // 1) GameEngine 実再生 → cleared / 手数一致
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
  for (const dir of g.moves) engine.move(dir);
  if (!engine.cleared) throw new Error(`解の再生でクリアできない: ${g.movesStr}`);
  if (engine.moveCount !== g.moves.length)
    throw new Error(`手数不一致 ${engine.moveCount} != ${g.moves.length}`);

  // 2) BFS 最短一致
  const graph = buildGraph(board, { x: g.startX, y: g.startY });
  const startKey = `${g.startX},${g.startY}`;
  const goalKey = `${g.goalX},${g.goalY}`;
  const L = shortestDist(graph, startKey, goalKey);
  if (L !== g.moves.length) throw new Error(`最短手数不一致 bfs=${L} solution=${g.moves.length}`);

  // 3) 一意性(A)・近接別解なし(B) 再検証
  if (shortestPathCount(graph, startKey, goalKey, L) !== 1) throw new Error('最短解が一意でない');
  const gd = goalDistMap(graph, goalKey);
  if (hasNearSimpleAlt(graph, gd, startKey, goalKey, L, K))
    throw new Error(`L+1..L+${K} に単純路の別解あり`);
}

/* ---------------- 難易度スケジュール（新・第3章 開放盤） ---------------- */
interface StagePlan {
  size: number;
  minL: number;
  maxL: number;
  densityLo: number;
  densityHi: number;
  opennessFloor: number;
  opennessGood: number;
  minTurns: number;
  minDecisionPoints: number;
  attempts: number;
}

// s1→s10 でサイズと手数を増やす。密度は旧章(0.4〜0.48)より低い帯に固定し、
// 開放度(解の平均スライド距離)をできるだけ高く採る。
const STAGE_PLANS: StagePlan[] = [
  { size: 11, minL: 9,  maxL: 12, densityLo: 0.22, densityHi: 0.30, opennessFloor: 2.3, opennessGood: 3.6, minTurns: 3, minDecisionPoints: 3, attempts: 60000 },
  { size: 12, minL: 10, maxL: 13, densityLo: 0.22, densityHi: 0.30, opennessFloor: 2.3, opennessGood: 3.6, minTurns: 3, minDecisionPoints: 4, attempts: 70000 },
  { size: 12, minL: 10, maxL: 13, densityLo: 0.23, densityHi: 0.31, opennessFloor: 2.4, opennessGood: 3.7, minTurns: 4, minDecisionPoints: 4, attempts: 80000 },
  { size: 13, minL: 11, maxL: 14, densityLo: 0.23, densityHi: 0.31, opennessFloor: 2.4, opennessGood: 3.7, minTurns: 4, minDecisionPoints: 5, attempts: 90000 },
  { size: 13, minL: 11, maxL: 14, densityLo: 0.24, densityHi: 0.32, opennessFloor: 2.5, opennessGood: 3.8, minTurns: 4, minDecisionPoints: 5, attempts: 100000 },
  { size: 14, minL: 12, maxL: 15, densityLo: 0.24, densityHi: 0.32, opennessFloor: 2.5, opennessGood: 3.8, minTurns: 4, minDecisionPoints: 5, attempts: 120000 },
  { size: 14, minL: 12, maxL: 15, densityLo: 0.25, densityHi: 0.33, opennessFloor: 2.6, opennessGood: 3.9, minTurns: 5, minDecisionPoints: 6, attempts: 140000 },
  { size: 15, minL: 12, maxL: 16, densityLo: 0.25, densityHi: 0.33, opennessFloor: 2.6, opennessGood: 4.0, minTurns: 5, minDecisionPoints: 6, attempts: 160000 },
  { size: 16, minL: 13, maxL: 16, densityLo: 0.26, densityHi: 0.33, opennessFloor: 2.7, opennessGood: 4.0, minTurns: 5, minDecisionPoints: 6, attempts: 180000 },
  { size: 16, minL: 13, maxL: 17, densityLo: 0.26, densityHi: 0.33, opennessFloor: 2.7, opennessGood: 4.2, minTurns: 5, minDecisionPoints: 7, attempts: 200000 },
];

const K_WINDOW = 3;
const NEW_WORLD_ORDER = 3;
const NEW_WORLD_TITLE = '第3層 極氷の試練';

/* ---------------- メイン ---------------- */
function main() {
  const rng = mulberry32(20260702);
  const stages: (GeneratedStage & { title: string; orderInWorld: number })[] = [];

  console.log('=== こおりのぬけみち 新・第3章（開放盤・衝突順序）生成 ===\n');
  console.log(
    'stage | size  |  L | density | solAvgSlide | min/max | graphAvg | turns | decPts | moves',
  );

  let prevL = 0;
  for (let i = 0; i < STAGE_PLANS.length; i++) {
    const plan = STAGE_PLANS[i];
    const effMinL = Math.max(plan.minL, prevL); // 非減少
    const effMaxL = Math.max(plan.maxL, effMinL);
    const g = generateStage(
      {
        w: plan.size,
        h: plan.size,
        minL: effMinL,
        maxL: effMaxL,
        densityLo: plan.densityLo,
        densityHi: plan.densityHi,
        floorDensity: 0.03,
        opennessFloor: plan.opennessFloor,
        opennessGood: plan.opennessGood,
        minTurns: plan.minTurns,
        minDecisionPoints: plan.minDecisionPoints,
        K: K_WINDOW,
        attempts: plan.attempts,
      },
      rng,
    );
    prevL = g.dist;
    const title = `3-${i + 1}`;
    stages.push({ ...g, title, orderInWorld: i + 1 });
    const m = g.metrics;
    console.log(
      `  ${title.padEnd(4)} | ${`${g.width}x${g.height}`.padEnd(5)} | ${String(g.dist).padStart(2)} | ${(
        g.obstacleDensity * 100
      )
        .toFixed(0)
        .padStart(6)}% | ${m.solAvgSlide.toFixed(2).padStart(11)} | ${`${m.solMinSlide}/${m.solMaxSlide}`.padStart(
        7,
      )} | ${m.graphAvgSlide.toFixed(2).padStart(8)} | ${String(m.turns).padStart(5)} | ${String(
        m.decisionPoints,
      ).padStart(6)} | ${g.movesStr}`,
    );
  }

  for (const s of stages) verifyStage(s, K_WINDOW);
  console.log(`\n全 ${stages.length} ステージ 三重検証＋ユニーク性(A,B)検証 OK`);

  const out = {
    world: { title: NEW_WORLD_TITLE, order: NEW_WORLD_ORDER, published: true },
    K: K_WINDOW,
    stages,
  };
  const outPath =
    'C:\\Users\\kei21\\AppData\\Local\\Temp\\claude\\C--git-hoshiorange-official\\b8ec16ce-d778-4bcf-8da5-d46cbe9c9ab7\\scratchpad\\koori-chapter3.json';
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`\nJSON 出力: ${outPath}`);
}

main();
