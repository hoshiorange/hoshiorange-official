# 008 Laboratory ゲーム「こおりのぬけみち」追加 ＆ セクション順変更

## 概要
2 つの作業を 1 ブランチ（`feature/game-koori-no-nukemichi`）でまとめて実施。

1. Laboratory セクションにゲーム「こおりのぬけみち」の入口カードを追加し、クリックで
   専用ページ `/lab/koori-no-nukemichi`（同一タブ遷移）へ。遷移先は当面 Coming Soon 表示。
2. セクション表示順を変更：Laboratory を生配信情報（Streaming / LatestActivity）の **上** に移動。

## 実施プラン

### ゲーム追加
- [x] `src/data/labs.ts` に `koori-no-nukemichi`（category=game / url=`/lab/koori-no-nukemichi`）を追加
- [x] 内部リンク判定ヘルパー `isInternalUrl()` を追加（`/` 始まりはサイト内ページ）
- [x] `Laboratory.tsx` を内部リンク対応（内部パスは `next/link` で同一タブ、外部 URL は従来どおり別タブ）
- [x] 遷移先ページ `src/app/lab/koori-no-nukemichi/page.tsx` を新規作成（Coming Soon / 戻る導線 / metadata）
- [x] 専用スタイル `page.module.css`（ダーク/ライト・レスポンシブ・reduced-motion 整合）

### セクション順変更
- [x] `src/app/page.tsx` を Hero → Links → Laboratory → 生配信情報(Latest) → Contact に並べ替え
- [x] `Header.tsx` ナビ順を Links → Laboratory → Streaming → Contact に並べ替え
- [x] `Footer.tsx` ナビ順を同上に並べ替え
- [x] 各 id（#links / #lab / #latest / #contact）は変更せず順序のみ変更

### 確認
- [x] `npx tsc --noEmit` 成功
- [x] `npm run build` 成功（`/lab/koori-no-nukemichi` は静的プリレンダ）
- [x] dev（ポート 3009）で確認：カード表示 → クリックで遷移 → Coming Soon 表示 → 戻るでホーム
- [x] dev でセクション順・ヘッダー/フッターナビ順の一致、#lab アンカーが Laboratory に飛ぶことを確認
- [x] build で dev の `.next` が破損したため `.next` 削除 → dev 再起動で復旧

## 完了報告

### 追加・変更ファイル
- `src/data/labs.ts`：ゲーム 1 件追加、`isInternalUrl()` 追加
- `src/components/Laboratory/Laboratory.tsx`：内部リンク（next/link）対応
- `src/app/lab/koori-no-nukemichi/page.tsx`（新規）：Coming Soon ページ
- `src/app/lab/koori-no-nukemichi/page.module.css`（新規）：専用スタイル
- `src/app/page.tsx`：セクション順変更（Laboratory を Streaming の上へ）
- `src/components/Header/Header.tsx`：ナビ順変更
- `src/components/Footer/Footer.tsx`：ナビ順変更

### 新セクション順
Hero → Links → **Laboratory** → 生配信情報(Streaming/Latest) → Contact

### ナビ順（Header / Footer 共通）
Links → Laboratory → Streaming → Contact

### 内部リンク対応方式
`labs.ts` の `url` が `/` 始まりなら `isInternalUrl()` が true を返し、`Laboratory.tsx` の
カードを `next/link`（同一タブ）で描画。`http(s)://` 等の外部 URL は従来どおり
`<a target="_blank" rel="noopener noreferrer">` で別タブ。Coming Soon（url 無し / comingSoon:true）は
従来どおりクリック不可の `<div>`。

### ローカル確認結果
- tsc：成功 / build：成功
- dev：ポート 3009（既存ポート 3000/3001/3005 使用中のため未使用ポートを選択、二重起動なし）
- 動作：トップ Laboratory に「こおりのぬけみち」カード表示 → クリックで
  `/lab/koori-no-nukemichi` に内部遷移 → Coming Soon 表示 → 「ホームへ戻る」でホーム復帰、を確認

### 残課題（将来）
- 実ゲーム実装で Coming Soon ページを差し替え
- 説明文「氷の世界を進むミニゲーム。」は仮。確定後に差し替え
