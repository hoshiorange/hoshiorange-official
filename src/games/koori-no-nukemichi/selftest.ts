/**
 * こおりのぬけみち コア自己テスト（テストフレームワーク非使用）。
 *
 * 実行方法（env 不要 / 追加の常設依存なし。tsx は npx でその場取得される）:
 *   npx tsx src/games/koori-no-nukemichi/selftest.ts
 * ※ tsconfig の bundler 解決（拡張子なし import）を使うため、素の node 実行ではなく
 *   tsx を用いること。
 *
 * 検証内容:
 *   1) encode/decode 往復（シード全ステージ）
 *   2) 滑走の停止条件 (a)壁 (b)縁 (c)床
 *   3) シード各ステージが意図した手順でクリアできる
 *   4) ゴールを「通過」しただけではクリアにならない
 *   5) GameEngine の手数カウント / アンドゥ / リセット
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
} from './core';
import { seedStages } from './data/seed';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string): void {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    console.error(`  ✗ ${label}`);
  }
}

function assertEq<T>(actual: T, expected: T, label: string): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) console.error(`    （期待 ${JSON.stringify(expected)} / 実際 ${JSON.stringify(actual)}）`);
  assert(ok, label);
}

/** 方向列を順に適用し、最終的なエンジン状態を返す。 */
function play(stage: StageData, dirs: Direction[]): GameEngine {
  const engine = new GameEngine(stage);
  for (const d of dirs) engine.move(d);
  return engine;
}

// ---- 1) encode/decode 往復 ----
console.log('1) encode/decode 往復');
for (const stage of seedStages) {
  const board = decodeBoard(stage.data, stage.width, stage.height);
  assertEq(encodeBoard(board), stage.data, `${stage.id}: 往復一致`);
  assert(board.width === stage.width && board.height === stage.height, `${stage.id}: 寸法一致`);
}

// ---- 2) 停止条件 (a)(b)(c) ----
console.log('2) 停止条件');
{
  // (b) 縁: 全面氷 1 行。右へ滑ると縁で停止。
  const edgeBoard: Board = decodeBoard('0000', 4, 1);
  const r1 = computeSlide(edgeBoard, { x: 0, y: 0 }, 'right', { x: 99, y: 99 });
  assertEq(r1.stop, { x: 3, y: 0 }, '(b) 縁で停止する位置');
  assertEq(r1.reason, 'edge', '(b) 停止理由=edge');
  assert(r1.moved, '(b) moved=true');

  // (a) 壁: "0001"。右の壁の手前で停止。
  const wallBoard: Board = decodeBoard('0001', 4, 1);
  const r2 = computeSlide(wallBoard, { x: 0, y: 0 }, 'right', { x: 99, y: 99 });
  assertEq(r2.stop, { x: 2, y: 0 }, '(a) 壁の手前で停止');
  assertEq(r2.reason, 'wall', '(a) 停止理由=wall');

  // (c) 床: "0020"。床マスに乗って停止。
  const floorBoard: Board = decodeBoard('0020', 4, 1);
  const r3 = computeSlide(floorBoard, { x: 0, y: 0 }, 'right', { x: 99, y: 99 });
  assertEq(r3.stop, { x: 2, y: 0 }, '(c) 床で停止');
  assertEq(r3.reason, 'floor', '(c) 停止理由=floor');
  assert(floorBoard.tiles[0][2] === Tile.Floor, '(c) 床タイルの確認');

  // 動けないケース: 即壁。
  const blocked: Board = decodeBoard('10', 2, 1);
  const r4 = computeSlide(blocked, { x: 0, y: 0 }, 'left', { x: 99, y: 99 });
  assert(!r4.moved && r4.reason === 'none', '動けない入力は moved=false / reason=none');
}

// ---- 3) シード各ステージのクリア手順 ----
console.log('3) シード各ステージのクリア');
{
  const e1 = play(seedStages[0], ['right', 'down']); // s1: 右→下
  assert(e1.cleared, 's1 クリア');
  assertEq(e1.moveCount, 2, 's1 手数=2');

  const e2 = play(seedStages[1], ['down', 'right']); // s2: 下(床)→右(壁手前=ゴール)
  assert(e2.cleared, 's2 クリア');
  assertEq(e2.moveCount, 2, 's2 手数=2');

  const e3 = play(seedStages[2], ['right', 'down', 'left']); // s3: 右→下→左
  assert(e3.cleared, 's3 クリア');
  assertEq(e3.moveCount, 3, 's3 手数=3');
  assertEq(e3.directions, ['right', 'down', 'left'], 's3 方向列の記録');
}

// ---- 4) 通過はクリアにしない ----
console.log('4) 通過はクリアにしない');
{
  const board: Board = decodeBoard('00000', 5, 1);
  // goal=(2,0) を通過するが (4,0) で停止 → クリアにならない。
  const r = computeSlide(board, { x: 0, y: 0 }, 'right', { x: 2, y: 0 });
  assertEq(r.stop, { x: 4, y: 0 }, '通過: 停止位置は縁');
  assert(!r.cleared, '通過: cleared=false');
  // 一方、壁で goal にちょうど止まればクリア。
  const board2: Board = decodeBoard('0001', 4, 1);
  const r2 = computeSlide(board2, { x: 0, y: 0 }, 'right', { x: 2, y: 0 });
  assert(r2.cleared, 'ゴールで停止: cleared=true');
}

// ---- 5) 手数 / アンドゥ / リセット ----
console.log('5) 手数 / アンドゥ / リセット');
{
  const engine = new GameEngine(seedStages[1]); // s2
  // 動けない入力（上＝即縁）は手数に数えない。
  const up = engine.move('up');
  assert(!up.moved, '初手 up は動けない');
  assertEq(engine.moveCount, 0, '動けない入力は手数 0 のまま');

  engine.move('down'); // 床へ
  assert(engine.canUndo, 'move 後はアンドゥ可能');
  const posAfterDown = engine.position;
  assert(posAfterDown.y === 2 && posAfterDown.x === 0, 'down 後の位置 (0,2)');

  engine.move('right'); // ゴール
  assert(engine.cleared, 'right でクリア');
  assertEq(engine.moveCount, 2, '手数=2');

  engine.undo(); // right を取り消し → クリア解除
  assert(!engine.cleared, 'アンドゥでクリア解除');
  assertEq(engine.moveCount, 1, 'アンドゥで手数=1');
  assertEq(engine.position, posAfterDown, 'アンドゥで位置が戻る');

  engine.reset();
  assertEq(engine.moveCount, 0, 'リセットで手数=0');
  assertEq(engine.position, { x: seedStages[1].startX, y: seedStages[1].startY }, 'リセットでスタートへ');
  assert(!engine.canUndo, 'リセット後はアンドゥ不可');
}

// ---- 結果 ----
console.log(`\n結果: ${passed} passed / ${failed} failed`);
if (failed > 0) {
  // スクリプトとして実行した場合に異常終了させる。
  if (typeof process !== 'undefined') process.exitCode = 1;
  throw new Error(`自己テスト失敗: ${failed} 件`);
}
console.log('すべて成功 ✓');
