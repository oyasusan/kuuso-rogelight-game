import Phaser from 'phaser';
import Audience from '../objects/Audience.js';
import { AUDIENCE_CONFIG } from '../constants.js';

/**
 * オブジェクトの生成を担当するシステム。
 * Phase1: 観客の一括生成
 * Phase2: アンチの定期スポーンを追加予定
 */
export default class SpawnSystem {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 観客を格子状（＋ランダムなずらし）に配置して生成する。
   * @returns {Audience[]}
   */
  spawnAudiences() {
    const { GRID, AREA } = AUDIENCE_CONFIG;
    const stepX = AREA.WIDTH / (GRID.COLS - 1);
    const stepY = AREA.HEIGHT / (GRID.ROWS - 1);

    const audiences = [];
    for (let row = 0; row < GRID.ROWS; row += 1) {
      for (let col = 0; col < GRID.COLS; col += 1) {
        const x =
          AREA.X + col * stepX + Phaser.Math.Between(-GRID.JITTER, GRID.JITTER);
        const y =
          AREA.Y + row * stepY + Phaser.Math.Between(-GRID.JITTER, GRID.JITTER);
        audiences.push(new Audience(this.scene, x, y));
      }
    }
    return audiences;
  }
}
