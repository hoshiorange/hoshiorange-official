'use client';

/**
 * 編集・テストプレイ兼用の DOM グリッド（Pixi 非使用 / CSS Modules）。
 * - タイル種別を色で表示。スタート(S)・ゴール(G)・マスコット(●)をオーバーレイ。
 * - interactive=true のとき、クリック＋ドラッグで onPaintCell を発火（塗り）。
 */

import { useCallback, useEffect, useRef } from 'react';
import { Tile, type TileCode, type Vec2 } from '../core';
import styles from './editor.module.css';

const TILE_COLOR: Record<TileCode, string> = {
  [Tile.Ice]: '#7fb8e6',
  [Tile.Wall]: '#2a3358',
  [Tile.Floor]: '#49507a',
};

const TILE_LABEL: Record<TileCode, string> = {
  [Tile.Ice]: 'こおり',
  [Tile.Wall]: 'かべ',
  [Tile.Floor]: 'ゆか',
};

export interface EditorGridProps {
  width: number;
  height: number;
  tiles: TileCode[][];
  start: Vec2;
  goal: Vec2;
  /** プレイ中のマスコット位置（テストプレイ時）。 */
  mascot?: Vec2 | null;
  /** クリック・ドラッグでの塗りを有効にする。 */
  interactive?: boolean;
  /** 塗り対象セルが触れられた時（pointerdown / ドラッグ中の pointerenter）。 */
  onPaintCell?: (x: number, y: number) => void;
}

function eq(a: Vec2 | null | undefined, x: number, y: number): boolean {
  return !!a && a.x === x && a.y === y;
}

export function EditorGrid({
  width,
  height,
  tiles,
  start,
  goal,
  mascot = null,
  interactive = false,
  onPaintCell,
}: EditorGridProps) {
  const paintingRef = useRef(false);

  // ドラッグ終了をウィンドウ全体で拾う（グリッド外で離した場合に備える）。
  useEffect(() => {
    if (!interactive) return;
    const stop = () => {
      paintingRef.current = false;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [interactive]);

  const handleDown = useCallback(
    (x: number, y: number) => {
      if (!interactive) return;
      paintingRef.current = true;
      onPaintCell?.(x, y);
    },
    [interactive, onPaintCell],
  );

  const handleEnter = useCallback(
    (x: number, y: number) => {
      if (!interactive || !paintingRef.current) return;
      onPaintCell?.(x, y);
    },
    [interactive, onPaintCell],
  );

  return (
    <div
      className={styles.grid}
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
        aspectRatio: `${width} / ${height}`,
      }}
      role="grid"
      aria-label="ステージ盤面"
    >
      {Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => {
          const code = (tiles[y]?.[x] ?? Tile.Ice) as TileCode;
          const isStart = eq(start, x, y);
          const isGoal = eq(goal, x, y);
          const isMascot = eq(mascot, x, y);
          return (
            <div
              key={`${x},${y}`}
              className={styles.cell}
              style={{ backgroundColor: TILE_COLOR[code] }}
              role="gridcell"
              aria-label={`${x},${y} ${TILE_LABEL[code]}${isStart ? ' スタート' : ''}${isGoal ? ' ゴール' : ''}`}
              data-x={x}
              data-y={y}
              onPointerDown={() => handleDown(x, y)}
              onPointerEnter={() => handleEnter(x, y)}
            >
              {isGoal ? <span className={`${styles.marker} ${styles.goalMark}`}>G</span> : null}
              {isStart ? <span className={`${styles.marker} ${styles.startMark}`}>S</span> : null}
              {isMascot ? <span className={styles.mascot} aria-hidden="true" /> : null}
            </div>
          );
        }),
      )}
    </div>
  );
}
