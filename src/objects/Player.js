import Phaser from 'phaser';
import { DEPTH, PLAYER_CONFIG } from '../constants.js';

/**
 * プレイヤー（アイドル）。
 * WASD / 矢印キーで移動する。攻撃操作はなく、パフォーマンスは自動発動。
 */
export default class Player extends Phaser.Physics.Arcade.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setTint(PLAYER_CONFIG.COLOR);
    this.setDepth(DEPTH.PLAYER);
    this.setCollideWorldBounds(true);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    /** 移動速度（レベルアップ強化で変更できるようプロパティ化） */
    this.moveSpeed = PLAYER_CONFIG.SPEED;
  }

  /** 毎フレームの入力処理 */
  update() {
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    const dirX = (right ? 1 : 0) - (left ? 1 : 0);
    const dirY = (down ? 1 : 0) - (up ? 1 : 0);

    // 斜め移動が速くならないよう正規化する
    const velocity = new Phaser.Math.Vector2(dirX, dirY)
      .normalize()
      .scale(this.moveSpeed);
    this.setVelocity(velocity.x, velocity.y);
  }
}
