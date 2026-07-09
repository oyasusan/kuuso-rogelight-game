import Phaser from 'phaser';
import Audience from '../objects/Audience.js';
import AntiFan from '../objects/AntiFan.js';
import { ANTI_CONFIG, AUDIENCE_CONFIG, DEPTH, OBSTACLE_CONFIG } from '../constants.js';

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
   * @param {number} count
   * @param {() => typeof import('../constants.js').ANTI_TYPES[number]} pickType
   *   スポーンごとに呼ばれ、そのアンチの種類を返す関数
   */
  spawnAntis(count, pickType) {
    for (let i = 0; i < count; i += 1) {
      const anti = this.antiGroup.get();
      if (!anti) {
        return;
      }
      const { x, y } = this.randomOffscreenPosition();
      anti.spawn(x, y, pickType());
    }
  }

  /**
   * 現在カメラに映っている範囲の四辺いずれかの外側の座標をランダムに返す。
   * ワールド全体ではなく「今プレイヤーに見えている範囲」基準にすることで、
   * 会場が広くなってもアンチがプレイヤーへ近づくまでの距離感を一定に保つ
   */
  randomOffscreenPosition() {
    const margin = ANTI_CONFIG.SPAWN_MARGIN;
    const view = this.scene.cameras.main.worldView;
    const side = Phaser.Math.Between(0, 3);
    switch (side) {
      case 0: // 上
        return { x: Phaser.Math.Between(view.left, view.right), y: view.top - margin };
      case 1: // 下
        return {
          x: Phaser.Math.Between(view.left, view.right),
          y: view.bottom + margin,
        };
      case 2: // 左
        return { x: view.left - margin, y: Phaser.Math.Between(view.top, view.bottom) };
      default: // 右
        return {
          x: view.right + margin,
          y: Phaser.Math.Between(view.top, view.bottom),
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

  /**
   * 障害物をワールド内のランダムな位置へ配置する（中箱以降のみ、ライブごとに再抽選）。
   * プレイヤーの初期位置付近と障害物どうしの重なりは避ける。
   * アンチは通り抜けられるよう、この静的グループとの collider はプレイヤーとしか張らない
   * （GameScene 側で設定する）。
   * @param {typeof import('../constants.js').STAGES[number]} stage
   * @returns {Phaser.Physics.Arcade.StaticGroup}
   */
  spawnObstacles(stage) {
    const group = this.scene.physics.add.staticGroup();
    const config = stage.obstacles;
    if (!config) {
      return group;
    }

    const { WORLD_MARGIN, SPAWN_EXCLUSION_RADIUS, MIN_GAP, MAX_ATTEMPTS_PER_OBSTACLE } =
      OBSTACLE_CONFIG;
    const centerX = stage.worldWidth / 2;
    const centerY = stage.worldHeight / 2;
    const placed = [];

    for (let i = 0; i < config.count; i += 1) {
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_OBSTACLE; attempt += 1) {
        const size = Phaser.Math.Between(config.minSize, config.maxSize);
        const margin = size / 2 + WORLD_MARGIN;
        const x = Phaser.Math.Between(margin, stage.worldWidth - margin);
        const y = Phaser.Math.Between(margin, stage.worldHeight - margin);

        if (Phaser.Math.Distance.Between(x, y, centerX, centerY) < SPAWN_EXCLUSION_RADIUS) {
          continue;
        }
        const overlaps = placed.some(
          (o) =>
            Phaser.Math.Distance.Between(x, y, o.x, o.y) <
            (size + o.size) / 2 + MIN_GAP,
        );
        if (overlaps) {
          continue;
        }

        const obstacle = group.create(x, y, 'obstacle');
        obstacle.setDisplaySize(size, size);
        obstacle.refreshBody();
        obstacle.setDepth(DEPTH.OBSTACLE);
        placed.push({ x, y, size });
        break;
      }
    }
    return group;
  }
}
