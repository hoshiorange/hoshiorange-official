'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  COMMENT_BODY_MAX,
  COMMENT_NAME_MAX,
  fetchComments,
  postComment,
  type BlogComment,
} from '@/lib/blogComments';
import styles from './BlogComments.module.css';

type LoadState = 'loading' | 'ready' | 'unavailable';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 記事下のコメント欄（一覧＋投稿フォーム、匿名可）。 */
export function BlogComments({ slug }: { slug: string }) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    const result = await fetchComments(slug);
    if (result.ok) {
      setComments(result.comments);
      setLoadState('ready');
    } else {
      setLoadState('unavailable');
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setErrorMessage('');

    const result = await postComment(slug, name, body);
    if (result.ok) {
      setBody('');
      await load();
    } else {
      setErrorMessage(result.message);
    }
    setSending(false);
  }

  return (
    <section className={styles.comments} aria-label="コメント">
      <h2 className={styles.heading}>コメント{loadState === 'ready' && comments.length > 0 ? `（${comments.length}）` : ''}</h2>

      {loadState === 'unavailable' ? (
        <p className={styles.muted}>コメント機能は現在準備中です。</p>
      ) : (
        <>
          {loadState === 'loading' ? (
            <p className={styles.muted}>読み込み中…</p>
          ) : comments.length === 0 ? (
            <p className={styles.muted}>まだコメントはありません。最初のコメントをどうぞ！</p>
          ) : (
            <ul className={styles.list}>
              {comments.map((comment) => (
                <li key={comment.id} className={styles.item}>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemName}>{comment.name || '名無しさん'}</span>
                    <time className={styles.itemDate} dateTime={comment.createdAt}>
                      {formatDate(comment.createdAt)}
                    </time>
                  </div>
                  <p className={styles.itemBody}>{comment.body}</p>
                </li>
              ))}
            </ul>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="text"
              className={styles.nameInput}
              placeholder="お名前（空欄で名無しさん）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={COMMENT_NAME_MAX}
              aria-label="お名前（任意）"
              disabled={sending}
            />
            <textarea
              className={styles.bodyInput}
              placeholder="コメントを書く…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={COMMENT_BODY_MAX}
              rows={4}
              required
              aria-label="コメント"
              disabled={sending}
            />
            {errorMessage && (
              <p className={styles.error} role="alert">
                {errorMessage}
              </p>
            )}
            <div className={styles.formFoot}>
              <span className={styles.counter}>
                {body.length}/{COMMENT_BODY_MAX}
              </span>
              <button type="submit" className={styles.submit} disabled={sending || !body.trim()}>
                {sending ? '送信中…' : 'コメントする'}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
