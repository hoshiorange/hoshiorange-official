/**
 * Pixi.js v8 による盤面描画のカプセル化。
 * ゲームロジック（core）には依存させず、「盤面を描く / マスコットを動かす」だけを担う。
 * M0 では仮素材としてプリミティブ図形（マニフェストの暫定カラー）で描画する。
 */

import { Application, Container, Graphics } from 'pixi.js';
import { Tile, type Board, type Vec2 } from '../core';
import { assetManifest } from '../assets/manifest';

/** レイアウト余白（盤面の周囲に確保する最小マージン px）。 */
const VIEWPORT_PADDING = 48;
const MIN_CELL = 36;
const MAX_CELL = 88;

export class BoardRenderer {
  private readonly app: Application;
  private readonly board: Board;
  private readonly goal: Vec2;

  private readonly root = new Container();
  private readonly tileGfx = new Graphics();
  private readonly goalGfx = new Graphics();
  private readonly mascot = new Container();
  private readonly mascotGlow = new Graphics();
  private readonly mascotStar = new Graphics();

  private cell = MIN_CELL;
  private current: Vec2;
  /** 実行中のスライドアニメ用 ticker コールバック（多重起動防止に参照を保持）。 */
  private tweenFn: ((ticker: { deltaMS: number }) => void) | null = null;

  constructor(app: Application, board: Board, goal: Vec2, start: Vec2) {
    this.app = app;
    this.board = board;
    this.goal = goal;
    this.current = { ...start };

    this.mascot.addChild(this.mascotGlow);
    this.mascot.addChild(this.mascotStar);
    // 描画順: タイル → ゴール → マスコット。
    this.root.addChild(this.tileGfx);
    this.root.addChild(this.goalGfx);
    this.root.addChild(this.mascot);
    this.app.stage.addChild(this.root);
  }

  /** 現在のキャンバスサイズに合わせて、セルサイズ・中央寄せ・各図形を再計算して描き直す。 */
  layout(viewportW: number, viewportH: number): void {
    const availW = Math.max(0, viewportW - VIEWPORT_PADDING * 2);
    const availH = Math.max(0, viewportH - VIEWPORT_PADDING * 2);
    const fit = Math.floor(Math.min(availW / this.board.width, availH / this.board.height));
    this.cell = Math.max(MIN_CELL, Math.min(MAX_CELL, isFinite(fit) ? fit : MIN_CELL));

    const boardW = this.cell * this.board.width;
    const boardH = this.cell * this.board.height;
    this.root.x = Math.round((viewportW - boardW) / 2);
    this.root.y = Math.round((viewportH - boardH) / 2);

    this.drawTiles();
    this.drawGoal();
    this.drawMascot();
    this.placeMascot(this.current);
  }

  /** マスコットを指定セルへ即座に移動（アンドゥ/リセット/縮小時に使用）。 */
  setMascotCell(cell: Vec2): void {
    this.stopTween();
    this.current = { ...cell };
    this.placeMascot(this.current);
  }

  /**
   * from → to へマスコットを直線補間で移動させる（スライドは常に直線）。
   * durationMs <= 0 なら即時移動。完了時に onDone を呼ぶ。
   */
  tweenMascot(from: Vec2, to: Vec2, durationMs: number, onDone: () => void): void {
    this.stopTween();
    this.current = { ...to };

    if (durationMs <= 0) {
      this.placeMascot(to);
      onDone();
      return;
    }

    const fromPx = this.cellCenter(from);
    const toPx = this.cellCenter(to);
    let elapsed = 0;

    const step = (ticker: { deltaMS: number }) => {
      elapsed += ticker.deltaMS;
      const t = Math.min(1, elapsed / durationMs);
      // ease-out（減速）で氷を滑って止まる感じを出す。
      const e = 1 - (1 - t) * (1 - t);
      this.mascot.x = fromPx.x + (toPx.x - fromPx.x) * e;
      this.mascot.y = fromPx.y + (toPx.y - fromPx.y) * e;
      if (t >= 1) {
        this.stopTween();
        this.placeMascot(to);
        onDone();
      }
    };
    this.tweenFn = step;
    this.app.ticker.add(step);
  }

