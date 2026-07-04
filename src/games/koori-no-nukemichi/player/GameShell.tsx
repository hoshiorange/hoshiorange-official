'use client';

/**
 * こおりのぬけみち プレイヤーシェル（クライアント専用 / 全画面・夜テーマ固定）。
 * - 公開済みデータのみ閲覧（listWorlds(false) / listStages(worldId,false) / getStage）。
 * - View = worldSelect | stageSelect | play を内部 state で遷移（EditorApp と同方針）。
 * - プレイは GameApp に盤面とコールバックを渡して委譲（入力・描画・SFX・アニメは GameApp 側）。
 * - クリア記録は localStorage（端末ローカル）。ある章の公開ステージを全クリアで次章が解放される。
 * - env 無し（LocalStageRepository のシード）でも 章→ステージ→プレイ→クリア が通る。
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { StageData } from '../core';
import { createStageRepository, type StageSummary, type World } from '../data';
import GameApp from './GameApp';
import { WorldSelect, type WorldItem } from './WorldSelect';
import { StageSelect } from './StageSelect';
import { loadClearedIds, markCleared } from './progress';
import styles from './GameShell.module.css';

type View =
  | { kind: 'worldSelect' }
  | { kind: 'stageSelect'; world: World }
  | { kind: 'play'; world: World; stages: StageSummary[]; index: number; stage: StageData };

export default function GameShell() {
  const [repo] = useState(() => createStageRepository());
  const [view, setView] = useState<View>({ kind: 'worldSelect' });

  // 章一覧（worldSelect 用）。null = 読み込み中。
  const [worlds, setWorlds] = useState<World[] | null>(null);
  // 章ごとの公開ステージ一覧（章解放判定＋stageSelect 表示に共用）。
  const [stagesByWorld, setStagesByWorld] = useState<Record<string, StageSummary[]>>({});
  const [worldsError, setWorldsError] = useState<string | null>(null);

  // クリア済みステージ id 集合（localStorage 由来）。クライアントでのみ読み出す。
  const [clearedIds, setClearedIds] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    setClearedIds(loadClearedIds());
  }, []);

  // 公開章＋各章の公開ステージをまとめてロード（章解放判定に全章分必要なため）。
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ws = await repo.listWorlds(false);
        const lists = await Promise.all(ws.map((w) => repo.listStages(w.id, false)));
        if (cancelled) return;
        const map: Record<string, StageSummary[]> = {};
        ws.forEach((w, i) => {
          map[w.id] = lists[i];
        });
        setStagesByWorld(map);
        setWorlds(ws);
      } catch (e) {
        if (!cancelled) {
          setWorldsError(e instanceof Error ? e.message : '読み込みに失敗しました');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  // 章解放判定: 第1章は常に解放。直前の章の公開ステージを全クリアで次章が解放。
  const worldItems = useMemo<WorldItem[] | null>(() => {
    if (!worlds) return null;
    return worlds.map((w, i) => {
      const ids = (stagesByWorld[w.id] ?? []).map((s) => s.id);
      const clearedCount = ids.filter((id) => clearedIds.has(id)).length;
      const prev = i > 0 ? worlds[i - 1] : null;
      const locked = prev
        ? !(stagesByWorld[prev.id] ?? []).every((s) => clearedIds.has(s.id))
        : false;
      return { world: w, locked, clearedCount, total: ids.length };
    });
  }, [worlds, stagesByWorld, clearedIds]);

  // 章を選ぶ → 読み込み済みのステージ一覧で stageSelect へ。
  const openWorld = useCallback((world: World) => {
    setView({ kind: 'stageSelect', world });
  }, []);

  // 一覧内インデックスのステージをロードして play へ。
  const playIndex = useCallback(
    async (world: World, list: StageSummary[], index: number) => {
      const summary = list[index];
      if (!summary) return;
      const stage = await repo.getStage(summary.id);
      if (stage) setView({ kind: 'play', world, stages: list, index, stage });
    },
    [repo],
  );

  const selectStage = useCallback(
    (index: number) => {
      if (view.kind !== 'stageSelect') return;
      const list = stagesByWorld[view.world.id];
      if (!list) return;
      void playIndex(view.world, list, index);
    },
    [view, stagesByWorld, playIndex],
  );

  const exitPlay = useCallback(() => {
    if (view.kind !== 'play') return;
    setView({ kind: 'stageSelect', world: view.world });
  }, [view]);

  const selectNext = useCallback(() => {
    if (view.kind !== 'play') return;
    void playIndex(view.world, view.stages, view.index + 1);
  }, [view, playIndex]);

  // クリア確定 → localStorage に記録し、解放判定用の集合を更新する。
  const handleCleared = useCallback((stageId: string) => {
    markCleared(stageId);
    setClearedIds((prev) => {
      if (prev.has(stageId)) return prev;
      const next = new Set(prev);
      next.add(stageId);
      return next;
    });
  }, []);

  // プレイ中は GameApp が全画面 fixed で描画する（シェルの枠は出さない）。
  if (view.kind === 'play') {
    const hasNext = view.index + 1 < view.stages.length;
    return (
      <GameApp
        key={view.stage.id}
        stage={view.stage}
        onExit={exitPlay}
        onCleared={handleCleared}
        onSelectNext={hasNext ? selectNext : undefined}
      />
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        {view.kind === 'stageSelect' ? (
          <button
            type="button"
            className={styles.back}
            onClick={() => setView({ kind: 'worldSelect' })}
          >
            <span aria-hidden="true">←</span> 章えらびへ
          </button>
        ) : (
          <Link className={styles.back} href="/#lab">
            <span aria-hidden="true">←</span> もどる
          </Link>
        )}
        <h1 className={styles.title}>こおりのぬけみち</h1>
        <span className={styles.spacer} />
      </header>

      {view.kind === 'worldSelect' ? (
        <WorldSelect items={worldItems} error={worldsError} onSelect={openWorld} />
      ) : (
        <StageSelect
          world={view.world}
          stages={stagesByWorld[view.world.id] ?? null}
          clearedIds={clearedIds}
          error={worldsError}
          onSelect={selectStage}
        />
      )}
    </div>
  );
}
