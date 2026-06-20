# 002 About セクション廃止・Hero へ統合

## 概要
About セクションを独立セクションとして廃止し、その役割（「ほしの活動拠点であることを示す」）を Hero に1文（リード文）として統合する。

## 確定事項（ユーザー承認済）
- Hero に入れる採用文面:
  「ほしの活動拠点です。X や YouTube など、いろんな場所での活動をここにまとめています。」
- About セクションは削除（独立セクションをやめる）。

## 実施プラン
- [x] 現状構成の把握（profile.ts / page.tsx / Hero / About / Header / Footer / sitemap）
- [x] feature ブランチ `feature/about-into-hero` を作成
- [x] profile.ts: `aboutBody` を削除し、Hero 用 `heroLead`（確定文面）を追加
- [x] Hero.tsx: `heroLead` を subTagline の下にサブテキストとして表示（データ駆動を維持）
- [x] Hero.module.css: `.lead` スタイルを追加（reduced-motion 停止対象にも追加）
- [x] Hero 内の飛び先消失リンク `#about` を修正（ghost CTA → `#contact`、scrollHint → `#links`）
- [x] page.tsx: About の import と描画を削除
- [x] Header.tsx: ナビから About 項目を削除
- [x] Footer.tsx: ナビから About リンクを削除
- [x] `src/components/About/` ディレクトリを削除
- [x] 他に `#about` / About 参照が残っていないか grep で確認（sitemap 含む）
- [x] `npm run build` で型エラー・未使用 import が無いことを確認
- [x] implementation-notes.md を更新
- [x] feature ブランチへコミット

## pillars（🎮🎨💻 の3カード）の扱い
- pillars は `About.tsx` 内のローカル定数として定義され、**About セクションでのみ表示**されていた（profile.ts や他コンポーネントには存在せず、他での再利用なし）。
- 本依頼の主旨は「About を廃止し Hero に1文統合」であり、pillars を別の場所へ移植する指示は無い。
- pillars を温存するために新セクションを設けるのは依頼範囲を超える「勝手な追加」になる。
- よって **About 廃止に伴い pillars も一旦落とす**判断とした（依頼の「一旦落とすのが安全」の選択肢に該当）。
- 将来、活動軸の3カードを別の見せ方で復活させたい場合は、別タスクとして改めて検討する。

## 飛び先消失リンクの扱い
- Hero の ghost CTA（旧「ほしについて」→ `#about`）: Contact セクションは存続するため「お仕事のご相談」→ `#contact` に変更。
- Hero の scrollHint（旧 `#about`）: 次の実セクションである `#links` に変更。
- Header / Footer ナビの About 項目: 削除（リンク切れを残さない）。

## 完了報告
- About セクションを完全に廃止し、その役割を Hero のリード文1文に統合した。
- 文面は `profile.heroLead` としてデータ駆動で管理（ハードコードしていない）。
- `#about` への参照（Header / Footer / Hero CTA / Hero scrollHint）をすべて解消し、リンク切れは無い。
- pillars は他で未使用のため About と共に削除（理由は上記）。
- `npm run build` 成功（型エラー・未使用 import なし）。
- ブランチ `feature/about-into-hero` へコミット済み。PR 作成・main マージは未実施（リーダーのユーザー確認後）。

## 変更ファイル一覧
- `src/data/profile.ts`（`aboutBody` 削除 → `heroLead` 追加）
- `src/components/Hero/Hero.tsx`（リード文表示・飛び先リンク修正）
- `src/components/Hero/Hero.module.css`（`.lead` 追加）
- `src/app/page.tsx`（About 削除）
- `src/components/Header/Header.tsx`（ナビから About 削除）
- `src/components/Footer/Footer.tsx`（ナビから About 削除）
- `src/components/About/`（ディレクトリごと削除）
- `.claude/rules/implementation-notes.md`（構成・残課題を更新）
- `docs/002_about-into-hero.md`（本ファイル）
