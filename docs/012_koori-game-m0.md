# 012 こおりのぬけみち Milestone 0（コア＋最小Pixiプレイヤー）実装報告

> 計画の全体像（M0〜M2＋フェーズ2）は `docs/010_koori-game-plan.md`、ユーザー向けの
> Supabase/Google セットアップ手順は `docs/011_supabase-google-setup.md` を参照。
> 本ドキュメントは **M0 の実装・検証・完了報告**（実装担当）。

## 概要
「こおりのぬけみち」（氷床スライドパズル）の **M0** を実装した。範囲は次の3つ:
1. **純TSゲームコア**（盤面・滑走/停止/クリア判定・手数・アンドゥ/リセット）
2. **土台スキャフォールディング**（データ層 IF＋ローカルアダプタ、認証抽象＋devスタブ、アセットマニフェスト＋仮素材）
3. **最小 Pixi プレイヤー**（プレビュールート `/lab/koori-no-nukemichi/m0`）

設計の核（010 計画より）:
- コア＝純TSで描画から完全分離（将来スマホアプリ化で描画のみ差し替え再利用）。
- プレイヤー＝Pixi.js v8（`next/dynamic ssr:false` のクライアント専用）。
- データ層・認証は IF＋ローカル/devスタブ。**env 無しでもビルド＆全機能動作**（M1 で Supabase/Google を差し替え）。
- **既存の公開 Coming Soon（`/lab/koori-no-nukemichi`）は変更しない**。M0 はプレビュールートで動かす。

## M0 実施チェックリスト（実行ログ）
- [x] 最新 origin/main から `feature/koori-no-nukemichi` を作成（`feature/vercel-analytics` からは切らない）
- [x] pixi.js v8 導入（8.19.0）。@supabase は M1（今回入れない）
- [x] 自己完結ディレクトリ `src/games/koori-no-nukemichi/`（core / data / auth / assets / player）
- [x] コア: 型・盤面 encode/decode("111,101,121")・滑走/停止/クリア純粋関数・手数/方向列・アンドゥ/リセット
- [x] コア自己テスト（簡易アサート, `npx tsx`）— 37 assert / 全 pass
- [x] データ層: `StageRepository` IF＋`LocalStageRepository`（シード3ステージ）＋env ベースのアダプタ選択ファクトリ
- [x] 認証抽象: `AuthProvider` IF＋`DevAuthProvider`（ローカル isAdmin=true）
- [x] アセットマニフェスト（ice/wall/floor/mascot/goal/background/sfx_*）＋仮素材SVG（/public）
- [x] 最小 Pixi プレイヤー: 描画・キーボード(矢印/WASD)・スワイプ・D-pad・滑走アニメ・入力ロック・手数/クリア表示・アンドゥ/リセット・`prefers-reduced-motion`・ミュートSFXフック
- [x] プレビュールート `/lab/koori-no-nukemichi/m0`（全画面・夜固定・noindex）。Coming Soon は不変
- [x] `npx tsc --noEmit` 成功 / `npm run build` 成功（env 無し）
- [x] dev で描画・操作・クリア・コンソールエラー0件を Playwright で確認

## ディレクトリ / 主要ファイル
```
src/games/koori-no-nukemichi/
  core/            純TS・フレームワーク非依存
    types.ts       タイル(0=氷/1=壁/2=床)・方向・StageData・Board
    board.ts       encode/decode・アクセサ（盤外=壁扱い）
    slide.ts       computeSlide(): 滑走経路・停止位置・移動有無・クリア有無
    game.ts        GameEngine: move/undo/reset・手数・方向列
    index.ts       公開エントリ
  data/
    repository.ts  StageRepository IF（listWorlds/listStages/getStage/upsertStage）
    seed.ts        シード（ワールド/章/3ステージ）
    localRepository.ts  LocalStageRepository（インメモリ）
    index.ts       createStageRepository()（env でアダプタ選択。現状ローカル）
  auth/
    auth.ts / devAuth.ts / index.ts  AuthProvider IF＋DevAuthProvider＋ファクトリ
  assets/
    manifest.ts    論理名→仮素材パス＋M0暫定カラー
  player/          クライアント専用（Pixi v8）
    BoardRenderer.ts   Pixi 描画のカプセル化（コア非依存）
    GameApp.tsx        取りまとめ（読込→Pixi初期化→入力→状態表示）
    GameApp.module.css 全画面・夜固定の没入レイアウト
    KooriGame.tsx      next/dynamic ssr:false ラッパー
    useSfx.ts          ミュートSFXフック
  selftest.ts      コア自己テスト（npx tsx 実行）
public/games/koori-no-nukemichi/placeholders/  仮素材SVG（差し替え用）
src/app/lab/koori-no-nukemichi/m0/page.tsx      プレビュールート（既存 index は不変）
```

