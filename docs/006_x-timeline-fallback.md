# 006 X タイムライン埋め込みのフォールバック実装

## 背景
- `src/components/XTimeline/` が `platform.twitter.com/widgets.js` で `@hoshiorange` のタイムラインを埋め込む。
- 本番で X のシンジケーション API が **HTTP 429** を返し、iframe は挿入されるが **高さ0/中身が空** になる現象が発生。コードの不具合ではなく X 側の制限。
- ユーザー方針: 埋め込みは維持し、**空/失敗のときだけ** `@hoshiorange` へのリンク表示に自動で切り替える。

## 実施プラン
- [x] `feature/x-timeline-fallback` ブランチを main 最新から作成
- [x] 現状の埋め込み生成ロジックを把握
- [x] `twttr.widgets.createTimeline()` の返り値 Promise で成否判定
- [x] タイムアウト + iframe 高さチェックの保険判定を追加
- [x] 失敗時に `@hoshiorange` リンクカードへフォールバック（href=https://x.com/hoshiorange, target=_blank, rel=noopener noreferrer）
- [x] テーマ切替時の再描画でも同じ判定が働くようにし、タイマー/リスナーのリークを防止
- [x] `NEXT_PUBLIC_X_USERNAME` 未設定時のプレースホルダー挙動を維持
- [x] フォールバックカードを 620px・中央寄せにして 2 カラムの高さバランスを維持
- [x] ローカル dev で 429（空）時にフォールバックが出ることを確認
- [x] テーマ切替後も破綻しない（埋め込み/カードが二重生成しない）ことを確認
- [x] `npx tsc --noEmit` / `npm run build` 成功を確認

## 実装内容

### 成否判定の二段構え
1. **Promise 判定**: `widgets.createTimeline({ sourceType: 'profile', screenName }, container, renderOptions)` の返り値 Promise を使用。解決値が falsy（タイムライン要素が得られない）なら失敗扱い。
2. **高さチェック（保険）**: createTimeline 解決後、および 4000ms のタイムアウトで、生成された `iframe[id^="twitter-widget"]` の高さが 80px 未満（429 で空）なら失敗扱い。

→ 429 で iframe は挿入されるが高さ0、というまさに本番の状況をこの高さチェックで「失敗」と判定できる。

### フォールバック表示
- 失敗扱いになると `status` を `'fallback'` にし、埋め込みコンテナを `data-hidden="true"` で非表示にしてリンクカード `XFallback` を表示。
- カードは Contact と同じ X アイコン（SVG）+「@hoshiorange の最新ポストを見る →」+ アクセントオレンジの矢印。`min-height: 620px` / 中央寄せで 2 カラムの高さを維持。
- `prefers-reduced-motion: reduce` でホバーアニメーションを停止。ダーク/ライト両対応（既存 CSS 変数を使用）。

### テーマ切替・クリーンアップ
- `[username, theme]` の effect で毎回 `cancelled` フラグと `timeoutId` をクリーンアップ。テーマ切替で前回の判定タイマーが破棄され、二重登録・リークなし。
- `createTimeline` 非対応環境向けに、従来の anchor + `widgets.load()` 経路も保険として残置。

## ローカル確認結果
- dev (port 3000) で `#latest` を表示。X が 429 で **iframe 高さ0** の状態を再現。
- 高さチェックが失敗判定 → **フォールバックのリンクカードが表示**された（href=`https://x.com/hoshiorange`, target=`_blank`, rel=`noopener noreferrer`）。
- 埋め込みコンテナは `data-hidden="true"` で非表示、スケルトンも消える。
- テーマトグルをクリックして再描画 → 再び高さ0 → フォールバック1枚のみ表示。embed/iframe は1個ずつで二重生成なし（リークなし）を確認。

## ビルド確認
- `npx tsc --noEmit`: 成功（エラーなし）
- `npm run build`: 成功

## 変更ファイル
- `src/components/XTimeline/XTimeline.tsx`
- `src/components/XTimeline/XTimeline.module.css`

## 完了報告
埋め込みは維持しつつ、Promise 判定 + 高さチェックの二段構えで「空/失敗」を検出し、その場合のみ `@hoshiorange` へのリンクカードへ自動フォールバックする実装を完了。本番の 429（高さ0）ケースをローカルで再現し、フォールバックが正しく表示されること、テーマ切替後も二重生成・リークがないことを確認した。tsc / build いずれも成功。
