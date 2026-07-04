/**
 * クリア進捗の永続化（localStorage / 端末ローカル）。
 *
 * プレイヤーはログイン不要なので、クリア済みステージ id の集合を端末の
 * localStorage に保存する。SSR（window 不在）でも壊れないようガードする。
 *
 * 章解放（次章アンロック）の判定は GameShell 側で、ここで読み出した
 * クリア集合と各章の公開ステージ id 一覧を突き合わせて行う。
 */

const STORAGE_KEY = 'koori-no-nukemichi:cleared';

/** クリア済みステージ id の集合を読み出す（未保存・SSR 時は空集合）。 */
export function loadClearedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    // 壊れた値・アクセス不可（プライベートモード等）は空として扱う。
    return new Set();
  }
}

/**
 * ステージをクリア済みとして記録する。
 * 既に記録済みなら何もしない。新しい集合を返す（呼び出し側の state 更新用）。
 */
export function markCleared(stageId: string): Set<string> {
  const current = loadClearedIds();
  if (current.has(stageId)) return current;
  current.add(stageId);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current]));
    } catch {
      // 保存失敗（容量・プライベートモード等）は無視（メモリ上の集合は返す）。
    }
  }
  return current;
}
