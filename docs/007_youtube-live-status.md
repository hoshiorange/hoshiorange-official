# 007 YouTube ライブ配信中ステータス表示

## 目的
YouTube チャンネルが「現在ライブ配信中か」を判定し、配信中であれば Latest セクションの
YouTube 枠上部に目立つ LIVE カードを表示する。配信していない／取得失敗時は従来どおり
最新動画グリッドのみを表示する。

## 実施プラン
- [x] `src/types/youtube.ts` に `YouTubeLiveVideo` / `YouTubeLiveResult` 型を追加
- [x] `src/lib/youtube.ts` に `getLiveStatus()` を追加（search.list eventType=live、ISR 120 秒）
- [x] `YouTubeLiveCard` コンポーネント（赤系 LIVE バッジ、ツイキャスとトーン統一）を新規作成
- [x] `YouTubeLatest` でライブ判定を並行取得し、配信中はカードを上部表示・見出しを LIVE 表示に
- [x] `prefers-reduced-motion` / レスポンシブ / SSR 維持
- [x] `npx tsc --noEmit` 成功
- [x] 実 API で eventType=live が 0 件 → isLive:false を確認
- [x] dev (localhost:3000) で 200・通常表示を確認
- [x] `npm run build` 成功

## 実装内容

### ライブ判定（`src/lib/youtube.ts` / `getLiveStatus()`）
- YouTube Data API v3 `search.list` を
  `part=snippet&channelId={CHANNEL_ID}&eventType=live&type=video&order=date&maxResults=1`
  で呼び出し、`items` が 1 件以上あれば「ライブ中」と判定。
- 戻り値の型 `YouTubeLiveResult`:
  - `{ ok:false, reason, message }` … env 未設定 / API エラー（フォールバック）
  - `{ ok:true, isLive:false }` … 正常取得・配信していない
  - `{ ok:true, isLive:true, live:{ id,title,thumbnail,url } }` … 配信中
- env（`YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID`）未設定や API エラーは安全に `ok:false`。
- ISR: ライブ状況は変化が早いため `revalidate: 120` 秒（最新動画一覧は既存どおり 1h のまま）。
- クォータ: `search.list` は 1 回 100 units。ISR で呼び出し回数を抑える旨をコメントに明記。

### 表示（`src/components/YouTubeLatest/`）
- `YouTubeLiveCard.tsx` / `YouTubeLiveCard.module.css` を新規追加。
  - 🔴 LIVE バッジ＋脈動ドット、「YouTube でライブ配信中！」ラベル、タイトル、サムネ、「見る →」CTA。
  - リンクは `https://www.youtube.com/watch?v=...`、`target=_blank` / `rel=noopener noreferrer`。
  - 色味・形状はツイキャスの `liveCard` に揃える（赤系ボーダー／グロー）。
  - サムネは `next/image` + `unoptimized`（`i.ytimg.com` は remotePatterns 許可済み）。
- `YouTubeLatest.tsx`:
  - `getLiveStatus()` と `fetchLatestYouTubeVideos(6)` を `Promise.all` で並行取得。
  - 配信中のみ本文グリッドの上に `YouTubeLiveCard` を表示。見出しドットを LIVE 表示（赤・脈動）に、
    lead を「ただいま YouTube でライブ配信中です。」に切替。
  - 配信していない／取得失敗時はカードを出さず従来の最新動画グリッドのみ。
- `YouTubeLatest.module.css` に `headingMarkLive` と脈動アニメ（`prefers-reduced-motion` で停止）を追加。

## 完了報告
- 変更ファイル: `src/types/youtube.ts` / `src/lib/youtube.ts` /
  `src/components/YouTubeLatest/YouTubeLatest.tsx` / `YouTubeLatest.module.css`
- 新規ファイル: `src/components/YouTubeLatest/YouTubeLiveCard.tsx` / `YouTubeLiveCard.module.css`
- すべて Server Component で完結。クライアント JS 追加なし。
- `npx tsc --noEmit` 成功 / `npm run build` 成功。
- 実 API 確認: 現在ライブしていないため eventType=live は 0 件 → `isLive:false` → ライブカード非表示の
  通常表示になることを確認済み（dev も HTTP 200）。
- ユーザー作業: PR を手動 squash merge すれば本番反映。追加の環境変数は不要
  （既存の `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` をそのまま使用）。
