/**
 * アセットマニフェスト。
 * 「論理名 → 仮素材（差し替え用）パス」のマップ。
 * 実素材ができたら、同じ公開パスにファイルを置く（または src を書き換える）だけで差し替わる。
 *
 * M0 のプレイヤーはタイル/マスコットを Pixi の図形（プリミティブ）で描くため、
 * 各エントリの `color`（暫定パレット）を実際に使用する。実素材（画像）導入後は
 * `src` のテクスチャ読み込みに置き換える想定。
 *
 * SFX は M0 では既定ミュート・音ファイル未配置。論理名とパスだけ定義しておく。
 */

export type ImageAssetKey = 'ice' | 'wall' | 'floor' | 'mascot' | 'goal' | 'background';
export type AudioAssetKey = 'sfx_slide' | 'sfx_stop' | 'sfx_clear';
export type AssetKey = ImageAssetKey | AudioAssetKey;

export interface ImageAsset {
  kind: 'image';
  /** 仮素材の公開パス（/public 配下）。実素材を同じパスに置けば差し替わる。 */
  src: string;
  /** M0 のプリミティブ描画で使う暫定カラー（16 進数）。 */
  color: number;
}

export interface AudioAsset {
  kind: 'audio';
  /** 仮素材（音）の公開パス。M0 では未配置。 */
  src: string;
}

export type AssetEntry = ImageAsset | AudioAsset;

const BASE = '/games/koori-no-nukemichi/placeholders';

export const assetManifest: Record<ImageAssetKey, ImageAsset> & Record<AudioAssetKey, AudioAsset> = {
  // 画像系（M0 は color を使用）
  ice: { kind: 'image', src: `${BASE}/ice.svg`, color: 0x7fb8e6 },
  wall: { kind: 'image', src: `${BASE}/wall.svg`, color: 0x2a3358 },
  floor: { kind: 'image', src: `${BASE}/floor.svg`, color: 0x49507a },
  mascot: { kind: 'image', src: `${BASE}/mascot.svg`, color: 0xff8c2a },
  goal: { kind: 'image', src: `${BASE}/goal.svg`, color: 0xffd27f },
  background: { kind: 'image', src: `${BASE}/background.svg`, color: 0x060814 },

  // 音系（M0 は未使用 / 既定ミュート）
  sfx_slide: { kind: 'audio', src: `${BASE}/sfx_slide.mp3` },
  sfx_stop: { kind: 'audio', src: `${BASE}/sfx_stop.mp3` },
  sfx_clear: { kind: 'audio', src: `${BASE}/sfx_clear.mp3` },
};
