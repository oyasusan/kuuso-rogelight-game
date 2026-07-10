import Phaser from 'phaser';
import { DEPTH, EXP_ORB_CONFIG } from '../constants.js';

/**
 * アンチ撃破時に落ちる経験値オーブ。
 * プレイヤーが吸収範囲（player.magnetRadius）に入ると引き寄せられ、
 * 一定距離まで近づくと自動的に回収される（ExpOrbSystem を参照）。
 * オブジェクトプール（ExpOrbSystem のグループ）から取得して使う。
 */
export default class ExpOrb extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'exp-orb');
    this.setDepth(DEPTH.EFFECT);
    this.setTint(EXP_ORB_CONFIG.COLOR);
  }

  /**
   * プールから取り出して指定位置に出現させる。
   * @param {number} x
   * @param {number} y
   * @param {number} value 回収時に得られる経験値
   */
  spawn(x, y, value) {
    this.value = value;
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(0);
    if (this.body) {
      this.body.enable = true;
      this.body.setVelocity(0, 0);
    }
    // ポップインするような出現演出
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  /** 退場してプールへ戻る */
  despawn() {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
  }
}
