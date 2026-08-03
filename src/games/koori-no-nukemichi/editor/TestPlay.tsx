'use client';

/**
 * テストプレイ オーバーレイ（DOM / core の GameEngine を使用・Pixi 非依存）。
 * - 現在編集中の盤面を実際に遊び、クリアしたら操作手順（方向列）を親へ返す。
 * - 作成者がここでクリアして初めて「公開」が解放される（マリオメーカー方式）。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, type Direction, type StageData, type Vec2 } from '../core';
import { EditorGrid } from './EditorGrid';
import styles from './editor.module.css';

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

// 滑走アニメの時間設計（プレイヤー GameApp.tsx と同じ体感に合わせる）。
const PER_CELL_MS = 55;
const MIN_SLIDE_MS = 90;
const MAX_SLIDE_MS = 520;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface TestPlayProps {
  stage: StageData;
  /** クリア時に作成者の操作手順を返す（公開解放に使う）。 */
  onClear: (moves: Direction[]) => void;
  /** オーバーレイを閉じる。 */
  onClose: () => void;
}

export function TestPlay({ stage, onClear, onClose }: TestPlayProps) {
  const engineRef = useRef<GameEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new GameEngine(stage);
  }

  const [pos, setPos] = useState<Vec2>(() => engineRef.current!.position);
  const [moveCount, setMoveCount] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [animMs, setAnimMs] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  // 滑走中の入力ロック（プレイヤーの animatingRef と同じ作法）。
  const animatingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // 滑走表示が止まってから手数・クリア判定を確定する（プレイヤーの onDone 相当）。
  const finishMove = useCallback(
    (engine: GameEngine) => {
      setMoveCount(engine.moveCount);
      if (engine.cleared) {
        setCleared(true);
        onClear(engine.directions);
      }
    },
    [onClear],
  );

  const tryMove = useCallback(
    (dir: Direction) => {
      const engine = engineRef.current;
      if (!engine || cleared || animatingRef.current) return;
      const outcome = engine.move(dir);
      if (!outcome.moved) return; // 動けない入力は無視

      // 通過セル数に応じた所要時間。プレイヤーと同じ ease-out 体感。
      const cells = outcome.path.length;
      const duration = prefersReducedMotion()
        ? 0
        : Math.min(MAX_SLIDE_MS, Math.max(MIN_SLIDE_MS, cells * PER_CELL_MS));

      setAnimMs(duration);
      setPos(engine.position); // EditorGrid が duration かけて停止位置まで補間する

      if (duration <= 0) {
        finishMove(engine); // 即時移動（reduced-motion）はそのまま確定
        return;
      }
      // 滑走中は入力ロックし、停止後に状態を確定。
      animatingRef.current = true;
      setIsAnimating(true);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        animatingRef.current = false;
        setIsAnimating(false);
        finishMove(engine);
      }, duration);
    },
    [cleared, finishMove],
  );

  const reset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    animatingRef.current = false;
    setIsAnimating(false);
    engine.reset();
    setAnimMs(0); // リセットはスタートへ即時（滑走させない）
    setPos(engine.position);
    setMoveCount(0);
    setCleared(false);
  }, []);

  // アンマウント時に保留中のタイマーを片付ける。
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onClose();
        return;
      }
      const dir = KEY_TO_DIR[e.code];
      if (!dir) return;
      e.preventDefault();
      tryMove(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove, onClose]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="テストプレイ">
      <p className={styles.overlayTitle}>テストプレイ ― 手数 {moveCount}</p>
      {cleared ? <p className={styles.clearBanner}>クリア！ {moveCount} 手（公開できます）</p> : null}

      <div className={styles.gridWrap}>
        <EditorGrid
          width={stage.width}
          height={stage.height}
          tiles={decodeTiles(stage)}
          start={{ x: stage.startX, y: stage.startY }}
          goal={{ x: stage.goalX, y: stage.goalY }}
          mascot={pos}
          mascotAnimMs={animMs}
        />
      </div>

      <div className={styles.dpad} role="group" aria-label="方向操作">
        <button type="button" className={`${styles.dpadBtn} ${styles.dUp}`} aria-label="上へ" onClick={() => tryMove('up')} disabled={isAnimating}>
          ↑
        </button>
        <button type="button" className={`${styles.dpadBtn} ${styles.dLeft}`} aria-label="左へ" onClick={() => tryMove('left')} disabled={isAnimating}>
          ←
        </button>
        <button type="button" className={`${styles.dpadBtn} ${styles.dRight}`} aria-label="右へ" onClick={() => tryMove('right')} disabled={isAnimating}>
          →
        </button>
        <button type="button" className={`${styles.dpadBtn} ${styles.dDown}`} aria-label="下へ" onClick={() => tryMove('down')} disabled={isAnimating}>
          ↓
        </button>
      </div>

      <div className={styles.row}>
        <button type="button" className={styles.btn} onClick={reset}>
          リセット
        </button>
        <button type="button" className={styles.btn} onClick={onClose}>
          編集に戻る
        </button>
      </div>
      <p className={styles.hint}>矢印キー / WASD / D-pad で操作。ゴール（G）で止まればクリア。</p>
    </div>
  );
}

/** StageData の data テキストを 2D タイル配列へ。 */
function decodeTiles(stage: StageData) {
  return stage.data.split(',').map((row) => Array.from(row, (ch) => (ch.charCodeAt(0) - 48) as 0 | 1 | 2));
}
