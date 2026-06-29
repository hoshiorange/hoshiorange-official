/**
 * Supabase 版ステージリポジトリ（StageRepository 実装）。
 *
 * テーブル / 列名は supabase/schema.sql と一致させる（2 階層: world → stage）:
 *   world(id, title, "order", published, created_at, updated_at)
 *   stage(id, world_id, order_in_world, title, width, height,
 *         startx, starty, goalx, goaly, data, author_moves,
 *         published, created_by, created_at, updated_at)
 *   admins(user_id)
 *
 * 書き込み（insert/update/delete）は RLS で admin のみ許可される前提。
 * env 不在時はファクトリがこのクラスを生成しないが、念のため各メソッドで client を検査する。
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
import { getSupabaseClient } from './supabaseClient';

const WORLD_COLS = 'id, title, "order", published, created_at, updated_at';
const STAGE_COLS =
  'id, world_id, order_in_world, title, width, height, startx, starty, goalx, goaly, data, author_moves, published, created_by, created_at, updated_at';
const STAGE_SUMMARY_COLS = 'id, world_id, order_in_world, title, published';

/* ---- author_moves の直列化（方向列 ⇔ コンパクト文字列 "RDLU"） ---- */

const DIR_TO_CHAR: Record<Direction, string> = { up: 'U', down: 'D', left: 'L', right: 'R' };
const CHAR_TO_DIR: Record<string, Direction> = { U: 'up', D: 'down', L: 'left', R: 'right' };

function serializeMoves(moves: Direction[] | null | undefined): string | null {
  if (!moves || moves.length === 0) return null;
  return moves.map((d) => DIR_TO_CHAR[d]).join('');
}

function parseMoves(raw: unknown): Direction[] | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  const out: Direction[] = [];
  for (const ch of raw) {
    const d = CHAR_TO_DIR[ch];
    if (d) out.push(d);
  }
  return out.length > 0 ? out : null;
}

/* ---- 行 ⇔ ドメイン型のマッピング ---- */

