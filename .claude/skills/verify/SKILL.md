---
name: verify
description: このリポジトリの変更をエンドツーエンドで検証する（build＋スモーク方式）。コード変更後・コミット前に実行。tsc → build → dev 起動 → Playwright で主要ルートのスモーク確認＋変更箇所の実操作。
---

# verify — hoshiorange-official の動作検証

コード変更が実際に動くことを、ビルドと実ブラウザ操作で確認する。

## 手順
1. **型チェック**: `npx tsc --noEmit`
2. **ビルド**: `npm run build`（環境変数なしでも成功するのがこのリポジトリの前提。env 依存を新設した場合はフォールバックが機能しているか必ず確認）
3. **dev 起動**: `npm run dev` をバックグラウンドで起動（既定 3000。使用中なら 3001 に自動フォールバックするので、出力から実ポートを読むこと）
4. **Playwright MCP でスモーク確認**（各ルートで: 表示 OK・console error 0 件）
   - `/`（トップ。全セクション描画）
   - `/blog`・`/blog/[適当な記事]`（実装後）
   - `/lp/[候補slug]`（実装後）
   - `/lab/koori-no-nukemichi` と `/lab/koori-no-nukemichi/play`（ゲーム導線。リグレッション確認）
5. **変更箇所の実操作**: 今回の変更が提供する機能を実際に操作する（例: フォームなら送信して成功表示まで、リンクなら遷移先まで、計測なら Network タブでイベント送信を確認）
6. **テーマ確認（UI 変更時のみ）**: dark/light 切替で変更箇所が両テーマで破綻しないこと

## 注意
- ゲームコアを触った場合は `npx tsx src/games/koori-no-nukemichi/core/selftest.ts` も実行（37 assert）
- 終了時は起動した dev サーバーを停止する
- 結果は「何を確認して何が OK/NG だったか」を worklog に記録
