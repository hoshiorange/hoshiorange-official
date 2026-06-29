/**
 * ローカル（インメモリ）ステージリポジトリ。
 * シードを起点に動作し、外部サービス・環境変数を必要としない。
 * 変更はメモリ上のみ反映（プロセス／リロードで消える）。永続化は Supabase アダプタが担う。
 *
 * 階層は 2 段（world=章 → stage）。
 */

import type { Direction, StageData } from '../core/types';
import type {
  CreateStageInput,
  StageRepository,
  StageSummary,
  StagePatch,
  World,
  WorldInput,
  WorldPatch,
} from './repository';
import { seedStages, seedWorlds } from './seed';

function toSummary(stage: StageData): StageSummary {
  return {
    id: stage.id,
    worldId: stage.worldId,
    title: stage.title,
    order: stage.order ?? 0,
    published: stage.published ?? false,
  };
}

function byOrderAsc<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order;
}

function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${rand}`;
}

export class LocalStageRepository implements StageRepository {
  private worlds: Map<string, World>;
  private stages: Map<string, StageData>;

  constructor(worlds: World[] = seedWorlds, stages: StageData[] = seedStages) {
    // シードを複製して保持（呼び出し側の配列を書き換えない）。
    this.worlds = new Map(worlds.map((w) => [w.id, { ...w }]));
    this.stages = new Map(stages.map((s) => [s.id, { ...s }]));
  }

  /* ---- 章（world） ---- */

  async listWorlds(includeDrafts = false): Promise<World[]> {
    return [...this.worlds.values()]
      .filter((w) => includeDrafts || w.published)
      .sort(byOrderAsc)
      .map((w) => ({ ...w }));
  }

  async getWorld(worldId: string): Promise<World | null> {
    const w = this.worlds.get(worldId);
    return w ? { ...w } : null;
  }

  async createWorld(input: WorldInput): Promise<World> {
    const nextOrder =
      input.order ?? Math.max(0, ...[...this.worlds.values()].map((w) => w.order)) + 1;
    const now = new Date().toISOString();
    const world: World = {
      id: newId('w'),
      title: input.title,
      order: nextOrder,
      published: input.published ?? false,
      createdAt: now,
      updatedAt: now,
    };
    this.worlds.set(world.id, world);
    return { ...world };
  }

  async updateWorld(worldId: string, patch: WorldPatch): Promise<World> {
    const cur = this.worlds.get(worldId);
    if (!cur) throw new Error(`章が見つかりません: ${worldId}`);
    const next: World = {
      ...cur,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.order !== undefined ? { order: patch.order } : {}),
      ...(patch.published !== undefined ? { published: patch.published } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.worlds.set(worldId, next);
    return { ...next };
  }

  async deleteWorld(worldId: string): Promise<void> {
    this.worlds.delete(worldId);
    // 配下のステージもまとめて削除（孤児防止）。
    for (const [id, s] of this.stages) {
      if (s.worldId === worldId) this.stages.delete(id);
    }
  }

  /* ---- ステージ ---- */

  async listStages(worldId: string, includeDrafts = false): Promise<StageSummary[]> {
    return [...this.stages.values()]
      .filter((s) => s.worldId === worldId && (includeDrafts || (s.published ?? false)))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(toSummary);
  }

  async getStage(stageId: string): Promise<StageData | null> {
    const stage = this.stages.get(stageId);
    return stage ? { ...stage } : null;
  }

  async createStage(input: CreateStageInput): Promise<StageData> {
    const siblings = [...this.stages.values()].filter((s) => s.worldId === input.worldId);
    const nextOrder = input.order ?? Math.max(0, ...siblings.map((s) => s.order ?? 0)) + 1;
    const now = new Date().toISOString();
    const stage: StageData = {
      id: newId('s'),
      worldId: input.worldId,
      title: input.title,
      width: input.width,
      height: input.height,
      startX: input.startX,
      startY: input.startY,
      goalX: input.goalX,
      goalY: input.goalY,
      data: input.data,
      order: nextOrder,
      published: false,
      authorMoves: null,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    };
    this.stages.set(stage.id, stage);
    return { ...stage };
  }

  async updateStage(stageId: string, patch: StagePatch): Promise<StageData> {
    const cur = this.stages.get(stageId);
    if (!cur) throw new Error(`ステージが見つかりません: ${stageId}`);

    // 公開後は盤面ロック（メタ＝title/order のみ反映）。
    const locked = cur.published ?? false;
    const next: StageData = {
      ...cur,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.order !== undefined ? { order: patch.order } : {}),
      ...(!locked && patch.width !== undefined ? { width: patch.width } : {}),
      ...(!locked && patch.height !== undefined ? { height: patch.height } : {}),
      ...(!locked && patch.startX !== undefined ? { startX: patch.startX } : {}),
      ...(!locked && patch.startY !== undefined ? { startY: patch.startY } : {}),
      ...(!locked && patch.goalX !== undefined ? { goalX: patch.goalX } : {}),
      ...(!locked && patch.goalY !== undefined ? { goalY: patch.goalY } : {}),
      ...(!locked && patch.data !== undefined ? { data: patch.data } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.stages.set(stageId, next);
    return { ...next };
  }

  async publishStage(stageId: string, authorMoves: Direction[]): Promise<StageData> {
    const cur = this.stages.get(stageId);
    if (!cur) throw new Error(`ステージが見つかりません: ${stageId}`);
    if (!authorMoves || authorMoves.length === 0) {
      throw new Error('公開にはテストプレイでのクリア手順（authorMoves）が必要です');
    }
    const next: StageData = {
      ...cur,
      published: true,
      authorMoves: [...authorMoves],
      updatedAt: new Date().toISOString(),
    };
    this.stages.set(stageId, next);
    return { ...next };
  }

  async deleteStage(stageId: string): Promise<void> {
    const cur = this.stages.get(stageId);
    if (!cur) return;
    if (cur.published) throw new Error('公開済みステージは削除できません（下書きのみ削除可）');
    this.stages.delete(stageId);
  }

  async duplicateStage(stageId: string): Promise<StageData> {
    const src = this.stages.get(stageId);
    if (!src) throw new Error(`ステージが見つかりません: ${stageId}`);
    const siblings = [...this.stages.values()].filter((s) => s.worldId === src.worldId);
    const nextOrder = Math.max(0, ...siblings.map((s) => s.order ?? 0)) + 1;
    const now = new Date().toISOString();
    const copy: StageData = {
      ...src,
      id: newId('s'),
      title: `${src.title} のコピー`,
      order: nextOrder,
      published: false,
      authorMoves: null,
      createdAt: now,
      updatedAt: now,
    };
    this.stages.set(copy.id, copy);
    return { ...copy };
  }
}
