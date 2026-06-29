/**
 * ローカル（インメモリ）ステージリポジトリ。
 * シードを起点に動作し、外部サービス・環境変数を必要としない。
 * upsert はメモリ上のみ反映（プロセス再起動で消える）。永続化は M1 の Supabase アダプタで対応。
 */

import type { StageData } from '../core/types';
import type { ChapterSummary, StageRepository, StageSummary, WorldSummary } from './repository';
import { seedStages, seedWorlds } from './seed';

function toSummary(stage: StageData): StageSummary {
  return {
    id: stage.id,
    worldId: stage.worldId,
    chapterId: stage.chapterId,
    title: stage.title,
    order: stage.order ?? 0,
  };
}

export class LocalStageRepository implements StageRepository {
  private worlds: WorldSummary[];
  private stages: Map<string, StageData>;

  constructor(worlds: WorldSummary[] = seedWorlds, stages: StageData[] = seedStages) {
    // シードを複製して保持（呼び出し側の配列を書き換えない）。
    this.worlds = worlds.map((w) => ({ ...w, chapters: w.chapters.map((c) => ({ ...c })) }));
    this.stages = new Map(stages.map((s) => [s.id, { ...s }]));
  }

  async listWorlds(): Promise<WorldSummary[]> {
    return this.worlds
      .map((w) => ({
        ...w,
        chapters: [...w.chapters].sort(byOrder),
      }))
      .sort(byOrder);
  }

  async listStages(chapterId: string): Promise<StageSummary[]> {
    return [...this.stages.values()]
      .filter((s) => s.chapterId === chapterId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(toSummary);
  }

  async getStage(stageId: string): Promise<StageData | null> {
    const stage = this.stages.get(stageId);
    return stage ? { ...stage } : null;
  }

  async upsertStage(stage: StageData): Promise<StageData> {
    this.stages.set(stage.id, { ...stage });
    return { ...stage };
  }
}

function byOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order;
}