## 実装メモ
### 停止/クリアロジック（`slide.ts`）
`computeSlide(board, from, dir, goal)` を 1 マスずつ前進させ、
- 進行方向の隣が **壁/岩 or 盤外** → 手前で停止（reason `wall` / `edge`）
- **通常床** に乗った → そのマスで停止（reason `floor`）
を返す。盤外は `tileAt()` が Wall を返すため、縁と壁を同一視できる。`cleared` は **停止位置がゴールと一致した時のみ** true（氷上をゴール通過しただけでは false）。決定的・FW非依存で Node/ブラウザ両対応。`GameEngine` が手数（実移動のみ計上）・方向列（ランキング検証用）・1手アンドゥ・リセットを管理。

### 描画分離（`BoardRenderer`, Pixi v8）
`new Application()` → `await app.init()` → `app.canvas`、Graphics は `.roundRect()/.circle()/.poly()` ＋ `.fill()/.stroke()` チェーン。コアが返す `from→stop`（スライドは常に直線）を ease-out 補間でマスコット移動。`prefers-reduced-motion` 時は即時移動。滑走中は `animatingRef` で入力ロック。`ResizeObserver` で `layout()` 再計算。SSR 不可の Pixi は `KooriGame` が `next/dynamic ssr:false` で遅延ロード（Hero3D/ContactVisual と同方針）→ ページはサーバーコンポーネントのまま。

### シードステージ（停止条件を網羅）
- s1「はじめのいっぽ」5x5 全氷: 右→下（縁停止×2）＝ゴール。
- s2「かべをたよりに」5x5: 下（床停止）→右（壁手前=ゴール）。
- s3「まわりみち」6x6: 右→下→左（壁を頼りに折れる）。

## 確認結果
- `npx tsc --noEmit`: 成功（exit 0）
- `npm run build`: 成功（env 無し / 全 9 ルート）。`/lab/koori-no-nukemichi/m0` は静的プリレンダ・First Load 約 105 kB（Pixi は dynamic で遅延ロードのため First Load に含めない）。既存 `/lab/koori-no-nukemichi` は不変（375 B）。
- コア自己テスト（`npx tsx src/games/koori-no-nukemichi/selftest.ts`）: 37 passed / 0 failed。
- dev（Playwright, ポート3002）: `/m0` で盤面・マスコット・ゴール・HUD を夜テーマで描画。ArrowRight→ArrowDown で「クリア！ 2 手でゴール」を確認。コンソールエラー 0 件。既存 Coming Soon ページも従来どおり表示。

## 起動 / プレビュー方法
1. `npm install`（pixi.js を取得）
2. `npm run dev` → ブラウザで **`http://localhost:3000/lab/koori-no-nukemichi/m0`**（ポートが使用中なら自動で 3001/3002 等）
3. 操作: 矢印キー / WASD / 画面右下の D-pad / スワイプ。s1 は「右 → 下」でクリア。
4. コア検証: `npx tsx src/games/koori-no-nukemichi/selftest.ts`

## 完了報告
M0 を完了。純TSコア（滑走/停止/クリア/手数/アンドゥ/リセット）＋最小 Pixi プレイヤーを実装し、`/lab/koori-no-nukemichi/m0` でプレイ可能（既存 Coming Soon は不変）。データ層・認証はローカル/devスタブで動作し、M1 で Supabase / Google OAuth に差し替え可能な拡張点を用意。tsc / build / 自己テスト / ブラウザ動作いずれも良好。次は M1（`docs/011` の準備が揃い次第、Supabase アダプタ＋ Google ログイン＋エディタ）。

### ユーザーがやること
- 並行して `docs/011_supabase-google-setup.md` に沿って Supabase / Google OAuth を準備（M1 で使用）。
- 本ブランチ（`feature/koori-no-nukemichi`）の PR マージ判断（マージは手動 squash）。
