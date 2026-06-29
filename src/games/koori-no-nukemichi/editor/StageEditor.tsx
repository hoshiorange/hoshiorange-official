'use client';

/**
 * ステージエディタ（DOM / CSS Modules）。
 * - タイルパレット（氷/壁/床）クリック＋ドラッグ塗り、スタート/ゴール配置（各1）。
 * - リサイズ（全クリア）。core の encode/decode で "111,101,121" と相互変換。
 * - テストプレイ（core の GameEngine）。作成者が実クリアして初めて公開解放（author_moves 保存）。
 * - 下書き保存 / 公開。公開後は盤面ロック（メタのみ編集可・複製可）。
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Tile,
  decodeBoard,
  encodeBoard,
  type Board,
  type Direction,
  type StageData,
  type TileCode,
  type Vec2,
} from '../core';
import type { CreateStageInput, StageRepository } from '../data';
import { EditorGrid } from './EditorGrid';
import { TestPlay } from './TestPlay';
import styles from './editor.module.css';

const MIN_DIM = 2;
const MAX_DIM = 15;

type Tool = 'ice' | 'wall' | 'floor' | 'start' | 'goal';

const TOOL_TILE: Record<'ice' | 'wall' | 'floor', TileCode> = {
  ice: Tile.Ice,
  wall: Tile.Wall,
  floor: Tile.Floor,
};
const SWATCH: Record<'ice' | 'wall' | 'floor', string> = {
  ice: '#7fb8e6',
  wall: '#2a3358',
  floor: '#49507a',
};

export interface StageEditorProps {
  repo: StageRepository;
  worldId: string;
  /** 編集対象（既存）。新規作成時は null。 */
  stage: StageData | null;
  onBack: () => void;
  /** 一覧の再取得が必要になったとき。 */
  onChanged: () => void;
  /** 別のステージ（複製先など）を開く。 */
  onOpenStage: (stage: StageData) => void;
}

function blankTiles(width: number, height: number): TileCode[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => Tile.Ice as TileCode));
}

function clampDim(n: number): number {
  if (Number.isNaN(n)) return MIN_DIM;
  return Math.max(MIN_DIM, Math.min(MAX_DIM, Math.floor(n)));
}

function tilesToBoard(tiles: TileCode[][], width: number, height: number): Board {
  return { width, height, tiles };
}

