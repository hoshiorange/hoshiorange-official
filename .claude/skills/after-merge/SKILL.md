---
name: after-merge
description: PR マージ後の定例フローを一括実行する。develop 最新化・マージ済み feature/post ブランチの削除・prune・（post→main の場合は develop への同期）まで。「/after-merge」「マージしたよ」「片付けて」で起動。
---

# after-merge — マージ後の定例フロー

ユーザーが PR を手動 squash merge した後の片付けを一括で行う。

## 手順
1. `git fetch --prune origin` で最新化
2. マージされた PR のベースを確認する
   - **develop 宛て（feature/ ブランチ）の場合**: `git switch develop` → `git pull` → マージ済み feature ブランチをローカル・リモートとも削除（リモートは GitHub の自動削除で消えていることもある。エラーは無視してよい）
   - **main 宛て（post/ ブランチ＝記事ファストレーン）の場合**: `git switch main` → `git pull` → post ブランチをローカル・リモートとも削除 → さらに **develop に main を取り込む**（`git switch develop` → `git pull` → `git merge main` → `git push`）。これを怠ると次の develop→main リリース PR がコンフリクトする
3. `git branch -a` で残骸がないことを確認
4. 次の作業指示があれば、最新の develop（記事なら main）から新しいブランチを切って開始

## 禁止
- マージ操作そのものの代行（ユーザーが手動 squash merge する）
- main / develop への直接コミット・プッシュ（手順2の同期マージ push は例外として許可されている）
