'use client';

import { useEffect, useRef } from 'react';
import { captureUtm, trackLpEvent } from '@/lib/lpTracking';

/** LP 到達時に UTM を保存し view イベントを1回だけ記録する（表示なし）。 */
export function LpAnalytics({ product }: { product: string }) {
  const fired = useRef(false);

  useEffect(() => {
    // React Strict Mode の二重実行で view が2重計上されないようガード
    if (fired.current) return;
    fired.current = true;
    captureUtm();
    void trackLpEvent(product, 'view');
  }, [product]);

  return null;
}