interface WorldRow {
  id: string;
  title: string;
  order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

interface StageRow {
  id: string;
  world_id: string;
  order_in_world: number | null;
  title: string;
  width: number;
  height: number;
  startx: number;
  starty: number;
  goalx: number;
  goaly: number;
  data: string;
  author_moves: string | null;
  published: boolean;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
}

type StageSummaryRow = Pick<StageRow, 'id' | 'world_id' | 'order_in_world' | 'title' | 'published'>;

function worldFromRow(r: WorldRow): World {
  return {
    id: r.id,
    title: r.title,
    order: r.order ?? 0,
    published: !!r.published,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function stageFromRow(r: StageRow): StageData {
  return {
    id: r.id,
    worldId: r.world_id,
    title: r.title,
    width: r.width,
    height: r.height,
    startX: r.startx,
    startY: r.starty,
    goalX: r.goalx,
    goalY: r.goaly,
    data: r.data,
    order: r.order_in_world ?? 0,
    published: !!r.published,
    authorMoves: parseMoves(r.author_moves),
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function summaryFromRow(r: StageSummaryRow): StageSummary {
  return {
    id: r.id,
    worldId: r.world_id,
    title: r.title,
    order: r.order_in_world ?? 0,
    published: !!r.published,
  };
}

export class SupabaseStageRepository implements StageRepository {
  private async client() {
    const c = await getSupabaseClient();
    if (!c) throw new Error('Supabase クライアントを初期化できません（env 未設定）');
    return c;
  }

  /* ---- 章（world） ---- */

  async listWorlds(includeDrafts = false): Promise<World[]> {
    const c = await this.client();
    let q = c.from('world').select(WORLD_COLS).order('order', { ascending: true });
    if (!includeDrafts) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) throw error;
    return ((data as WorldRow[] | null) ?? []).map(worldFromRow);
  }

  async getWorld(worldId: string): Promise<World | null> {
    const c = await this.client();
    const { data, error } = await c.from('world').select(WORLD_COLS).eq('id', worldId).maybeSingle();
    if (error) throw error;
    return data ? worldFromRow(data as WorldRow) : null;
  }

  async createWorld(input: WorldInput): Promise<World> {
    const c = await this.client();
    const payload: Record<string, unknown> = {
      title: input.title,
      published: input.published ?? false,
    };
    if (input.order !== undefined) payload.order = input.order;
    const { data, error } = await c.from('world').insert(payload).select(WORLD_COLS).single();
    if (error) throw error;
    return worldFromRow(data as WorldRow);
  }

  async updateWorld(worldId: string, patch: WorldPatch): Promise<World> {
    const c = await this.client();
    const payload: Record<string, unknown> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.order !== undefined) payload.order = patch.order;
    if (patch.published !== undefined) payload.published = patch.published;
    const { data, error } = await c
      .from('world')
      .update(payload)
      .eq('id', worldId)
      .select(WORLD_COLS)
      .single();
    if (error) throw error;
    return worldFromRow(data as WorldRow);
  }

  async deleteWorld(worldId: string): Promise<void> {
    const c = await this.client();
    const { error } = await c.from('world').delete().eq('id', worldId);
    if (error) throw error;
  }

  /* ---- ステージ ---- */

  async listStages(worldId: string, includeDrafts = false): Promise<StageSummary[]> {
    const c = await this.client();
    let q = c
      .from('stage')
      .select(STAGE_SUMMARY_COLS)
      .eq('world_id', worldId)
      .order('order_in_world', { ascending: true });
    if (!includeDrafts) q = q.eq('published', true);
    const { data, error } = await q;
    if (error) throw error;
    return ((data as StageSummaryRow[] | null) ?? []).map(summaryFromRow);
  }

  async getStage(stageId: string): Promise<StageData | null> {
    const c = await this.client();
    const { data, error } = await c.from('stage').select(STAGE_COLS).eq('id', stageId).maybeSingle();
    if (error) throw error;
    return data ? stageFromRow(data as StageRow) : null;
  }

  async createStage(input: CreateStageInput): Promise<StageData> {
    const c = await this.client();
    const { data: userData } = await c.auth.getUser();
    const payload: Record<string, unknown> = {
      world_id: input.worldId,
      title: input.title,
      width: input.width,
      height: input.height,
      startx: input.startX,
      starty: input.startY,
      goalx: input.goalX,
      goaly: input.goalY,
      data: input.data,
      published: false,
      author_moves: null,
      created_by: userData.user?.id ?? null,
    };
    if (input.order !== undefined) payload.order_in_world = input.order;
    const { data, error } = await c.from('stage').insert(payload).select(STAGE_COLS).single();
    if (error) throw error;
    return stageFromRow(data as StageRow);
  }

  async updateStage(stageId: string, patch: StagePatch): Promise<StageData> {
    const c = await this.client();
    // 公開状態を取得して盤面ロックを判定。
    const { data: cur, error: curErr } = await c
      .from('stage')
      .select('published')
      .eq('id', stageId)
      .single();
    if (curErr) throw curErr;
    const locked = !!(cur as { published: boolean }).published;

    const payload: Record<string, unknown> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.order !== undefined) payload.order_in_world = patch.order;
    if (!locked) {
      if (patch.width !== undefined) payload.width = patch.width;
      if (patch.height !== undefined) payload.height = patch.height;
      if (patch.startX !== undefined) payload.startx = patch.startX;
      if (patch.startY !== undefined) payload.starty = patch.startY;
      if (patch.goalX !== undefined) payload.goalx = patch.goalX;
      if (patch.goalY !== undefined) payload.goaly = patch.goalY;
      if (patch.data !== undefined) payload.data = patch.data;
    }
    const { data, error } = await c
      .from('stage')
      .update(payload)
      .eq('id', stageId)
      .select(STAGE_COLS)
      .single();
    if (error) throw error;
    return stageFromRow(data as StageRow);
  }

  async publishStage(stageId: string, authorMoves: Direction[]): Promise<StageData> {
    if (!authorMoves || authorMoves.length === 0) {
      throw new Error('公開にはテストプレイでのクリア手順（authorMoves）が必要です');
    }
    const c = await this.client();
    const { data, error } = await c
      .from('stage')
      .update({ published: true, author_moves: serializeMoves(authorMoves) })
      .eq('id', stageId)
      .select(STAGE_COLS)
      .single();
    if (error) throw error;
    return stageFromRow(data as StageRow);
  }

  async deleteStage(stageId: string): Promise<void> {
    const c = await this.client();
    const { data: cur, error: curErr } = await c
      .from('stage')
      .select('published')
      .eq('id', stageId)
      .maybeSingle();
    if (curErr) throw curErr;
    if (!cur) return;
    if ((cur as { published: boolean }).published) {
      throw new Error('公開済みステージは削除できません（下書きのみ削除可）');
    }
    const { error } = await c.from('stage').delete().eq('id', stageId);
    if (error) throw error;
  }

  async duplicateStage(stageId: string): Promise<StageData> {
    const src = await this.getStage(stageId);
    if (!src) throw new Error(`ステージが見つかりません: ${stageId}`);
    return this.createStage({
      worldId: src.worldId,
      title: `${src.title} のコピー`,
      width: src.width,
      height: src.height,
      startX: src.startX,
      startY: src.startY,
      goalX: src.goalX,
      goalY: src.goalY,
      data: src.data,
    });
  }
}
