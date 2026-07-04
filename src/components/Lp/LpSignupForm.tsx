'use client';

import { useState } from 'react';
import { submitLpSignup } from '@/lib/lpTracking';
import styles from './LpSignupForm.module.css';

type Status = 'idle' | 'sending' | 'done' | 'duplicate' | 'error';

interface Props {
  product: string;
  productName: string;
}

/** 事前登録フォーム（メール1欄）。 */
export function LpSignupForm({ product, productName }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');

    const result = await submitLpSignup(product, email);
    if (result.ok) {
      setStatus(result.duplicate ? 'duplicate' : 'done');
    } else {
      setErrorMessage(result.message);
      setStatus('error');
    }
  }

  if (status === 'done' || status === 'duplicate') {
    return (
      <div className={styles.doneBox} role="status">
        <p className={styles.doneTitle}>
          {status === 'done' ? '登録ありがとうございます！' : 'すでに登録済みです'}
        </p>
        <p className={styles.doneText}>
          {productName} が公開されたら、いち早くお知らせします。
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <input
          type="email"
          className={styles.input}
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-label="メールアドレス"
          disabled={status === 'sending'}
        />
        <button type="submit" className={styles.submit} disabled={status === 'sending'}>
          {status === 'sending' ? '送信中…' : '事前登録する'}
        </button>
      </div>
      {status === 'error' && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
      <p className={styles.note}>
        メールアドレスは {productName} の先行案内のみに使用します。登録の解除はメール内の案内からいつでもできます。
      </p>
    </form>
  );
}
