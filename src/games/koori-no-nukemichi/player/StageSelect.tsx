'use client';

/**
 * ステージ選択画面（DOM / CSS Modules）。
 * 選択中の章に属する公開済みステージを表示する。章が解放されていれば
 * 章内のステージは順ロックせず自由にプレイ可。クリア済みには印を付ける。
 */

import type { StageSummary, World } from '../data';
import styles from './GameShell.module.css';

export interface StageSelectProps {
  world: World;
  /** 公開済みステージ一覧。null は読み込み中。 */
  stages: StageSummary[] | null;
  /** クリア済みステージ id 集合（印の表示に使う）。 */
  clearedIds: Set<string>;
  error: string | null;
  /** 一覧内インデックスで選択を返す（次ステージ遷移に使うため index 渡し）。 */
  onSelect: (index: number) => void;
}

export function StageSelect({ world, stages, clearedIds, error, onSelect }: StageSelectProps) {
  return (
    <div className={styles.content}>
      <p className={styles.lead}>{world.title} ― ステージをえらんでください。</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {stages === null ? (
        <p className={styles.loading}>読み込み中…</p>
      ) : stages.length === 0 ? (
        <p className={styles.empty}>この章にはあそべるステージがまだありません。</p>
      ) : (
        <ul className={styles.list}>
          {stages.map((s, i) => {
            const done = clearedIds.has(s.id);
            return (
              <li key={s.id}>
                <button type="button" className={styles.itemBtn} onClick={() => onSelect(i)}>
                  <span className={styles.index} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={styles.itemTitle}>{s.title}</span>
                  {done ? (
                    <span className={styles.clearMark} aria-label="クリア済み">
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
