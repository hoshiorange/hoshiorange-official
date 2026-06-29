'use client';

/**
 * SFX 再生フック。
 * M0 は既定ミュート・音ファイル未配置のため play() は何もしない（配線のみ）。
 * フェーズ後半で muted=false ＋ assetManifest の音源を WebAudio/HTMLAudio で鳴らす。
 */

import { useCallback, useRef } from 'react';
import { assetManifest, type AudioAssetKey } from '../assets/manifest';

export interface UseSfxResult {
  play: (key: AudioAssetKey) => void;
  muted: boolean;
}

export function useSfx(options?: { muted?: boolean }): UseSfxResult {
  const muted = options?.muted ?? true; // M0 既定ミュート
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const play = useCallback((key: AudioAssetKey) => {
    if (mutedRef.current) return;
    // 将来: assetManifest[key].src を読み込んで再生する。
    void assetManifest[key];
  }, []);

  return { play, muted };
}
