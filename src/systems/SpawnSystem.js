import Phaser from 'phaser';
import Audience from '../objects/Audience.js';
import AntiFan from '../objects/AntiFan.js';
import { ANTI_CONFIG, AUDIENCE_CONFIG, GAME } from '../constants.js';

/**
 * オブジェクトの生成を担当するシステム。
 * - 観客のライブ開始時の一括生成
 * - アンチのオブジェクトプール管理と画面外スポーン
 */
export default class SpawnSystem {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    /** アンチのオブジェクトプール */
    this.antiGroup = scene.physics.add.group({
      classType: AntiFan,
      maxSize: ANTI_CONFIG.POOL_SIZE,
    });
  }

  /**
   * アンチを画面外のランダムな位置に指定数スポーンさせる。
   * プールが満杯のときはそれ以上スポーンしない。
   */
  spawnAntis(count) {
    for (let i = 0; i < count; i += 1) {
      const anti = this.antiGroup.get();
      if (!anti) {
        return;
      }
      const { x, y } = this.randomOffscreenPosition();
      anti.spawn(x, y);
    }
  }

  /** 画面の四辺いずれかの外側の座標をランダムに返す */
  randomOffscreenPosition() {
    const margin = ANTI_CONFIG.SPAWN_MARGIN;
    const side = Phaser.Math.Between(0, 3);
    switch (side) {
      case 0: // 上
        return { x: Phaser.Math.Between(0, GAME.WIDTH), y: -margin };
      case 1: // 下
        return {
          x: Phaser.Math.Between(0, GAME.WIDTH),
          y: GAME.HEIGHT + margin,
        };
      case 2: // 左
        return { x: -margin, y: Phaser.Math.Between(0, GAME.HEIGHT) };
      default: // 右
        return {
          x: GAME.WIDTH + margin,
          y: Phaser.Math.Between(0, GAME.HEIGHT),
        };
    }
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
