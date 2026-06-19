# 003 Hero を「Official Hub」構成へ作り変え（案B：日本語併記・表示名主役）

## 背景
Hero のポエム調キャッチコピー（「夜空に届け、ほしのつぶやき。」）と星比喩のサブコピー
（「ゲーム、創作、コード。三つの軌道…」）が、リンクハブ／活動拠点という方針と不整合だった。
ユーザー確定の **案B** に従い、表示名「ほし」を主役にした見出しへ差し替える。

## 実施プラン
- [x] `src/components/Hero/Hero.tsx`：h1 のポエム2行を削除し、案B の見出し（大「ほし」＋小「hoshiorange — Official Hub」）へ差し替え
- [x] subTagline を表示している `<p class="sub">` を要素ごと削除
- [x] badge "Official Hub" は維持、lead（heroLead）は維持
- [x] `src/components/Hero/Hero.module.css`：見出しの大小2段組みスタイルへ調整（`.titleName` / `.titleSub` / `.titleDash` 追加、旧 `.titleLine1/2` `.titleAccent` `.sub` を整理）
- [x] 流体タイポ（clamp）と `prefers-reduced-motion: reduce` の整合を維持（`.sub` を停止リストから除去）
- [x] `src/data/profile.ts`：`tagline` / `subTagline` の他箇所参照を grep で確認 → 参照なしを確認のうえ両フィールド削除
- [x] `npm run build` 成功・型エラー/未使用 import なしを確認
- [x] 本ドキュメント作成＋ implementation-notes.md 更新

## tagline / subTagline 参照調査結果
`src` 配下の `.ts/.tsx` を grep で確認。

| フィールド | コード参照 | metadata/OGP/layout/sitemap |
|---|---|---|
| `tagline` | なし（どこからも未参照） | なし |
| `subTagline` | `Hero.tsx` の1箇所のみ（今回削除） | なし |

- metadata（`layout.tsx` の title/description）、`opengraph-image.tsx`、`sitemap.ts`、`robots.ts` いずれも
  両フィールドを参照していないことを確認。
- 残るヒットはドキュメント／ルールメモ（`docs/002...`、`.claude/rules/*.md`）のみで、実コードへの影響なし。
- 以上より両フィールドを安全に削除した（title/description を空にするような副作用なし）。

## 変更ファイルと要点
- `src/components/Hero/Hero.tsx`
  - h1 を `<span class="titleName">{profile.displayName}</span>`（大「ほし」）＋
    `<span class="titleSub">{profile.handle} — Official Hub</span>`（小英字行）へ差し替え。
  - subTagline の `<p class="sub">` を削除。badge と lead は維持。データ駆動（displayName / handle）を活用。
- `src/components/Hero/Hero.module.css`
  - `.title` を縦フレックスの2段組みコンテナに変更。
  - `.titleName`：`clamp(3.2rem, 11vw, 7rem)` の大見出し。旧 `.titleAccent` のオレンジグラデ＋下線グロウを継承。
  - `.titleSub`：`clamp(0.78rem, 2.2vw, 1.15rem)` の英字サブラベル（uppercase / letter-spacing）。
  - `.titleDash`：em ダッシュをアクセント色に。
  - 旧 `.titleLine1` `.titleLine2` `.titleAccent` `.sub` を削除。`prefers-reduced-motion` 停止リストから `.sub` を除去。
- `src/data/profile.ts`
  - `tagline` / `subTagline` を削除。`handle` のコメントを「Hero 見出しのサブラベル等で使用」に更新。

## 完了報告
- 案B 構成へ差し替え完了。h1 は「大きな『ほし』（オレンジグラデ＋下線グロウ）」＋
  その下に小さく「hoshiorange — Official Hub」を表示。badge "Official Hub" と heroLead は従来どおり。
- `tagline` / `subTagline` はコード・metadata 全体で未使用（subTagline は Hero の1箇所のみ）と確認し、安全に削除。
- `npm run build` 成功。型エラー・未使用 import なし。
- 流体タイポ（clamp）・`prefers-reduced-motion` 停止の整合を維持。
