/**
 * 生成済み koori-stages.json から本番投入用 SQL を組み立てて標準出力に出す。
 * 実行: npx tsx scripts/koori-emit-sql.ts
 */
import { readFileSync } from 'node:fs';

const CREATED_BY = '6b27d4ed-27b7-4223-ac59-87b70f0866a5';
const jsonPath =
  'C:\\Users\\kei21\\AppData\\Local\\Temp\\claude\\C--git-hoshiorange-official\\b8ec16ce-d778-4bcf-8da5-d46cbe9c9ab7\\scratchpad\\koori-stages.json';

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
interface Chapter {
  title: string;
  order: number;
  stages: Stage[];
}

const doc = JSON.parse(readFileSync(jsonPath, 'utf8')) as { chapters: Chapter[] };

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const worldVals = doc.chapters
  .map((c) => `(${q(c.title)}, ${c.order}, true)`)
  .join(',\n    ');

const stageRows: string[] = [];
for (const c of doc.chapters) {
  for (const s of c.stages) {
    stageRows.push(
      `(${c.order}, ${s.orderInWorld}, ${q(s.title)}, ${s.width}, ${s.height}, ${s.startX}, ${s.startY}, ${s.goalX}, ${s.goalY}, ${q(s.data)}, ${q(s.movesStr)})`,
    );
  }
}

const sql = `with w as (
  insert into public.world (title, "order", published) values
    ${worldVals}
  returning id, "order"
)
insert into public.stage
  (world_id, order_in_world, title, width, height, startx, starty, goalx, goaly, data, author_moves, published, created_by)
select w.id, v.order_in_world, v.title, v.width, v.height, v.startx, v.starty, v.goalx, v.goaly, v.data, v.author_moves, true, '${CREATED_BY}'::uuid
from (values
    ${stageRows.join(',\n    ')}
) as v(world_order, order_in_world, title, width, height, startx, starty, goalx, goaly, data, author_moves)
join w on w."order" = v.world_order;`;

console.log(sql);
