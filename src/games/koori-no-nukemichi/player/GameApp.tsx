'use client';

/**
 * こおりのぬけみち M0 プレイヤー本体（クライアント専用）。
 * - ゲームロジックは core の GameEngine に委譲。描画は BoardRenderer(Pixi v8) に委譲。
 * - 本コンポーネントは「ステージ読込 → Pixi 初期化 → 入力 → 状態表示」の取りまとめのみ担う。
 * - 全画面・夜テーマ固定の没入レイアウト（M2 の本実装の先行プロトタイプ）。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Application } from 'pixi.js';
import { GameEngine, type Direction, type StageData } from '../core';
import { createStageRepository } from '../data';
import { assetManifest } from '../assets/manifest';
import { BoardRenderer } from './BoardRenderer';
import { useSfx } from './useSfx';
import styles from './GameApp.module.css';

const FIRST_STAGE_ID = 's1';
const PER_CELL_MS = 55;
const MIN_SLIDE_MS = 90;
const MAX_SLIDE_MS = 520;
const SWIPE_THRESHOLD = 28;

type Status = 'loading' | 'ready' | 'error';

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

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function GameApp({ stageId = FIRST_STAGE_ID }: { stageId?: string }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const rendererRef = useRef<BoardRenderer | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animatingRef = useRef(false);

  const [status, setStatus] = useState<Status>('loading');
  const [stage, setStage] = useState<StageData | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { play } = useSfx(); // M0 既定ミュート

  // 1) リポジトリ経由でステージを読み込む。
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    createStageRepository()
      .getStage(stageId)
      .then((s) => {
        if (cancelled) return;
        if (!s) {
          setStatus('error');
          return;
        }
        setStage(s);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [stageId]);

  // 2) ステージ確定後に Pixi を初期化（クライアント専用）。
  useEffect(() => {
    if (!stage || status !== 'ready') return;
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let app: Application | null = null;
    let renderer: BoardRenderer | null = null;
    let observer: ResizeObserver | null = null;

    const init = async () => {
      const a = new Application();
      await a.init({
        background: assetManifest.background.color,
        antialias: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
        autoDensity: true,
        width: Math.max(1, mount.clientWidth),
        height: Math.max(1, mount.clientHeight),
      });
      if (cancelled) {
        a.destroy(true, { children: true });
        return;
      }
      app = a;
      appRef.current = a;
      mount.appendChild(a.canvas);

      const engine = new GameEngine(stage);
      engineRef.current = engine;
      const r = new BoardRenderer(a, engine.board, engine.goal, engine.start);
      renderer = r;
      rendererRef.current = r;
      r.layout(mount.clientWidth, mount.clientHeight);

      setMoveCount(0);
      setCleared(false);
      setCanUndo(false);

      observer = new ResizeObserver(() => {
        if (!app) return;
        const w = Math.max(1, mount.clientWidth);
        const h = Math.max(1, mount.clientHeight);
        app.renderer.resize(w, h);
        r.layout(w, h);
      });
      observer.observe(mount);
    };
    void init();

    return () => {
      cancelled = true;
      observer?.disconnect();
      renderer?.destroy();
      app?.destroy(true, { children: true });
      rendererRef.current = null;
      appRef.current = null;
      engineRef.current = null;
      animatingRef.current = false;
    };
  }, [stage, status]);

  // 入力 → 1 手適用（滑走アニメ中は無視）。
  const tryMove = useCallback(
    (dir: Direction) => {
      const engine = engineRef.current;
      const renderer = rendererRef.current;
      if (!engine || !renderer || animatingRef.current) return;

      const outcome = engine.move(dir);
      if (!outcome.moved) return; // 動けない入力は無視

      play('sfx_slide');
      animatingRef.current = true;
      setIsAnimating(true);

      const cells = outcome.path.length;
      const duration = prefersReducedMotion()
        ? 0
        : Math.min(MAX_SLIDE_MS, Math.max(MIN_SLIDE_MS, cells * PER_CELL_MS));

      renderer.tweenMascot(outcome.from, outcome.stop, duration, () => {
        animatingRef.current = false;
        setIsAnimating(false);
        setMoveCount(engine.moveCount);
        setCanUndo(engine.canUndo);
        if (outcome.cleared) {
          setCleared(true);
          play('sfx_clear');
        } else {
          play('sfx_stop');
        }
      });
    },
    [play],
  );

  // キーボード（矢印 / WASD）。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.code];
      if (!dir) return;
      e.preventDefault();
      tryMove(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove]);

  // スワイプ（M0 簡易実装）。
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let sx = 0;
    let sy = 0;
    let tracking = false;
    const down = (e: PointerEvent) => {
      tracking = true;
      sx = e.clientX;
      sy = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? 'right' : 'left');
      else tryMove(dy > 0 ? 'down' : 'up');
    };
    mount.addEventListener('pointerdown', down);
    mount.addEventListener('pointerup', up);
    return () => {
      mount.removeEventListener('pointerdown', down);
      mount.removeEventListener('pointerup', up);
    };
  }, [tryMove]);

  const handleUndo = useCallback(() => {
    const engine = engineRef.current;
    const renderer = rendererRef.current;
    if (!engine || !renderer || animatingRef.current) return;
    if (!engine.undo()) return;
    renderer.setMascotCell(engine.position);
    setMoveCount(engine.moveCount);
    setCleared(engine.cleared);
    setCanUndo(engine.canUndo);
  }, []);

  const handleReset = useCallback(() => {
    const engine = engineRef.current;
    const renderer = rendererRef.current;
    if (!engine || !renderer || animatingRef.current) return;
    engine.reset();
    renderer.setMascotCell(engine.position);
    setMoveCount(0);
    setCleared(false);
    setCanUndo(false);
  }, []);

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <Link className={styles.back} href="/#lab">
          <span aria-hidden="true">←</span> もどる
        </Link>
        <h1 className={styles.title}>
          こおりのぬけみち
          {stage ? <span className={styles.stageName}>{stage.title}</span> : null}
        </h1>
        <span className={styles.moves} aria-hidden="true">
          手数 <strong>{moveCount}</strong>
        </span>
      </header>

      <div ref={mountRef} className={styles.canvas} aria-label="ゲーム盤面" role="img" />

      {/* 操作系（DOM オーバーレイ）。 */}
      <div className={styles.controls}>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleUndo}
            disabled={!canUndo || isAnimating}
          >
            1手もどす
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleReset}
            disabled={isAnimating}
          >
            リセット
          </button>
        </div>

        <div className={styles.dpad} role="group" aria-label="方向操作">
          <button
            type="button"
            className={`${styles.dpadBtn} ${styles.dUp}`}
            aria-label="上へ"
            onClick={() => tryMove('up')}
            disabled={isAnimating}
          >
            ↑
          </button>
          <button
            type="button"
            className={`${styles.dpadBtn} ${styles.dLeft}`}
            aria-label="左へ"
            onClick={() => tryMove('left')}
            disabled={isAnimating}
          >
            ←
          </button>
          <button
            type="button"
            className={`${styles.dpadBtn} ${styles.dRight}`}
            aria-label="右へ"
            onClick={() => tryMove('right')}
            disabled={isAnimating}
          >
            →
          </button>
          <button
            type="button"
            className={`${styles.dpadBtn} ${styles.dDown}`}
            aria-label="下へ"
            onClick={() => tryMove('down')}
            disabled={isAnimating}
          >
            ↓
          </button>
        </div>
      </div>

      {/* 状態の読み上げ（スクリーンリーダー向け）。 */}
      <p className={styles.srOnly} role="status" aria-live="polite">
        {status === 'loading'
          ? '読み込み中'
          : cleared
            ? `クリア！ ${moveCount} 手`
            : `手数 ${moveCount}`}
      </p>

      {status === 'error' ? (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <p className={styles.cardTitle}>ステージを読み込めませんでした</p>
            <Link className={styles.primaryBtn} href="/#lab">
              もどる
            </Link>
          </div>
        </div>
      ) : null}

      {cleared ? (
        <div className={styles.overlay}>
          <div className={styles.card}>
            <p className={styles.clearLabel}>CLEAR!</p>
            <p className={styles.cardTitle}>クリア！</p>
            <p className={styles.cardSub}>{moveCount} 手でゴール</p>
            <div className={styles.cardActions}>
              <button type="button" className={styles.primaryBtn} onClick={handleReset}>
                もう一度
              </button>
              <Link className={styles.ghostBtn} href="/#lab">
                もどる
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
