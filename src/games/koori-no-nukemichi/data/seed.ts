/**
 * シードデータ（サンプルステージ）。
 * LocalStageRepository が読み込む。将来 Supabase へ初期投入する際の元データにもなる。
 *
 * 盤面テキストのタイル: 0=氷床 / 1=壁・岩 / 2=通常床。
 * スタート・ゴールは座標（startX/Y, goalX/Y）で管理する。
 * 階層は 2 段（world=章 → stage）。
 *
 * 3 ステージで停止条件を一通り体験できるように設計:
 *   s1 縁での停止（(b)）
 *   s2 床での停止（(c)）＋ 壁での停止（(a)）
 *   s3 複数の壁を頼りに折れ曲がる
 */

import type { StageData } from '../core/types';
import type { World } from './repository';

const WORLD_ID = 'w1';

/** 章（world）。2 階層モデルの最上位。 */
export const seedWorlds: World[] = [{ id: WORLD_ID, title: 'こおりのもり', order: 1, published: true }];

export const seedStages: StageData[] = [
  {
    id: 's1',
    worldId: WORLD_ID,
    title: 'はじめのいっぽ',
    width: 5,
    height: 5,
    startX: 0,
    startY: 0,
    goalX: 4,
    goalY: 4,
    // 全面氷。右へ滑って縁、下へ滑って縁＝ゴール。
    data: '00000,00000,00000,00000,00000',
    order: 1,
    published: true,
    authorMoves: ['right', 'down'],
  },
  {
    id: 's2',
    worldId: WORLD_ID,
    title: 'かべをたよりに',
    width: 5,
    height: 5,
    startX: 0,
    startY: 0,
    goalX: 3,
    goalY: 2,
    // (0,2)=床 / (4,2)=壁。下→床で停止、右→壁の手前(=ゴール)で停止。
    data: '00000,00000,20001,00000,00000',
    order: 2,
    published: true,
    authorMoves: ['down', 'right'],
  },
  {
    id: 's3',
    worldId: WORLD_ID,
    title: 'まわりみち',
    width: 6,
    height: 6,
    startX: 0,
    startY: 0,
    goalX: 1,
    goalY: 3,
    // (5,0)/(0,3)/(4,4)=壁。右→下→左 と壁を頼りに折れてゴールへ。
    data: '000001,000000,000000,100000,000010,000000',
    order: 3,
    published: true,
    authorMoves: ['right', 'down', 'left'],
  },
];