export function StageEditor({ repo, worldId, stage, onBack, onChanged, onOpenStage }: StageEditorProps) {
  const initial = useMemo(() => {
    if (stage) {
      const board = decodeBoard(stage.data, stage.width, stage.height);
      return {
        title: stage.title,
        width: stage.width,
        height: stage.height,
        tiles: board.tiles,
        start: { x: stage.startX, y: stage.startY } as Vec2,
        goal: { x: stage.goalX, y: stage.goalY } as Vec2,
        published: stage.published ?? false,
      };
    }
    const w = 5;
    const h = 5;
    return {
      title: '',
      width: w,
      height: h,
      tiles: blankTiles(w, h),
      start: { x: 0, y: 0 } as Vec2,
      goal: { x: w - 1, y: h - 1 } as Vec2,
      published: false,
    };
  }, [stage]);

  const [stageId, setStageId] = useState<string | null>(stage?.id ?? null);
  const [published, setPublished] = useState(initial.published);
  const [title, setTitle] = useState(initial.title);
  const [width, setWidth] = useState(initial.width);
  const [height, setHeight] = useState(initial.height);
  const [tiles, setTiles] = useState<TileCode[][]>(initial.tiles);
  const [start, setStart] = useState<Vec2>(initial.start);
  const [goal, setGoal] = useState<Vec2>(initial.goal);

  const [tool, setTool] = useState<Tool>('wall');
  const [widthInput, setWidthInput] = useState(String(initial.width));
  const [heightInput, setHeightInput] = useState(String(initial.height));

  const [testing, setTesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // 公開解放: テストプレイでクリアした手順と、その時点の盤面シグネチャ。
  const [verifiedMoves, setVerifiedMoves] = useState<Direction[] | null>(stage?.published ? (stage.authorMoves ?? null) : null);
  const verifiedSigRef = useRef<string | null>(null);

  const currentData = useMemo(() => encodeBoard(tilesToBoard(tiles, width, height)), [tiles, width, height]);
  const currentSig = useMemo(
    () => `${width}x${height}|${currentData}|${start.x},${start.y}|${goal.x},${goal.y}`,
    [width, height, currentData, start, goal],
  );

  const locked = published; // 公開後は盤面ロック
  // 公開可: 未ロック かつ テストプレイでクリア済み かつ その盤面が今と同じ。
  const canPublish = !locked && verifiedMoves !== null && verifiedSigRef.current === currentSig;

  // 盤面塗り。
  const handlePaint = useCallback(
    (x: number, y: number) => {
      if (locked) return;
      setInfo(null);
      if (tool === 'start') {
        setStart({ x, y });
        return;
      }
      if (tool === 'goal') {
        setGoal({ x, y });
        return;
      }
      const code = TOOL_TILE[tool];
      setTiles((prev) => {
        if (prev[y]?.[x] === code) return prev;
        const next = prev.map((row) => [...row]);
        next[y][x] = code;
        return next;
      });
    },
    [tool, locked],
  );

  const applyResize = useCallback(() => {
    const w = clampDim(Number(widthInput));
    const h = clampDim(Number(heightInput));
    if (w === width && h === height) return;
    if (!window.confirm(`サイズを ${w}×${h} に変更すると盤面が全クリアされます。よろしいですか？`)) {
      setWidthInput(String(width));
      setHeightInput(String(height));
      return;
    }
    setWidth(w);
    setHeight(h);
    setTiles(blankTiles(w, h));
    setStart({ x: 0, y: 0 });
    setGoal({ x: w - 1, y: h - 1 });
    setVerifiedMoves(null);
    verifiedSigRef.current = null;
  }, [widthInput, heightInput, width, height]);

  const validate = useCallback((): string | null => {
    if (!title.trim()) return 'タイトルを入力してください';
    const inB = (v: Vec2) => v.x >= 0 && v.y >= 0 && v.x < width && v.y < height;
    if (!inB(start)) return 'スタートが盤面外です';
    if (!inB(goal)) return 'ゴールが盤面外です';
    if (start.x === goal.x && start.y === goal.y) return 'スタートとゴールを別のマスにしてください';
    return null;
  }, [title, start, goal, width, height]);

  /** 下書きを保存（新規は作成、既存は更新）。保存後の StageData を返す。 */
  const saveDraft = useCallback(async (): Promise<StageData | null> => {
    const v = validate();
    if (v) {
      setError(v);
      return null;
    }
    setError(null);
    setBusy(true);
    try {
      let saved: StageData;
      if (stageId === null) {
        const input: CreateStageInput = {
          worldId,
          title: title.trim(),
          width,
          height,
          startX: start.x,
          startY: start.y,
          goalX: goal.x,
          goalY: goal.y,
          data: currentData,
        };
        saved = await repo.createStage(input);
        setStageId(saved.id);
      } else {
        saved = await repo.updateStage(stageId, {
          title: title.trim(),
          width,
          height,
          startX: start.x,
          startY: start.y,
          goalX: goal.x,
          goalY: goal.y,
          data: currentData,
        });
      }
      setPublished(saved.published ?? false);
      setInfo('保存しました（下書き）');
      onChanged();
      return saved;
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
      return null;
    } finally {
      setBusy(false);
    }
  }, [validate, stageId, worldId, title, width, height, start, goal, currentData, repo, onChanged]);

  const openTest = useCallback(() => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setTesting(true);
  }, [validate]);

  const handleClear = useCallback(
    (moves: Direction[]) => {
      setVerifiedMoves(moves);
      verifiedSigRef.current = currentSig;
      setInfo(`テストプレイでクリア（${moves.length} 手）。公開できます。`);
    },
    [currentSig],
  );

  const publish = useCallback(async () => {
    if (verifiedMoves === null || verifiedSigRef.current !== currentSig) {
      setError('公開前にテストプレイでクリアしてください（盤面を変更した場合は再テスト）');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await saveDraft();
      if (!saved) return;
      await repo.publishStage(saved.id, verifiedMoves);
      setPublished(true);
      setInfo('公開しました');
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : '公開に失敗しました');
    } finally {
      setBusy(false);
    }
  }, [verifiedMoves, currentSig, saveDraft, repo, onChanged]);

  const duplicate = useCallback(async () => {
    if (stageId === null) return;
    setBusy(true);
    setError(null);
    try {
      const copy = await repo.duplicateStage(stageId);
      onChanged();
      onOpenStage(copy);
    } catch (e) {
      setError(e instanceof Error ? e.message : '複製に失敗しました');
    } finally {
      setBusy(false);
    }
  }, [stageId, repo, onChanged, onOpenStage]);

  const remove = useCallback(async () => {
    if (stageId === null) {
      onBack();
      return;
    }
    if (!window.confirm('この下書きを削除します。よろしいですか？')) return;
    setBusy(true);
    setError(null);
    try {
      await repo.deleteStage(stageId);
      onChanged();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
      setBusy(false);
    }
  }, [stageId, repo, onChanged, onBack]);

  const stageForTest: StageData = {
    id: stageId ?? 'preview',
    worldId,
    title: title || 'preview',
    width,
    height,
    startX: start.x,
    startY: start.y,
    goalX: goal.x,
    goalY: goal.y,
    data: currentData,
  };

  return (
    <div>
      <div className={styles.row} style={{ marginBottom: '1rem' }}>
        <button type="button" className={styles.btn} onClick={onBack} disabled={busy}>
          ← 一覧へ
        </button>
        <span className={locked ? `${styles.badge} ${styles.badgePublished}` : `${styles.badge} ${styles.badgeDraft}`}>
          {locked ? '公開済み（盤面ロック）' : '下書き'}
        </span>
      </div>

      <div className={styles.editorLayout}>
        <div className={styles.gridWrap}>
          <EditorGrid
            width={width}
            height={height}
            tiles={tiles}
            start={start}
            goal={goal}
            interactive={!locked}
            onPaintCell={handlePaint}
          />
        </div>

        <div className={styles.panel}>
          <label className={styles.label}>
            タイトル
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ステージ名"
            />
          </label>

          {!locked ? (
            <>
              <div>
                <p className={styles.label} style={{ marginBottom: '0.35rem' }}>
                  タイル（クリック＋ドラッグで塗る）
                </p>
                <div className={styles.palette}>
                  {(['ice', 'wall', 'floor'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.btn} ${styles.toolBtn} ${tool === t ? styles.toolBtnActive : ''}`}
                      onClick={() => setTool(t)}
                    >
                      <span className={styles.swatch} style={{ backgroundColor: SWATCH[t] }} />
                      {t === 'ice' ? 'こおり' : t === 'wall' ? 'かべ' : 'ゆか'}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.palette}>
                <button
                  type="button"
                  className={`${styles.btn} ${tool === 'start' ? styles.toolBtnActive : ''}`}
                  onClick={() => setTool('start')}
                >
                  スタート(S)
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${tool === 'goal' ? styles.toolBtnActive : ''}`}
                  onClick={() => setTool('goal')}
                >
                  ゴール(G)
                </button>
              </div>

              <div>
                <p className={styles.label} style={{ marginBottom: '0.35rem' }}>
                  サイズ（変更で全クリア）
                </p>
                <div className={styles.row}>
                  <input
                    className={`${styles.input} ${styles.inputNum}`}
                    type="number"
                    min={MIN_DIM}
                    max={MAX_DIM}
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    aria-label="幅"
                  />
                  <span aria-hidden="true">×</span>
                  <input
                    className={`${styles.input} ${styles.inputNum}`}
                    type="number"
                    min={MIN_DIM}
                    max={MAX_DIM}
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    aria-label="高さ"
                  />
                  <button type="button" className={styles.btn} onClick={applyResize}>
                    適用
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className={styles.hint}>
              公開済みのため盤面は編集できません。盤面を変えたい場合は「複製」して新しい下書きを作ってください。
            </p>
          )}

          <div className={styles.row}>
            <button type="button" className={styles.btn} onClick={openTest} disabled={busy}>
              ▶ テストプレイ
            </button>
            {!locked ? (
              <button type="button" className={styles.btn} onClick={saveDraft} disabled={busy}>
                下書き保存
              </button>
            ) : null}
          </div>

          <div className={styles.row}>
            {!locked ? (
              <button type="button" className={styles.btnPrimary} onClick={publish} disabled={busy || !canPublish}>
                公開する
              </button>
            ) : (
              <button type="button" className={styles.btn} onClick={duplicate} disabled={busy}>
                複製して作り直す
              </button>
            )}
            {!locked ? (
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={remove} disabled={busy}>
                {stageId === null ? '破棄' : '削除'}
              </button>
            ) : null}
          </div>

          {!locked && !canPublish ? (
            <p className={styles.hint}>※ テストプレイでクリアすると「公開する」が有効になります。</p>
          ) : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {info ? <p className={styles.ok}>{info}</p> : null}
        </div>
      </div>

      {testing ? (
        <TestPlay stage={stageForTest} onClear={handleClear} onClose={() => setTesting(false)} />
      ) : null}
    </div>
  );
}
