'use client';

/**
 * 章（world）選択画面（DOM / CSS Modules）。
 * 公開済みの章を表示する。各章の解放状態（前章を全クリアで解放）と
 * クリア進捗（x/y）を出し、未解放の章はロック表示＋選択不可にする。
 */

import type { World } from '../data';
import styles from './GameShell.module.css';

/** 1 章ぶんの表示メタ（解放状態・進捗込み）。 */
export interface WorldItem {
  world: World;
  /** 未解放（前章未クリア）なら true。 */
  locked: boolean;
  /** この章でクリア済みのステージ数。 */
  clearedCount: number;
  /** この章の公開ステージ総数。 */
  total: number;
}

export interface WorldSelectProps {
  /** 表示する章アイテム一覧。null は読み込み中。 */
  items: WorldItem[] | null;
  error: string | null;
  onSelect: (world: World) => void;
}

export function WorldSelect({ items, error, onSelect }: WorldSelectProps) {
  return (
    <div className={styles.content}>
      <p className={styles.lead}>あそぶ章をえらんでください。</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {items === null ? (
        <p className={styles.loading}>読み込み中…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>あそべる章がまだありません。</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item, i) => {
            const { world, locked, clearedCount, total } = item;
            const completed = total > 0 && clearedCount >= total;
            return (
              <li key={world.id}>
                <button
                  type="button"
                  className={`${styles.itemBtn} ${locked ? styles.itemLocked : ''}`}
                  onClick={() => onSelect(world)}
                  disabled={locked}
                  aria-disabled={locked}
                >
                  <span className={styles.index} aria-hidden="true">
                    {locked ? '🔒' : i + 1}
                  </span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemTitle}>{world.title}</span>
                    <span className={styles.itemMeta}>
                      {locked
                        ? '前の章をクリアで解放'
                        : completed
                          ? `クリア済み（${clearedCount}/${total}）`
                          : `${clearedCount}/${total} クリア`}
                    </span>
                  </span>
                  {completed && !locked ? (
                    <span className={styles.clearMark} aria-label="全クリア">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
