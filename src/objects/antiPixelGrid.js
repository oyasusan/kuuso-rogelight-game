import { ANTI_SPRITE_CONFIG } from '../constants.js';
import { inEllipse, symmetricSpan } from './pixelGridHelpers.js';

const { GRID_COLS: COLS, GRID_ROWS: ROWS } = ANTI_SPRITE_CONFIG;
const CENTER_COL = COLS / 2;

/**
 * アンチ 1 体ぶんのドット絵シルエット（フードを被った妨害者）を生成する
 * （純粋関数、Phaser 非依存）。
 * 各セルは 'base' | 'shade' | null。観客と同様、色は付けず 2 階調のみ返し、
 * AntiFan.js 側で setTint して着色する。
 */
export function buildAntiGrid() {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // フード
  const hoodCy = 2.6;
  const hoodRx = 2.6;
  const hoodRy = 2.3;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (inEllipse(col, row, CENTER_COL, hoodCy, hoodRx, hoodRy)) {
        grid[row][col] = 'base';
      }
    }
  }

  // 目（フードの奥に浮かぶ影）
  grid[3][CENTER_COL - 2] = 'shade';
  grid[3][CENTER_COL + 1] = 'shade';

  // マント（裾に向かって広がる。裾側を陰にして不穏さを出す）
  const shoulderHalf = 2.2;
  const hemHalf = 4.2;
  const bodyRowStart = 5;
  const bodyRowEnd = 10;
  const rowSpans = [];
  for (let row = bodyRowStart; row <= bodyRowEnd; row += 1) {
    const t = (row - bodyRowStart) / (bodyRowEnd - bodyRowStart);
    const span = symmetricSpan(
      CENTER_COL,
      shoulderHalf + (hemHalf - shoulderHalf) * t,
    );
    rowSpans[row] = span;
    for (let col = span[0]; col <= span[1]; col += 1) {
      grid[row][col] = row >= 8 ? 'shade' : 'base';
    }
  }

  // 肩の棘（マントの襟を尖らせて威圧感を出す）
  const [shoulderLeft, shoulderRight] = rowSpans[bodyRowStart];
  grid[bodyRowStart - 1][shoulderLeft - 1] = 'shade';
  grid[bodyRowStart - 1][shoulderRight + 1] = 'shade';

  return { cols: COLS, rows: ROWS, grid };
}
