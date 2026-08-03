/**
 * 新・第3章（開放盤）の本番投入 SQL を出力。
 * 実行: npx tsx scripts/koori-emit-chapter3-sql.ts
 *
 * 既存の world（order=3「第3層 極氷の試練」）は残し、その配下 stage を入れ替える前提。
 * world 行は INSERT しない（world_id は order=3 のサブクエリで取得）。
 */
import { readFileSync } from 'node:fs';

const CREATED_BY = '6b27d4ed-27b7-4223-ac59-87b70f0866a5';
const jsonPath =
  'C:\\Users\\kei21\\AppData\\Local\\Temp\\claude\\C--git-hoshiorange-official\\b8ec16ce-d778-4bcf-8da5-d46cbe9c9ab7\\scratchpad\\koori-chapter3.json';

interface Stage {
  width: number;
  height: number;
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
  data: string;
  movesStr: string;
  title: string;
  orderInWorld: number;
}
interface Doc {
  world: { title: string; order: number; published: boolean };
  stages: Stage[];
}

const doc = JSON.parse(readFileSync(jsonPath, 'utf8')) as Doc;
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const rows = doc.stages
  .map(
    (s) =>
      `(${s.orderInWorld}, ${q(s.title)}, ${s.width}, ${s.height}, ${s.startX}, ${s.startY}, ${s.goalX}, ${s.goalY}, ${q(s.data)}, ${q(s.movesStr)})`,
  )
  .join(',\n    ');

const sql = `insert into public.stage
  (world_id, order_in_world, title, width, height, startx, starty, goalx, goaly, data, author_moves, published, created_by)
select w.id, v.order_in_world, v.title, v.width, v.height, v.startx, v.starty, v.goalx, v.goaly, v.data, v.author_moves, true, '${CREATED_BY}'::uuid
from (values
    ${rows}
) as v(order_in_world, title, width, height, startx, starty, goalx, goaly, data, author_moves)
cross join (select id from public.world where "order" = 3) as w;`;

console.log(sql);
