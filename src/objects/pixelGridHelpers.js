/** ドット絵グリッド生成の共通ヘルパー（楕円判定・左右対称の区間） */

/** (col, row) がセル中心（col+0.5, row+0.5）基準で楕円 (cx, cy, rx, ry) の内側かどうか */
export function inEllipse(col, row, cx, cy, rx, ry) {
  const dx = (col + 0.5 - cx) / rx;
  const dy = (row + 0.5 - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

/**
 * centerCol を軸に必ず左右対称になる整数区間 [left, right] を返す。
 * centerCol は列数が偶数のグリッドを想定（COLS / 2 が整数になる）。
 */
export function symmetricSpan(centerCol, halfWidth) {
  const half = Math.max(1, Math.round(halfWidth));
  return [centerCol - half, centerCol + half - 1];
}
