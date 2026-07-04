/**
 * プロダクト候補 LP のデータ定義。
 *
 * - LP は /lp/[slug] で 1 候補 = 1 ページ。ここに追加すればページが増える。
 * - 検証計画: 事前登録5人 or ユニーククリック50超で開発 GO
 *   （C:\git\note\worklog\個人開発\2026-07-04_月1万円プロダクト検証計画.md）。
 * - 文言は現状ドラフト（特に ai-digest / ai-stretch はコンセプト名のみからの起こし）。
 *   ユーザーレビューで差し替える前提。
 */

export interface LpFeature {
  title: string;
  description: string;
}

export interface LpCandidate {
  /** URL に使う slug（計測の product 識別子も兼ねる） */
  slug: string;
  /** プロダクト名（仮称可） */
  name: string;
  /** ヒーローのキャッチコピー */
  tagline: string;
  /** キャッチ下のリード文（1〜2文） */
  lead: string;
  /** 想定ユーザーの困りごと（共感パート） */
  problems: string[];
  /** 提供価値・機能（3つ程度） */
  features: LpFeature[];
  /** 想定価格の表示（未定なら省略） */
  price?: string;
  /** 開発ステータスの表示ラベル */
  status: string;
}

export const lpCandidates: LpCandidate[] = [
  {
    slug: 'stream-buddy',
    name: '配信AI相棒（仮称）',
    tagline: '視聴者ゼロの配信に、となりで盛り上げてくれる相棒を。',
    lead: '過疎配信のつらさは「無反応」。AI の相棒がリアクションやツッコミをオーバーレイに表示して、ひとり配信を会話のある配信に変えます。',
    problems: [
      'コメントが来ないので、話が続かない・心が折れる',
      '同時視聴者 0〜2 人の時間帯がいちばんつらい',
      '海外製の AI 配信ツールは日本語の会話が不自然',
    ],
    features: [
      {
        title: 'OBS に1分で導入',
        description: 'ブラウザソースを追加するだけ。配信サイト側の設定は不要です。',
      },
      {
        title: '日本語特化のリアクション',
        description: 'ゲームの見せ場や沈黙のタイミングで、自然な日本語の相槌・ツッコミ・質問を返します。',
      },
      {
        title: 'チャット欄には投稿しない安全設計',
        description: 'コメントはオーバーレイにのみ表示。配信プラットフォームの規約リスクを避けた設計です。',
      },
    ],
    price: '月500円（予定）',
    status: '開発中・事前登録受付中',
  },
  {
    slug: 'ai-digest',
    name: 'AI応答ダイジェスト（仮称）',
    tagline: '長い AI の応答、要点だけ先に。',
    lead: 'AI チャットの長文応答を自動で要約し、先にダイジェストを表示するブラウザ拡張。読む・待つ時間を減らして、判断だけに集中できます。',
    problems: [
      'AI の応答が長すぎて、結局ざっと流し読みしている',
      '複数の AI チャットを並行していると、どこで何を聞いたか迷子になる',
      '応答が終わるまで画面を見張ってしまう',
    ],
    features: [
      {
        title: '応答の要点を3行でプレビュー',
        description: '長文応答の結論・根拠・次のアクションを自動抽出して先頭に表示します。',
      },
      {
        title: '応答完了を通知',
        description: '生成が終わったらデスクトップ通知。画面を見張る必要がなくなります。',
      },
      {
        title: '会話をまたいだ検索',
        description: '過去の応答ダイジェストを横断検索。「あれどこで聞いたっけ」を解決します。',
      },
    ],
    status: '構想中・事前登録受付中',
  },
  {
    slug: 'ai-stretch',
    name: 'AI待ちストレッチ（仮称）',
    tagline: 'AI の待ち時間を、体のメンテ時間に。',
    lead: 'コード生成や画像生成の「待ち」の数十秒に、デスクでできるストレッチガイドを自動表示。開発者の座りっぱなしをすき間時間で解消します。',
    problems: [
      'AI の生成待ちで 1 日に何十回も手が止まる。その時間が積もっている',
      '座りっぱなしで肩・腰・目にきているが、まとまった運動時間は取れない',
      'ストレッチアプリは入れても起動しなくなる',
    ],
    features: [
      {
        title: '待ち時間を自動検知',
        description: 'AI ツールの生成開始をトリガーに、ちょうどよい長さのストレッチを提案します。',
      },
      {
        title: '30秒からのデスクストレッチ',
        description: '席を立たずにできるメニューを厳選。生成が終わったらすぐ作業に戻れます。',
      },
      {
        title: '積み上げが見える',
        description: '1 日のストレッチ回数・部位を自動記録。「待ち時間が資産になった」を実感できます。',
      },
    ],
    status: '構想中・事前登録受付中',
  },
];

export function getLpCandidate(slug: string): LpCandidate | undefined {
  return lpCandidates.find((c) => c.slug === slug);
}
