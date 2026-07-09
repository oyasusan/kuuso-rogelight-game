import { buildIdolGrid } from './idolPixelGrid.js';
import { IDOL_SPRITE_CONFIG } from '../constants.js';

/** hex 色を factor 倍だけ暗くする（0〜1、小さいほど暗い） */
function darken(color, factor) {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

/**
 * キャラクターのドット絵テクスチャを生成する。
 * 同じ key で既に生成済みならスキップする（キャラクターごとに 1 度だけ生成すればよい）。
 * @param {Phaser.Scene} scene
 * @param {string} key テクスチャキー（例: 'idol-aika'）
 * @param {number} accentColor 髪・トリム・ブーツに使うキャラクターの差し色
 */
export function createIdolTexture(scene, key, accentColor) {
  if (scene.textures.exists(key)) {
    return;
  }

  const { cols, rows, grid } = buildIdolGrid();
  const {
    CELL_SIZE,
    SKIN_COLOR,
    EYE_COLOR,
    OUTFIT_BASE_COLOR,
    OUTFIT_SHADOW_COLOR,
    BOOT_DARKEN_FACTOR,
  } = IDOL_SPRITE_CONFIG;

  const palette = {
    hair: accentColor,
    trim: accentColor,
    boot: darken(accentColor, BOOT_DARKEN_FACTOR),
    skin: SKIN_COLOR,
    eye: EYE_COLOR,
    outfitBase: OUTFIT_BASE_COLOR,
    outfitShadow: OUTFIT_SHADOW_COLOR,
  };

  const graphics = scene.make.graphics({ add: false });
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = grid[row][col];
      if (!cell) {
        continue;
      }
      graphics.fillStyle(palette[cell]);
      graphics.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
  graphics.generateTexture(key, cols * CELL_SIZE, rows * CELL_SIZE);
  graphics.destroy();
}
