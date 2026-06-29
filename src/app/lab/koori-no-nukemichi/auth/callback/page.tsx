'use client';

/**
 * Google OAuth コールバック受け口（クライアント側）。
 *
 * 本アプリの Supabase クライアントは @supabase/supabase-js を localStorage セッション方式
 * （detectSessionInUrl: true / PKCE）で使う。セッションはブラウザ側に保持されるため、
 * サーバー Route Handler ではなくクライアントページでコールバックを受け、
 * URL 中のコード/トークンを処理してからエディタへ戻す（Supabase の SPA 推奨フロー）。
 *
 * env 不在時（Supabase 未設定）はクライアントが null になるので、そのままエディタへ戻す。
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/games/koori-no-nukemichi/data/supabaseClient';

const EDITOR_PATH = '/lab/koori-no-nukemichi/edit';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('ログイン処理中…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const client = await getSupabaseClient();
      if (client) {
        try {
          // detectSessionInUrl により URL のコード/トークンは自動でセッションへ交換される。
          // getSession() の解決を待って確実にセッションを確定させる。
          await client.auth.getSession();
        } catch {
          /* セッション取得に失敗してもエディタ側で再判定する */
        }
      }
      if (!cancelled) {
        setMessage('完了しました。移動します…');
        router.replace(EDITOR_PATH);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060814',
        color: '#e8ecff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p>{message}</p>
    </main>
  );
}
