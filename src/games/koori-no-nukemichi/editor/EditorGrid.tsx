'use client';

/**
 * 編集・テストプレイ兼用の DOM グリッド（Pixi 非使用 / CSS Modules）。
 * - タイル種別を色で表示。スタート(S)・ゴール(G)・マスコット(●)をオーバーレイ。
 * - interactive=true のとき、クリック＋ドラッグで onPaintCell を発火（塗り）。
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Tile, type TileCode, type Vec2 } from '../core';
import styles from './editor.module.css';

const TILE_COLOR: Record<TileCode, string> = {
  [Tile.Ice]: '#86d2f2',
  [Tile.Wall]: '#1b2138',
  [Tile.Floor]: '#2f8f7d',
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
  /** マスコットの滑走アニメ時間(ms)。0 以下で即時移動（reduced-motion / 初期配置 / リセット）。 */
  mascotAnimMs?: number;
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
  mascotAnimMs = 0,
  interactive = false,
  onPaintCell,
}: EditorGridProps) {
  const paintingRef = useRef(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const mascotElRef = useRef<HTMLSpanElement | null>(null);
  const prevMascotRef = useRef<Vec2 | null>(null);
  // ResizeObserver から最新位置を参照するための ref（effect を毎手再生成しないため）。
  const mascotRef = useRef<Vec2 | null>(mascot);
  mascotRef.current = mascot;

  // 単一のマスコット要素を、対象セルの実測サイズ（offset）にぴったり重ねて配置する。
  // セルの実寸を測るので gap / padding / border の影響を受けず、停止位置に正確に揃う。
  const placeMascot = useCallback((m: Vec2 | null, durationMs: number) => {
    const grid = gridRef.current;
    const el = mascotElRef.current;
    if (!grid || !el || !m) return;
    const cell = grid.querySelector<HTMLElement>(`[data-x="${m.x}"][data-y="${m.y}"]`);
    if (!cell) return;
    el.style.transition =
      durationMs > 0 ? `left ${durationMs}ms ease-out, top ${durationMs}ms ease-out` : 'none';
    el.style.left = `${cell.offsetLeft}px`;
    el.style.top = `${cell.offsetTop}px`;
    el.style.width = `${cell.offsetWidth}px`;
    el.style.height = `${cell.offsetHeight}px`;
  }, []);

  // 移動（mascot 変化）時: 直前位置があり時間指定があれば ease-out 補間。初回配置は即時。
  useLayoutEffect(() => {
    const animate = prevMascotRef.current !== null && mascotAnimMs > 0;
    placeMascot(mascot, animate ? mascotAnimMs : 0);
    prevMascotRef.current = mascot;
  }, [mascot, mascotAnimMs, placeMascot]);

  // リサイズ（セル実寸が変化）時: アニメ無しで即時に再配置して追従させる。
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const ro = new ResizeObserver(() => placeMascot(mascotRef.current, 0));
    ro.observe(grid);
    return () => ro.disconnect();
  }, [placeMascot]);

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
      ref={gridRef}
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
            </div>
          );
        }),
      )}
      {mascot ? (
        <span ref={mascotElRef} className={styles.mascotLayer} aria-hidden="true">
          <span className={styles.mascot} />
        </span>
      ) : null}
    </div>
  );
}
