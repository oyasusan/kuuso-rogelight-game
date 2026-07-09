import { AUDIENCE_SPRITE_CONFIG } from '../constants.js';
import { inEllipse, symmetricSpan } from './pixelGridHelpers.js';

const { GRID_COLS: COLS, GRID_ROWS: ROWS } = AUDIENCE_SPRITE_CONFIG;
const CENTER_COL = COLS / 2;

/**
 * 観客 1 人ぶんのドット絵シルエットを生成する（純粋関数、Phaser 非依存）。
 * 各セルは 'base' | 'shade' | null。
 * 色は付けず 2 階調の形状データのみを返す。Heat による色（青→赤→黄）は
 * Audience.js 側で setTint しているため、多色で塗ると tint で濁ってしまう
 * （tint は乗算されるので、白地に近いほど狙った色がそのまま出る）。
 */
export function buildAudienceGrid() {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // 頭
  const headCy = 2.2;
  const headRx = 1.8;
  const headRy = 1.7;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (inEllipse(col, row, CENTER_COL, headCy, headRx, headRy)) {
        grid[row][col] = 'base';
      }
    }
  }

  // 胴体（台形。裾側を陰にして立体感を出す）
  const shoulderHalf = 1.4;
  const hemHalf = 2.3;
  const bodyRowStart = 4;
  const bodyRowEnd = 8;
  const rowSpans = [];
  for (let row = bodyRowStart; row <= bodyRowEnd; row += 1) {
    const t = (row - bodyRowStart) / (bodyRowEnd - bodyRowStart);
    const span = symmetricSpan(
      CENTER_COL,
      shoulderHalf + (hemHalf - shoulderHalf) * t,
    );
    rowSpans[row] = span;
    for (let col = span[0]; col <= span[1]; col += 1) {
      grid[row][col] = row >= 7 ? 'shade' : 'base';
    }
  }

  // 両腕を高く上げる（ペンライトを振っているポーズ）
  const [shoulderLeft, shoulderRight] = rowSpans[bodyRowStart];
  for (let row = 1; row <= 4; row += 1) {
    grid[row][shoulderLeft - 1] = 'base';
    grid[row][shoulderRight + 1] = 'base';
  }
  grid[0][shoulderLeft - 1] = 'shade';
  grid[0][shoulderRight + 1] = 'shade';

  // 脚
  const [legLeft, legRight] = symmetricSpan(CENTER_COL, 0.8);
  for (let row = 9; row < ROWS; row += 1) {
    grid[row][legLeft] = 'shade';
    grid[row][legRight] = 'shade';
  }

  return { cols: COLS, rows: ROWS, grid };
}
