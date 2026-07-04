'use client';

import { trackLpEvent } from '@/lib/lpTracking';

interface Props {
  product: string;
  className?: string;
  children: React.ReactNode;
}

/** 登録フォーム（#signup）へのアンカー CTA。クリックで cta_click を記録する。 */
export function LpCtaButton({ product, className, children }: Props) {
  return (
    <a href="#signup" className={className} onClick={() => void trackLpEvent(product, 'cta_click')}>
      {children}
    </a>
  );
}
