/**
 * サイト全体のプロフィール／メタデータ定数。
 * TODO: 文面・連絡先を本人情報に差し替える。
 */
export const profile = {
  /** サイト上の表示名 */
  displayName: 'ほし',
  /** 英表記（URL / OGP 等で使用） */
  handle: 'hoshiorange',
  /** ヒーローのキャッチコピー（仮） */
  tagline: '夜空に届け、ほしのつぶやき。',
  /** サブコピー */
  subTagline: 'ゲーム、創作、コード。三つの軌道を行き来する個人ハブ。',
  /** Hero のリード文（活動拠点であることを示す。旧 About の役割を統合） */
  heroLead:
    'ほしの活動拠点です。X や YouTube など、いろんな場所での活動をここにまとめています。',
  /** Contact メール（仮） */
  contactEmail: 'contact@hoshiorange.example',
  /** Contact 本文（仮） */
  contactBody:
    'お仕事のご依頼・コラボのお声がけ・案件の相談などお気軽にどうぞ。返信できる範囲で順次お返事します。',
  /** 著作権表記 */
  copyright: '© hoshiorange',
} as const;
