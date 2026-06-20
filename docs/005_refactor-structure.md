# 005 構造リファクタリング（挙動・見た目を変えない整理）

本セッションで機能追加を重ねた結果出てきた整理余地を、**挙動・見た目・レイアウトを一切変えずに**解消し、保守性を上げる作業。リグレッション厳禁。**コミットしない**（ユーザーレビュー後にリーダー指示）。

## 洗い出した重複・デッドコード

- `.section` ブロック（min-height:100svh; flex; justify-content:center; scroll-margin-top; padding）が
  LinkCards / LatestActivity / Laboratory / Contact の 4 つにコピーされている。
  - LinkCards / LatestActivity / Laboratory はほぼ同一。Contact は position/overflow/isolation 追加版。
- `HeroScene3D.tsx`（統合3Dシーン）はどこからも import されていない（HeroVisual のコメントで「残置」と明記）。
- `src/app/hero3d-preview/`（比較用の一時プレビューページ）は本番に不要。
- `Contact.module.css` の `.secondary` / `.divider` クラスが tsx から未参照。
- `src/data/profile.ts` の `contactEmail` が UI から未参照。
- `HeroVisual.tsx` と `ContactVisual.tsx` が同型（next/dynamic ssr:false の3Dラッパー）だが import パス表記が不揃い。
- `globals.css` の `.container` ユーティリティは誰も使っていない（各 module が独自定義）。

## 実施プラン

- [x] 現状構造の全把握（page/components/data/lib/types/globals）
- [x] HeroScene3D / hero3d-preview の参照ゼロ確認（tsc ベースライン: エラー無し）
- [x] dev(3001) 稼働確認（再起動しない）
- [x] デッドコード削除
  - [x] `src/components/Hero3D/HeroScene3D.tsx` 削除
  - [x] `src/app/hero3d-preview/`（page.tsx + preview.module.css）削除
  - [x] `Contact.module.css` の未使用 `.secondary` / `.divider` 削除（`.secondaryLink` は残す）
  - [x] `profile.ts` の `contactEmail` 削除
- [x] `.section` セクション枠の共通化（見た目不変で）
- [x] 3D dynamic ラッパーの表記統一（HeroVisual の import パスを ContactVisual に揃える）
- [x] `npx tsc --noEmit` 成功
- [x] `npm run build` 成功
- [x] dev(3001) で `/` 各セクション・dark/light・PC/mobile が同一であることを確認
- [x] implementation-notes.md を更新

## 完了報告

### 削除したデッドコード（参照ゼロ確認済）
- `src/components/Hero3D/HeroScene3D.tsx` … page/コンポーネントから未 import。HeroVisual のコメントが「残置」と明記していたのみ。削除に合わせ HeroVisual のコメントも更新。
- `src/app/hero3d-preview/`（page.tsx + preview.module.css）… 比較用一時ページ。削除後ビルドのルート一覧から消滅、dev で `/hero3d-preview` が 404 になることを確認。
- `Contact.module.css` の `.secondary` / `.divider` … tsx 未参照（`.secondaryLink` は将来用に残置）。
- `src/data/profile.ts` の `contactEmail` … UI 未参照。

### セクション枠の共通化（見た目不変）
- 4 セクション（LinkCards / LatestActivity / Laboratory / Contact）にコピーされていた `.section` 枠を
  `src/components/Section/Section.module.css` の `.sectionFrame` に集約。各 module から
  `composes: sectionFrame from '@/components/Section/Section.module.css'` で取り込む方式。
- `composes` は出力クラスが増えるだけで計算後スタイルは不変。Contact のみ position/overflow/isolation を自身に残置。
- 各 `.container` は幅が異なる（1120/1180/1080）ため共通化せず据え置き。
- 検証: dev(3001) で 4 セクションの computed style（min-height 900px / flex column / justify center /
  scroll-margin 68px / padding 80・120、Contact のみ position relative・overflow hidden・isolation isolate）が
  共通化前と完全一致することを確認。

### 3D ラッパー表記統一
- `HeroVisual.tsx` の dynamic import を相対パス → `@/` エイリアスに揃え、`ContactVisual.tsx` と統一。挙動同一。

### 検証結果
- `npx tsc --noEmit` … エラー 0（build 後の `.next` 型再生成込みで確認）。
- `npm run build` … 成功。ルート: `/`, `/_not-found`, `/icon.svg`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`（hero3d-preview は消滅）。
- リグレッション確認（Playwright, dev:3001）: PC・モバイル × ダーク・ライトの全 4 パターンで
  Hero / Latest / Links / Laboratory / Contact / Footer のレイアウト・配色・余白が従来どおり。
  コンソールのエラーはリファクタ無関係なもののみ（THREE.Clock deprecation warning、X syndication の 429、自分で叩いた 404）。
- 検証用スクリーンショットは削除済。

### コミット状況
- **未コミット**（ユーザーレビュー後にリーダー指示で行う方針のため、本作業ではコミット・プッシュしていない）。
