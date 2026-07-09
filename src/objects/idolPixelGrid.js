import { IDOL_SPRITE_CONFIG } from '../constants.js';

const { GRID_COLS: COLS, GRID_ROWS: ROWS } = IDOL_SPRITE_CONFIG;
/** 対称性の軸。セル中心（col + 0.5）でサンプリングするため COLS/2 が正しい中心になる */
const CENTER_COL = COLS / 2;

function inEllipse(col, row, cx, cy, rx, ry) {
  const dx = (col + 0.5 - cx) / rx;
  const dy = (row + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

/** CENTER_COL を軸に必ず左右対称になる整数区間 [left, right] を返す */
function symmetricSpan(halfWidth) {
  const half = Math.max(1, Math.round(halfWidth));
  return [CENTER_COL - half, CENTER_COL + half - 1];
}

/**
 * ドット絵アイドルのシルエットを生成する（純粋関数、Phaser 非依存）。
 * 各セルは 'hair' | 'skin' | 'eye' | 'outfitBase' | 'outfitShadow' | 'trim' | 'boot' | null。
 * 色を持たない形状データのみを返すため、Node からも import してプレビューできる
 * （楕円・台形の数式でシルエットを組み立てているのは、手描きのドット配置だと
 * 左右非対称になりやすく崩れて見えるのを避けるため）。
 */
export function buildIdolGrid() {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  const headCy = 3.2;
  const headRx = 4.2;
  const headRy = 3.6;
  const faceCy = headCy + 0.9;
  const faceRx = headRx * 0.55;
  const faceRy = headRy * 0.55;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (inEllipse(col, row, CENTER_COL, headCy, headRx, headRy)) {
        grid[row][col] = inEllipse(col, row, CENTER_COL, faceCy, faceRx, faceRy)
          ? 'skin'
          : 'hair';
      }
    }
  }

  // ツインテール（頭のシルエットに隙間なくつながるよう、根元は広めに描く）
  for (let row = 0; row <= 5; row += 1) {
    for (const col of [0, 1, 2, 11, 12, 13]) {
      grid[row][col] = 'hair';
    }
  }
  for (let row = 6; row <= 11; row += 1) {
    for (const col of [0, 1, 12, 13]) {
      grid[row][col] = 'hair';
    }
  }

  // 目
  grid[4][5] = 'eye';
  grid[4][8] = 'eye';

  // 首
  for (let row = 6; row <= 7; row += 1) {
    for (let col = 5; col <= 8; col += 1) {
      grid[row][col] = 'skin';
    }
  }

  // 胴体（台形のドレス）
  const shoulderHalf = 2.5;
  const hemHalf = 4.5;
  const bodyRowStart = 8;
  const bodyRowEnd = 15;
  const rowSpans = [];
  for (let row = bodyRowStart; row <= bodyRowEnd; row += 1) {
    const t = (row - bodyRowStart) / (bodyRowEnd - bodyRowStart);
    const span = symmetricSpan(shoulderHalf + (hemHalf - shoulderHalf) * t);
    rowSpans[row] = span;
    for (let col = span[0]; col <= span[1]; col += 1) {
      grid[row][col] = row >= 12 ? 'outfitShadow' : 'outfitBase';
    }
  }
  // 襟とヘムのトリム（キャラクターの差し色）
  for (let col = 0; col < COLS; col += 1) {
    if (grid[bodyRowStart][col] === 'outfitBase') {
      grid[bodyRowStart][col] = 'trim';
    }
    if (grid[bodyRowEnd][col]) {
      grid[bodyRowEnd][col] = 'trim';
    }
  }

  // 腕（肩の端に直接つながる、軽く上げたポーズ）
  const [shoulderLeft, shoulderRight] = rowSpans[bodyRowStart];
  grid[7][shoulderLeft - 1] = 'skin';
  grid[6][shoulderLeft - 1] = 'skin';
  grid[7][shoulderRight + 1] = 'skin';
  grid[6][shoulderRight + 1] = 'skin';

  // 脚とブーツ
  const [legLeft, legRight] = symmetricSpan(2);
  for (let row = 16; row <= 17; row += 1) {
    grid[row][legLeft] = 'skin';
    grid[row][legLeft + 1] = 'skin';
    grid[row][legRight - 1] = 'skin';
    grid[row][legRight] = 'skin';
  }
  for (const col of [legLeft, legLeft + 1]) {
    grid[18][col] = 'boot';
  }
  for (const col of [legRight - 1, legRight]) {
    grid[18][col] = 'boot';
  }

  return { cols: COLS, rows: ROWS, grid };
}
