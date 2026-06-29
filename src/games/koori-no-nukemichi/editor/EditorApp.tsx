'use client';

/**
 * こおりのぬけみち エディタ アプリ本体（クライアント専用 / 全画面・夜テーマ固定）。
 * - admin 判定でガード（createAuthProvider().getSession().isAdmin）。
 *   非 admin はログイン誘導。dev スタブでは常に admin 扱い。
 * - 章（world）一覧 ＋ CRUD と、ステージ編集（StageEditor）を内部状態で切替。
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { createAuthProvider, type AuthSession } from '../auth';
import type { StageData } from '../core';
import { createStageRepository, type StageSummary, type World } from '../data';
import { StageEditor } from './StageEditor';
import styles from './editor.module.css';

type AuthState = 'checking' | 'admin' | 'guest';
type View = { kind: 'list' } | { kind: 'edit'; worldId: string; stage: StageData | null };

export default function EditorApp() {
  const [repo] = useState(() => createStageRepository());
  const [auth] = useState(() => createAuthProvider());

  const [authState, setAuthState] = useState<AuthState>('checking');
  const [session, setSession] = useState<AuthSession | null>(null);

  const [worlds, setWorlds] = useState<World[]>([]);
  const [stagesByWorld, setStagesByWorld] = useState<Record<string, StageSummary[]>>({});
  const [view, setView] = useState<View>({ kind: 'list' });
  const [newWorldTitle, setNewWorldTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const ws = await repo.listWorlds(true);
      const map: Record<string, StageSummary[]> = {};
      await Promise.all(
        ws.map(async (w) => {
          map[w.id] = await repo.listStages(w.id, true);
        }),
      );
      setWorlds(ws);
      setStagesByWorld(map);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み込みに失敗しました');
    }
  }, [repo]);

  // 認証チェック → admin なら一覧をロード。
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await auth.getSession();
        if (cancelled) return;
        setSession(s);
        if (s.isAdmin) {
          setAuthState('admin');
          await reload();
        } else {
          setAuthState('guest');
        }
      } catch {
        if (!cancelled) setAuthState('guest');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, reload]);

  const signIn = useCallback(() => {
    void auth.signIn();
  }, [auth]);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setSession(null);
    setAuthState('guest');
  }, [auth]);

  /* ---- 章 CRUD ---- */
  const createWorld = useCallback(async () => {
    const title = newWorldTitle.trim();
    if (!title) return;
    await repo.createWorld({ title });
    setNewWorldTitle('');
    await reload();
  }, [newWorldTitle, repo, reload]);

  const renameWorld = useCallback(
    async (w: World) => {
      const title = window.prompt('章のタイトル', w.title);
      if (title === null) return;
      const t = title.trim();
      if (!t) return;
      await repo.updateWorld(w.id, { title: t });
      await reload();
    },
    [repo, reload],
  );

  const toggleWorldPublish = useCallback(
    async (w: World) => {
      await repo.updateWorld(w.id, { published: !w.published });
      await reload();
    },
    [repo, reload],
  );

  const deleteWorld = useCallback(
    async (w: World) => {
      if (!window.confirm(`章「${w.title}」と配下のステージを削除します。よろしいですか？`)) return;
      await repo.deleteWorld(w.id);
      await reload();
    },
    [repo, reload],
  );

  /* ---- ステージを開く ---- */
  const openStage = useCallback(
    async (worldId: string, stageId: string | null) => {
      if (stageId === null) {
        setView({ kind: 'edit', worldId, stage: null });
        return;
      }
      const stage = await repo.getStage(stageId);
      if (stage) setView({ kind: 'edit', worldId, stage });
    },
    [repo],
  );

  // ---- レンダリング ----
  if (authState === 'checking') {
    return (
      <div className={styles.root}>
        <div className={styles.center}>
          <p>確認中…</p>
        </div>
      </div>
    );
  }

  if (authState === 'guest') {
    return (
      <div className={styles.root}>
        <header className={styles.topbar}>
          <h1 className={styles.topbarTitle}>こおりのぬけみち エディタ</h1>
          <span className={styles.topbarSpacer} />
          <Link className={styles.btn} href="/lab/koori-no-nukemichi">
            もどる
          </Link>
        </header>
        <div className={styles.center}>
          <p className={styles.overlayTitle}>管理者ログインが必要です</p>
          <p className={styles.centerNote}>
            このページはステージ作成用の管理画面です。管理者の Google アカウントでログインしてください。
          </p>
          <button type="button" className={styles.btnPrimary} onClick={signIn}>
            Google でログイン
          </button>
        </div>
      </div>
    );
  }

  if (view.kind === 'edit') {
    return (
      <div className={styles.root}>
        <header className={styles.topbar}>
          <h1 className={styles.topbarTitle}>ステージ編集</h1>
          <span className={styles.topbarSpacer} />
          {session?.user ? <span className={styles.userTag}>{session.user.displayName}</span> : null}
        </header>
        <div className={styles.content}>
          <StageEditor
            repo={repo}
            worldId={view.worldId}
            stage={view.stage}
            onBack={() => {
              setView({ kind: 'list' });
              void reload();
            }}
            onChanged={() => void reload()}
            onOpenStage={(s) => setView({ kind: 'edit', worldId: s.worldId, stage: s })}
          />
        </div>
      </div>
    );
  }

  // 一覧
  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <h1 className={styles.topbarTitle}>こおりのぬけみち エディタ</h1>
        <span className={styles.topbarSpacer} />
        {session?.user ? <span className={styles.userTag}>{session.user.displayName}</span> : null}
        <Link className={styles.btn} href="/lab/koori-no-nukemichi">
          もどる
        </Link>
        <button type="button" className={styles.btn} onClick={signOut}>
          ログアウト
        </button>
      </header>

      <div className={styles.content}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <p className={styles.sectionTitle}>章を追加</p>
        <div className={styles.row}>
          <input
            className={styles.input}
            value={newWorldTitle}
            onChange={(e) => setNewWorldTitle(e.target.value)}
            placeholder="章のタイトル"
          />
          <button type="button" className={styles.btn} onClick={createWorld}>
            ＋ 章を作成
          </button>
        </div>

        <p className={styles.sectionTitle}>章とステージ</p>
        {worlds.length === 0 ? <p className={styles.empty}>章がまだありません。</p> : null}

        {worlds.map((w) => {
          const stages = stagesByWorld[w.id] ?? [];
          return (
            <div key={w.id} className={styles.worldCard}>
              <div className={styles.worldHead}>
                <span className={styles.worldName}>{w.title}</span>
                <span
                  className={
                    w.published ? `${styles.badge} ${styles.badgePublished}` : `${styles.badge} ${styles.badgeDraft}`
                  }
                >
                  {w.published ? '公開' : '非公開'}
                </span>
                <span className={styles.topbarSpacer} />
                <button type="button" className={styles.btn} onClick={() => openStage(w.id, null)}>
                  ＋ ステージ
                </button>
                <button type="button" className={styles.btn} onClick={() => renameWorld(w)}>
                  名前
                </button>
                <button type="button" className={styles.btn} onClick={() => toggleWorldPublish(w)}>
                  {w.published ? '非公開に' : '公開に'}
                </button>
                <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => deleteWorld(w)}>
                  削除
                </button>
              </div>

              {stages.length === 0 ? (
                <p className={styles.empty}>ステージがありません。</p>
              ) : (
                <ul className={styles.stageList}>
                  {stages.map((s) => (
                    <li key={s.id} className={styles.stageItem}>
                      <span className={styles.stageItemName}>{s.title}</span>
                      <span
                        className={
                          s.published
                            ? `${styles.badge} ${styles.badgePublished}`
                            : `${styles.badge} ${styles.badgeDraft}`
                        }
                      >
                        {s.published ? '公開' : '下書き'}
                      </span>
                      <button type="button" className={styles.btn} onClick={() => openStage(w.id, s.id)}>
                        編集
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