  destroy(): void {
    this.stopTween();
    // root を破棄すれば配下の Graphics/Container もまとめて破棄される。
    this.root.destroy({ children: true });
  }

  // ---- 内部 ----

  private stopTween(): void {
    if (this.tweenFn) {
      this.app.ticker.remove(this.tweenFn);
      this.tweenFn = null;
    }
  }

  private cellCenter(cell: Vec2): Vec2 {
    return { x: cell.x * this.cell + this.cell / 2, y: cell.y * this.cell + this.cell / 2 };
  }

  private placeMascot(cell: Vec2): void {
    const c = this.cellCenter(cell);
    this.mascot.x = c.x;
    this.mascot.y = c.y;
  }

  private drawTiles(): void {
    const g = this.tileGfx;
    g.clear();
    const gap = Math.max(2, Math.round(this.cell * 0.06));
    const r = Math.max(4, Math.round(this.cell * 0.16));
    for (let y = 0; y < this.board.height; y += 1) {
      for (let x = 0; x < this.board.width; x += 1) {
        const tile = this.board.tiles[y][x];
        const px = x * this.cell + gap / 2;
        const py = y * this.cell + gap / 2;
        const size = this.cell - gap;
        const color =
          tile === Tile.Wall
            ? assetManifest.wall.color
            : tile === Tile.Floor
              ? assetManifest.floor.color
              : assetManifest.ice.color;
        g.roundRect(px, py, size, size, r).fill({ color });

        if (tile === Tile.Ice) {
          // 氷の艶: 左上に細い白いハイライト。
          g.roundRect(px + size * 0.16, py + size * 0.14, size * 0.5, size * 0.12, size * 0.06).fill({
            color: 0xffffff,
            alpha: 0.45,
          });
        } else if (tile === Tile.Floor) {
          // 床: 破線風の内枠で「滑らない」ことを示す。
          g.roundRect(px + size * 0.2, py + size * 0.2, size * 0.6, size * 0.6, r * 0.6).stroke({
            width: Math.max(2, this.cell * 0.04),
            color: 0x8a92c8,
            alpha: 0.7,
          });
        } else if (tile === Tile.Wall) {
          g.roundRect(px, py, size, size, r).stroke({
            width: Math.max(2, this.cell * 0.04),
            color: 0x475089,
            alpha: 0.9,
          });
        }
      }
    }
  }

  private drawGoal(): void {
    const g = this.goalGfx;
    g.clear();
    const c = this.cellCenter(this.goal);
    const color = assetManifest.goal.color;
    g.circle(c.x, c.y, this.cell * 0.34).stroke({ width: Math.max(3, this.cell * 0.06), color, alpha: 0.95 });
    g.circle(c.x, c.y, this.cell * 0.22).stroke({ width: Math.max(2, this.cell * 0.04), color, alpha: 0.6 });
    g.circle(c.x, c.y, this.cell * 0.08).fill({ color, alpha: 0.9 });
  }

  private drawMascot(): void {
    const glow = this.mascotGlow;
    const star = this.mascotStar;
    glow.clear();
    star.clear();

    const R = this.cell * 0.34; // 外半径
    const inner = R * 0.4; // 内半径（四芒星）
    glow.circle(0, 0, R * 1.25).fill({ color: assetManifest.mascot.color, alpha: 0.22 });

    const points: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 4; // -90度起点、45度刻み
      const radius = i % 2 === 0 ? R : inner;
      points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    star.poly(points).fill({ color: assetManifest.mascot.color });
    star.stroke({ width: Math.max(2, this.cell * 0.03), color: 0xffd9b0, alpha: 0.9 });
    star.circle(0, 0, R * 0.22).fill({ color: 0xfff3e6 });
  }
}
