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
   * ステージ定義の各ブロックへ、観客を格子状（＋ランダムなずらし）に配置して生成する。
   * @param {typeof import('../constants.js').STAGES[number]} stage
   * @param {number} initialHeat 観客の初期 Heat
   * @returns {Audience[]}
   */
  spawnAudiences(stage, initialHeat) {
    const jitter = AUDIENCE_CONFIG.JITTER;
    const audiences = [];

    for (const block of stage.blocks) {
      const stepX = block.width / (block.cols - 1);
      const stepY = block.height / (block.rows - 1);

      for (let row = 0; row < block.rows; row += 1) {
        for (let col = 0; col < block.cols; col += 1) {
          const x =
            block.x + col * stepX + Phaser.Math.Between(-jitter, jitter);
          const y =
            block.y + row * stepY + Phaser.Math.Between(-jitter, jitter);
          audiences.push(new Audience(this.scene, x, y, initialHeat));
        }
      }
    }
    return audiences;
  }
}
