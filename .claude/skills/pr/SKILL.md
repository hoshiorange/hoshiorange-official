---
name: pr
description: 現在のブランチをプッシュして PR を作成する定型フロー。宛先の自動判定（feature/→develop、post/→main）・body テンプレ・マージはユーザー手動、まで込み。「/pr」「PR作って」で起動。
---

# pr — PR 作成の定型フロー

## 手順
1. 未コミットの変更が残っていないか `git status` で確認（残っていれば先にコミットするか、ユーザーに扱いを確認）
2. `git push -u origin <ブランチ名>` でプッシュ
3. PR を作成する。宛先（base）はブランチ接頭辞で自動判定:
   - `feature/*` → **develop**
   - `post/*`（記事ファストレーン） → **main**
4. body は以下の構成（**`\n` エスケープ禁止・実際の改行を使う**。gh CLI 不在時は `mcp__github__create_pull_request` を使用）:

```
## 概要
（1〜3行で何のための変更か）

## 変更内容
（箇条書き。セクション分けは変更が多いときだけ）

## 検証
（verify の実施内容と結果。ドキュメントのみなら「コード変更なし」）

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

5. PR URL をユーザーに報告し、**手動 squash merge を依頼**する（マージ代行は禁止）
6. worklog の実施プランに PR リンクを記録する

## 注意
- post/ ブランチの PR は content 配下（記事ファイル）のみの変更であることを作成前に確認する。コード変更が混ざっていたら feature/ に切り直す
