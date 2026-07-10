import Phaser from 'phaser';
import { DEPTH, PLAYER_CONFIG } from '../constants.js';

/**
 * プレイヤー（アイドル）。
 * WASD / 矢印キー、またはタッチデバイスでは仮想パッド（virtualJoystick）で移動する。
 * 攻撃操作はなく、パフォーマンスは自動発動。
 */
export default class Player extends Phaser.Physics.Arcade.Image {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} textureKey ドット絵アイドルのテクスチャキー（例: 'idol-aika'）
   */
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.PLAYER);
    this.setCollideWorldBounds(true);

    // 見た目のスプライト（頭〜足まで含む縦長のドット絵）に関わらず、
    // 当たり判定は胴体中心付近に絞ったサイズにする
    const diameter = PLAYER_CONFIG.RADIUS * 2;
    this.body.setSize(diameter, diameter);
    this.body.setOffset(
      (this.width - diameter) / 2,
      (this.height - diameter) / 2,
    );

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    /** 移動速度（レベルアップ強化で変更できるようプロパティ化） */
    this.moveSpeed = PLAYER_CONFIG.SPEED;
    /** 経験値オーブの吸収範囲（px）。レベルアップ強化で拡大する */
    this.magnetRadius = PLAYER_CONFIG.MAGNET_RADIUS;
    /** 最後に移動した方向（ラジアン）。ダンスの扇形の向きに使う */
    this.facingAngle = -Math.PI / 2;
    /**
     * 仮想パッド（VirtualJoystick）。タッチデバイスのみ GameScene が生成して
     * ここへセットする。未設定なら null のままでキーボードのみで動作する
     */
    this.virtualJoystick = null;
  }

  /** 毎フレームの入力処理 */
  update() {
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    let dirX = (right ? 1 : 0) - (left ? 1 : 0);
    let dirY = (down ? 1 : 0) - (up ? 1 : 0);
    let magnitude = dirX !== 0 || dirY !== 0 ? 1 : 0;

    // 仮想パッドの入力があればキーボードより優先する（傾きの割合をそのまま速度に使う）
    const joyVector = this.virtualJoystick?.getVector();
    if (joyVector && (joyVector.x !== 0 || joyVector.y !== 0)) {
      dirX = joyVector.x;
      dirY = joyVector.y;
      magnitude = Math.min(1, Math.hypot(dirX, dirY));
    }

    if (magnitude === 0) {
      this.setVelocity(0, 0);
      return;
    }

    // 斜め移動が速くならないよう正規化してから、傾きの割合で速度を落とす
    const velocity = new Phaser.Math.Vector2(dirX, dirY)
      .normalize()
      .scale(this.moveSpeed * magnitude);
    this.setVelocity(velocity.x, velocity.y);
    this.facingAngle = Math.atan2(dirY, dirX);
  }
}
