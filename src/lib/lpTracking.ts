/**
 * LP の計測（3段ファネル: view / cta_click / signup）と事前登録の送信。
 *
 * - すべてクライアント専用（localStorage / sessionStorage を使用）。サーバーから呼ばないこと。
 * - 匿名訪問者 ID（visitor）でユニーク数を集計できるようにする（個人特定はしない）。
 * - UTM は LP 到達時の URL から取得し、セッション内は cta_click / signup にも引き継ぐ。
 * - env（Supabase）不在時は送信をスキップして静かに no-op（LP 自体は表示できる）。
 */

import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export type LpEventName = 'view' | 'cta_click' | 'signup';

const VISITOR_KEY = 'hoshiorange-lp-visitor';
const UTM_KEY = 'hoshiorange-lp-utm';

interface UtmParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
}

function getVisitorId(): string | null {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = window.crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    // プライベートモード等で storage が使えない場合は匿名 ID なしで計測
    return null;
  }
}

/** LP 到達時に URL の UTM をセッションに保存する（以降のイベントに引き継ぐ）。 */
export function captureUtm(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
    };
    if (utm.source || utm.medium || utm.campaign) {
      window.sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
  } catch {
    /* no-op */
  }
}

function getUtm(): UtmParams {
  try {
    const raw = window.sessionStorage.getItem(UTM_KEY);
    if (raw) return JSON.parse(raw) as UtmParams;
  } catch {
    /* no-op */
  }
  return { source: null, medium: null, campaign: null };
}

/** ファネルイベントを記録する。失敗しても UI には影響させない（fire-and-forget）。 */
export async function trackLpEvent(product: string, event: LpEventName): Promise<void> {
  try {
    const client = await getSupabaseBrowserClient();
    if (!client) return;
    const utm = getUtm();
    await client.from('lp_event').insert({
      product,
      event,
      visitor: getVisitorId(),
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      referrer: document.referrer || null,
      path: window.location.pathname,
    });
  } catch {
    /* 計測はベストエフォート */
  }
}

export type SignupResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; message: string };

/** 事前登録（メール1欄）を送信する。成功時は signup イベントも記録。 */
export async function submitLpSignup(product: string, email: string): Promise<SignupResult> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, message: 'メールアドレスの形式を確認してください。' };
  }

  const client = await getSupabaseBrowserClient();
  if (!client) {
    return { ok: false, message: '現在フォームを準備中です。時間をおいてお試しください。' };
  }

  const utm = getUtm();
  const { error } = await client.from('lp_signup').insert({
    product,
    email: normalized,
    visitor: getVisitorId(),
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
  });

  if (error) {
    // 23505 = unique_violation（同じメールで登録済み）。ユーザーには成功扱いで伝える
    if (error.code === '23505') return { ok: true, duplicate: true };
    return { ok: false, message: '送信に失敗しました。時間をおいてお試しください。' };
  }

  void trackLpEvent(product, 'signup');
  return { ok: true, duplicate: false };
}
