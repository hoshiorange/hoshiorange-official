/**
 * サイト全体のプロフィール／メタデータ定数。
 * TODO: 文面・連絡先を本人情報に差し替える。
 */
export const profile = {
  /** サイト上の表示名 */
  displayName: 'ほし',
  /** 英表記（URL / OGP / Hero 見出しのサブラベル等で使用） */
  handle: 'hoshiorange',
  /** Hero のリード文（活動拠点であることを示す。旧 About の役割を統合） */
  heroLead:
    'ほしの活動拠点です。X や YouTube など、いろんな場所での活動をここにまとめています。',
  /**
   * Contact メール（未使用：現在の連絡導線は X のみ）。
   * UI からは参照していないが、将来メール窓口を復活させる場合に備えて残置。
   */
  contactEmail: 'contact@hoshiorange.example',
  /** Contact 本文（仮）。各 SNS 共通ハンドルでの連絡を促す案内（シックなトーン）。 */
  contactBody:
    'X や Discord など、ユーザー名「hoshiorange」までお気軽にご連絡ください。お仕事のご依頼・コラボ・ご相談など、返信できる範囲で順次お返事します。',
  /**
   * Contact で主役として大きく提示する共通ハンドル名。
   * 各 SNS（X / ツイキャス等）で同じユーザー名を使っている前提で、
   * 「hoshiorange で見つけて連絡してね」というニュアンスを伝える。
   */
  contactHandle: 'hoshiorange',
  /**
   * 各 SNS の連絡導線。共通ハンドル「hoshiorange」で連絡してもらう想定。
   * - X … プロフィールへ直リンク（クリックで本人ページが開く）
   * - Discord … フレンド/DM 画面（@me）を開くだけのリンク。特定プロフィールには飛ばさない
   *   （ワンボタンで本人検索されるのを避けるため）。開いた先で自分で「hoshiorange」を
   *   検索 → 友達申請する流れ。hint にその案内を添える。
   * primary はリンク項目の中で 1 つだけ強調する CTA フラグ。
   */
  contactLinks: [
    {
      kind: 'X',
      label: 'X で hoshiorange を見る',
      href: 'https://x.com/hoshiorange',
      primary: true,
    },
    {
      kind: 'Discord',
      // フレンド/DM 画面を開くだけ（特定プロフィールへは飛ばさない）。
      label: 'Discord でフレンド申請',
      href: 'https://discord.com/channels/@me',
      // 開いた先で「hoshiorange」を検索して申請してもらうための短い案内。
      hint: '開いたら「hoshiorange」を検索して友達申請してください。',
    },
  ] as ReadonlyArray<{
    kind: 'X' | 'Discord';
    label: string;
    href?: string;
    primary?: boolean;
    hint?: string;
  }>,
  /** 著作権表記 */
  copyright: '© hoshiorange',
} as const;
