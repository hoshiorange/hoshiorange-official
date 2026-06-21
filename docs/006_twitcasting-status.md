# 006 ツイキャス配信状況の表示 — Latest セクション改修

Latest（最新の動き）セクションの「X タイムライン埋め込み枠」を、ツイキャス（TwitCasting）の配信状況表示に置き換えた。配信中なら目立つライブカード、オフライン時は最近の配信一覧、取得失敗・env 未設定時はツイキャスへのリンクカードを表示する。

## ツイキャス API v2 仕様（公式ドキュメント確認）
- ドキュメント: https://apiv2-doc.twitcasting.tv/
- 認証（**3 段フォールバック設計**。調査結果が割れたため両対応にした）:
  1. `TWITCASTING_ACCESS_TOKEN`（Bearer・OAuth2）があれば最優先 → `Authorization: Bearer <token>`
  2. 無ければ `TWITCASTING_CLIENT_ID` / `TWITCASTING_CLIENT_SECRET` の Basic 認証 → `Authorization: Basic base64(ClientID:ClientSecret)`
  3. どちらも無い／API エラー時は `{ ok:false }` → 「ツイキャスを見る →」リンクカードにフォールバック
  - 共通必須ヘッダ: `X-Api-Version: 2.0` / `Accept: application/json`
  - ※ 公式ドキュメント上 `GET /users/{id}`（is_live 含む）は Bearer を要求する記載があるため Bearer を優先。
    本番でアプリ Basic 認証でも通る可能性に備え Basic も第2候補として実装し、どちらでも動くようにした。
- 使用エンドポイント（いずれも screen_id = `hoshiorange` を user_id に使用可・Read 権限・60req/60sec）:
  - `GET /users/{user_id}` — ユーザー情報（`is_live` 含む）。ライブ判定の基準。
  - `GET /users/{user_id}/current_live` — ライブ中のみ現在の配信（movie / broadcaster）。
  - `GET /users/{user_id}/movies` — 過去配信一覧（新しい順、limit 最大 50）。
- 配信者は `hoshiorange`（screen_id）固定で実装。任意で `TWITCASTING_USER_ID` による上書きも可能にした。

## 実施プラン
- [x] ツイキャス API v2 の認証方式・エンドポイントを公式ドキュメントで確認
- [x] `feature/twitcasting-status` ブランチを作成（main 直コミットしない）
- [x] `src/types/twitcasting.ts` を新規作成（User / Movie / Result 型）
- [x] `src/lib/twitcasting.ts` を新規作成（Bearer 優先 → Basic → リンクの 3 段認証・is_live 判定・current_live・movies 取得、ISR、フォールバック）
- [x] `src/components/TwitCastingStatus/`（サーバーコンポーネント + CSS Modules）を新規作成
- [x] `src/components/LatestActivity/` を更新（XTimeline を外し TwitCastingStatus を配置）
- [x] 未使用化した `src/components/XTimeline/` を削除（他からの参照なしを grep で確認）
- [x] `.env.local.example` / `.env.local` に TwitCasting 変数を追記、X 変数に「未使用（将来用）」注記
- [x] `npx tsc --noEmit` 成功
- [x] ローカル（認証情報未設定）でフォールバック表示・ダーク/ライト・モバイルを Playwright で確認
- [x] `npm run build` 成功 → dev サーバーを再起動して復旧

## 実装内容
### 環境変数（すべてサーバー専用・NEXT_PUBLIC_ なし）
| 変数名 | 用途 |
|---|---|
| `TWITCASTING_ACCESS_TOKEN` | Bearer（OAuth2）アクセストークン。あれば最優先で使用 |
| `TWITCASTING_CLIENT_ID` | アプリの ClientID（Basic 認証・第2候補） |
| `TWITCASTING_CLIENT_SECRET` | アプリの ClientSecret（Basic 認証・第2候補） |
| `TWITCASTING_USER_ID`（任意） | 取得対象ユーザー。未設定なら `hoshiorange` |

最小セット: **`TWITCASTING_ACCESS_TOKEN` だけ**でリッチ表示が可能。Basic で通る環境なら **ClientID + ClientSecret の2つ**でも可。どちらも無ければリンク表示。

`.env.local.example`（追跡対象・プレースホルダーのみ）と `.env.local`（gitignore・空値＋コメント）に追記。秘密値はコミットしない。

### TwitCastingStatus の挙動
- **配信中**: 🔴 LIVE バッジ＋「ただいま配信中」＋ライブタイトル/サブタイトル/サムネ＋「視聴する →」CTA（`https://twitcasting.tv/hoshiorange`、新規タブ）。
- **オフライン（過去配信あり）**: 「最近の配信」一覧（最大4件、サムネ＋日時）＋「ツイキャスをすべて見る →」。
- **取得失敗 / env 未設定 / 履歴なし**: 「ツイキャスを見る →」リンクカード（空枠にしない）。
- サムネはツイキャスの動的 IP ホスト名のため `next/image` 非対応 → 通常 `<img>` を使用（remotePatterns 追加なし）。
- ISR: ユーザー情報/current_live は 90 秒、movies は 1800 秒。

### XTimeline / X 変数の扱い
- `XTimeline` は LatestActivity からのみ参照されていたため、参照除去後に**ディレクトリごと削除**。
- `NEXT_PUBLIC_X_USERNAME` は docs/README/Contact 等で言及が残るため**削除せず**、example/.env.local に「未使用（将来用）」と注記するに留めた。

## 完了報告
- 型チェック（`npx tsc --noEmit`）: 成功。
- 本番ビルド（`npm run build`）: 成功（7 ページ生成、型エラーなし）。
- ローカル確認: 認証情報未設定のためフォールバックの「ツイキャスを見る」リンクカードが正しく表示。デスクトップ2カラム / モバイル縦積み、ダーク・ライト両テーマでレイアウト崩れなし。
- build により dev の `.next` が壊れたため、`.next` 削除 → dev 再起動で復旧（http://localhost:3000 が 200 応答）。一時画像・Playwright 成果物は削除済み。

## 次にやること（ユーザー側）
1. ツイキャスでアプリ登録（https://twitcasting.tv/developer.php）。
   - 推奨: hoshiorange 本人の **アクセストークン（Bearer）** を取得し `TWITCASTING_ACCESS_TOKEN` に設定（最小セット = これ1つ）。
   - もしくは Basic で通るなら **ClientID + ClientSecret の2つ**でも可。
2. Vercel の環境変数に上記を登録（ローカル確認用に `.env.local` にも設定）。
3. 反映後、配信中はライブカード、オフライン時は最近の配信一覧が自動表示される。設定が無ければリンクカード表示のまま。
