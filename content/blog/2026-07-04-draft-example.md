---
title: '（下書きサンプル）published: false の記事は公開されない'
description: 記事執筆の雛形。published を true にするまで一覧・ビルドに含まれない。
date: 2026-07-04
tags: [メモ]
published: false
# 転載記事の場合は以下を指定（記事上部に転載元リンクが表示される）
# sourceUrl: https://zenn.dev/hoshiorange/articles/xxxx
# sourceLabel: Zenn
---

この記事は `published: false` なので、本番の一覧にもビルドにも含まれません。
新しい記事を書くときはこのファイルをコピーして使えます。

## 使える記法

GFM（テーブル・打ち消し・タスクリスト）とシンタックスハイライトに対応しています。

```ts
export function hello(name: string): string {
  return `こんにちは、${name}！`;
}
```

| 項目 | 内容 |
| ---- | ---- |
| 形式 | Markdown（GFM） |
| 公開 | `published: true` にして `post/` ブランチ → main への PR |
